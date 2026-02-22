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
 * 每个环节生成5种以上选择，供用户挑选
 */

const SCRIPT_GENERATION_PROMPT = `你是一位专业的农产品直播带货话术撰写专家，精通抖音直播算法机制。请根据以下信息，生成一份符合抖音实战5段式结构的直播话术脚本。

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

请生成抖音实战5段式结构话术，**每个环节必须提供至少5种不同风格/角度的话术选择**，输出JSON格式：

{
  "warmUp": {
    "title": "预热环节",
    "target": "提升停留时长",
    "description": "吸引注意力，建立期待感，前3秒决定去留",
    "options": [
      {
        "id": "warm_1",
        "style": "悬念式",
        "script": "话术内容...",
        "tips": "使用技巧说明"
      },
      {
        "id": "warm_2",
        "style": "福利预告式",
        "script": "话术内容...",
        "tips": "使用技巧说明"
      },
      // 至少5种选择
    ]
  },
  "retention": {
    "title": "留人环节", 
    "target": "提升互动率",
    "description": "引导点赞、评论、关注，制造互动话题，提升直播间热度",
    "options": [
      {
        "id": "retain_1",
        "style": "提问互动式",
        "script": "话术内容...",
        "interactionType": "评论互动"
      },
      // 至少5种选择
    ]
  },
  "lockCustomer": {
    "title": "锁客环节",
    "target": "提升转化率", 
    "description": "深度介绍产品价值，解决痛点，建立信任，让观众产生购买意愿",
    "options": [
      {
        "id": "lock_1",
        "style": "故事代入式",
        "script": "话术内容...",
        "valuePoint": "核心价值点"
      },
      // 至少5种选择
    ]
  },
  "pushOrder": {
    "title": "逼单环节",
    "target": "提升GPM",
    "description": "制造紧迫感，限时优惠，促成立即下单",
    "options": [
      {
        "id": "push_1",
        "style": "限时秒杀式",
        "script": "话术内容...",
        "urgency": "紧迫点"
      },
      // 至少5种选择
    ]
  },
  "atmosphere": {
    "title": "气氛组",
    "target": "整体参与度",
    "description": "营造抢购氛围，感谢打赏，引导分享，维持直播间热度",
    "options": [
      {
        "id": "atm_1",
        "style": "感谢打赏式",
        "script": "话术内容...",
        "trigger": "使用时机"
      },
      // 至少5种选择
    ]
  },
  "complianceNotes": ["合规提醒1", "合规提醒2"],
  "estimatedDuration": "预估时长",
  "algorithmTips": "算法优化建议"
}

## 5段式话术核心逻辑
1. 预热环节（停留时长）：用悬念、福利预告、话题引子吸引观众停留，前3秒决定去留
2. 留人环节（互动率）：通过提问、投票、福利等方式引导互动，提升直播间权重
3. 锁客环节（转化率）：深入讲解产品价值，用故事、对比、证据建立信任
4. 逼单环节（GPM）：制造稀缺性、紧迫感，给观众立即行动的理由
5. 气氛组（参与度）：贯穿全程，感谢打赏、庆祝成交、引导分享，维持热度

## 话术风格参考（每个环节可选）
- 悬念式：制造好奇心，引发期待
- 福利预告式：预告优惠，吸引留存
- 提问互动式：引导评论，提升互动
- 故事代入式：用故事建立情感连接
- 对比冲击式：用对比突出价值
- 数据证明式：用数据增强可信度
- 限时秒杀式：制造时间紧迫感
- 库存告急式：制造稀缺感
- 感谢打赏式：维护粉丝关系
- 庆祝成交式：营造抢购氛围

## 注意事项
1. 每个环节必须提供至少5种不同风格的话术选择
2. 每种话术要有明确的风格标签和使用技巧说明
3. 话术要自然流畅，符合口语表达习惯
4. 促销话术要有紧迫感但不夸大
5. 必须遵守以下禁用词规则：{{PROHIBITED_WORDS}}
6. 充分利用参考素材中的优秀话术技巧

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
    let isControllerClosed = false;
    
    const stream = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (data: Uint8Array) => {
          if (isControllerClosed) return;
          try {
            controller.enqueue(data);
          } catch (e) {
            console.error("Enqueue failed:", e);
            isControllerClosed = true;
          }
        };
        
        const safeClose = () => {
          if (isControllerClosed) return;
          try {
            controller.close();
          } catch (e) {
            console.error("Close failed:", e);
          }
          isControllerClosed = true;
        };
        
        try {
          const messages = [{ role: "user" as const, content: prompt }];
          const llmStream = llmClient.stream(messages, {
            model: "doubao-seed-2-0-pro-260215",
            temperature: 0.8,
          });

          let fullContent = "";
          
          for await (const chunk of llmStream) {
            if (isControllerClosed) break;
            
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              
              // 发送SSE事件
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: text })}\n\n`)
              );
            }
          }

          // 如果控制器已关闭，不继续处理
          if (isControllerClosed) return;

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

          // 保存话术到数据库（抖音实战5段式结构）
          const scriptRecord = {
            product_id: productId,
            style_template_id: styleTemplateId,
            title: title || `${product.name} - ${styleTemplate.name}话术`,
            target_audience: targetAudience,
            duration: duration || 30,
            promotion_rules: promotionRules ? JSON.stringify(promotionRules) : null,
            // 抖音实战5段式
            warm_up: scriptData?.warmUp ? JSON.stringify(scriptData.warmUp) : null,
            retention: scriptData?.retention ? JSON.stringify(scriptData.retention) : null,
            lock_customer: scriptData?.lockCustomer ? JSON.stringify(scriptData.lockCustomer) : null,
            push_order: scriptData?.pushOrder ? JSON.stringify(scriptData.pushOrder) : null,
            atmosphere: scriptData?.atmosphere ? JSON.stringify(scriptData.atmosphere) : null,
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
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "done", 
              scriptId: savedScript?.id,
              scriptData 
            })}\n\n`)
          );
          
          safeClose();
        } catch (streamError) {
          console.error("Stream error:", streamError);
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(streamError) })}\n\n`)
          );
          safeClose();
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
