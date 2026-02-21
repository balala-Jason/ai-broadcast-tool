import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { 
  LLMClient, 
  Config, 
  HeaderUtils,
  KnowledgeClient 
} from "coze-coding-dev-sdk";

/**
 * AI话术生成API（流式输出）
 * 
 * 基于产品信息、风格模板和知识库素材，生成完整的直播话术脚本
 */

const SCRIPT_GENERATION_PROMPT = `你是一位专业的农产品直播带货话术撰写专家。请根据以下信息，生成一份完整的直播话术脚本。

## 产品信息
{{PRODUCT_INFO}}

## 风格模板
{{STYLE_TEMPLATE}}

## 参考素材
{{REFERENCE_MATERIALS}}

## 场景参数
- 目标人群：{{TARGET_AUDIENCE}}
- 直播时长：{{DURATION}}分钟
- 促销规则：{{PROMOTION_RULES}}

## 输出要求

请生成结构化的直播话术，输出JSON格式：

{
  "opening": "开场白（吸引注意力，建立信任）",
  "productIntro": "产品介绍（产地、品种、特点）",
  "sellingPoints": [
    {
      "point": "卖点名称",
      "script": "话术内容",
      "technique": "使用的修辞技巧"
    }
  ],
  "promotions": [
    {
      "type": "促销类型",
      "script": "促销话术",
      "urgency": "紧迫感营造方式"
    }
  ],
  "closing": "逼单话术（制造紧迫感，促成下单）",
  "faq": [
    {
      "question": "常见问题",
      "answer": "回答话术"
    }
  ],
  "complianceNotes": ["合规提醒"],
  "estimatedDuration": "预估时长"
}

## 注意事项
1. 话术要自然流畅，符合口语表达习惯
2. 卖点要具体可感知，避免空泛描述
3. 促销话术要有紧迫感但不夸大
4. 必须遵守以下禁用词规则：{{PROHIBITED_WORDS}}
5. 充分利用参考素材中的优秀话术技巧

请开始生成话术：`;

interface GenerateRequest {
  productId: string;
  styleTemplateId: string;
  targetAudience?: string;
  duration?: number;
  promotionRules?: Record<string, unknown>;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { productId, styleTemplateId, targetAudience, duration, promotionRules, title } = body;

    if (!productId || !styleTemplateId) {
      return NextResponse.json({ error: "缺少产品ID或风格模板ID" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    // 获取产品信息
    const { data: product, error: productError } = await client
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    // 获取风格模板
    const { data: styleTemplate, error: styleError } = await client
      .from("style_templates")
      .select("*")
      .eq("id", styleTemplateId)
      .single();

    if (styleError || !styleTemplate) {
      return NextResponse.json({ error: "风格模板不存在" }, { status: 404 });
    }

    // 从知识库检索相关素材
    let referenceMaterials = "";
    try {
      const searchQuery = `${product.name} ${product.category} 直播话术`;
      const searchResult = await knowledgeClient.search(searchQuery, undefined, 5, 0.5);
      
      if (searchResult.code === 0 && searchResult.chunks && searchResult.chunks.length > 0) {
        referenceMaterials = searchResult.chunks
          .map((chunk, i) => `[素材${i + 1}]\n${chunk.content}`)
          .join("\n\n");
      }
    } catch (searchError) {
      console.error("Knowledge search error:", searchError);
      // 搜索失败时继续生成，不使用参考素材
    }

    // 构建提示词
    const prompt = SCRIPT_GENERATION_PROMPT
      .replace("{{PRODUCT_INFO}}", JSON.stringify({
        name: product.name,
        category: product.category,
        origin: product.origin,
        price: product.price,
        specification: product.specification,
        sellingPoints: product.selling_points,
        certificates: product.certificates,
      }, null, 2))
      .replace("{{STYLE_TEMPLATE}}", JSON.stringify({
        name: styleTemplate.name,
        styleType: styleTemplate.style_type,
        toneGuidelines: styleTemplate.tone_guidelines,
        exampleScripts: styleTemplate.example_scripts,
      }, null, 2))
      .replace("{{REFERENCE_MATERIALS}}", referenceMaterials || "暂无参考素材")
      .replace("{{TARGET_AUDIENCE}}", targetAudience || "农产品消费者")
      .replace("{{DURATION}}", String(duration || 30))
      .replace("{{PROMOTION_RULES}}", JSON.stringify(promotionRules || {}, null, 2))
      .replace("{{PROHIBITED_WORDS}}", product.prohibited_words || "无特殊禁用词");

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [{ role: "user" as const, content: prompt }];
          const llmStream = llmClient.stream(messages, {
            model: "doubao-seed-2-0-pro-260215",
            temperature: 0.7,
          });

          let fullContent = "";
          
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              
              // 发送SSE事件
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: text })}\n\n`)
              );
            }
          }

          // 解析生成的内容
          let scriptData = null;
          try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              scriptData = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error("Parse script error:", parseError);
            scriptData = { rawContent: fullContent };
          }

          // 保存话术到数据库
          const scriptRecord = {
            product_id: productId,
            style_template_id: styleTemplateId,
            title: title || `${product.name} - ${styleTemplate.name}话术`,
            target_audience: targetAudience,
            duration: duration || 30,
            promotion_rules: promotionRules ? JSON.stringify(promotionRules) : null,
            opening: scriptData?.opening || null,
            product_intro: scriptData?.productIntro || null,
            selling_points: scriptData?.sellingPoints ? JSON.stringify(scriptData.sellingPoints) : null,
            promotions: scriptData?.promotions ? JSON.stringify(scriptData.promotions) : null,
            closing: scriptData?.closing || null,
            faq: scriptData?.faq ? JSON.stringify(scriptData.faq) : null,
            status: "draft",
          };

          const { data: savedScript, error: saveError } = await client
            .from("scripts")
            .insert(scriptRecord)
            .select()
            .single();

          if (saveError) {
            console.error("Save script error:", saveError);
          }

          // 发送完成事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "done", 
              scriptId: savedScript?.id,
              scriptData 
            })}\n\n`)
          );
          
          controller.close();
        } catch (streamError) {
          console.error("Stream error:", streamError);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(streamError) })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate script error:", error);
    return NextResponse.json(
      { error: "生成话术失败" },
      { status: 500 }
    );
  }
}
