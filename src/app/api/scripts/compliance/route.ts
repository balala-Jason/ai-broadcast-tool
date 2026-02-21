import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * 话术合规检查API
 * 
 * 检查话术内容是否符合广告法和平台规则
 */

const COMPLIANCE_CHECK_PROMPT = `你是一位专业的广告合规审核专家。请检查以下直播话术是否存在违规内容。

## 检查规则
1. 禁止使用绝对化用语（如"最"、"第一"、"唯一"等）
2. 禁止虚假宣传和夸大功效
3. 禁止使用未经证实的数据和案例
4. 禁止贬低其他品牌或产品
5. 禁止使用医疗用语或暗示治疗效果
6. 必须符合《广告法》相关规定

## 禁用词列表
{{PROHIBITED_WORDS}}

## 待检查的话术内容
{{SCRIPT_CONTENT}}

## 输出要求
请输出JSON格式的检查结果：
{
  "status": "pass|warning|fail",
  "score": 0-100,
  "issues": [
    {
      "type": "违规类型",
      "content": "违规内容",
      "position": "位置描述",
      "suggestion": "修改建议",
      "severity": "high|medium|low"
    }
  ],
  "summary": "整体评估说明",
  "passedContent": "通过检查的内容概要"
}

请开始检查：`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, productId } = body;

    if (!scriptId) {
      return NextResponse.json({ error: "缺少话术ID" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 获取话术内容
    const { data: script, error: scriptError } = await client
      .from("scripts")
      .select("*, products(prohibited_words)")
      .eq("id", scriptId)
      .single();

    if (scriptError || !script) {
      return NextResponse.json({ error: "话术不存在" }, { status: 404 });
    }

    // 构建话术内容
    const scriptContent = [
      `【开场白】\n${script.opening || ""}`,
      `【产品介绍】\n${script.product_intro || ""}`,
      `【卖点话术】\n${script.selling_points || ""}`,
      `【促销话术】\n${script.promotions || ""}`,
      `【逼单话术】\n${script.closing || ""}`,
    ].join("\n\n");

    // 获取禁用词
    const prohibitedWords = script.products?.prohibited_words || "暂无特殊禁用词";

    // 构建检查提示词
    const prompt = COMPLIANCE_CHECK_PROMPT
      .replace("{{PROHIBITED_WORDS}}", prohibitedWords)
      .replace("{{SCRIPT_CONTENT}}", scriptContent);

    // 调用LLM进行检查
    const messages = [{ role: "user" as const, content: prompt }];
    const response = await llmClient.invoke(messages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.2,
    });

    // 解析检查结果
    let checkResult = null;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        checkResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      checkResult = {
        status: "warning",
        score: 70,
        issues: [],
        summary: "无法解析检查结果，请人工审核",
        rawContent: response.content,
      };
    }

    // 更新话术的合规状态
    await client
      .from("scripts")
      .update({
        compliance_status: checkResult?.status || "warning",
        compliance_issues: checkResult?.issues ? JSON.stringify(checkResult.issues) : null,
        quality_score: checkResult?.score ? checkResult.score / 10 : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scriptId);

    return NextResponse.json({
      success: true,
      data: checkResult,
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    return NextResponse.json(
      { error: "合规检查失败" },
      { status: 500 }
    );
  }
}
