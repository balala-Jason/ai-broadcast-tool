import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { insertStyleTemplateSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// 获取风格模板列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const styleType = searchParams.get("styleType");
    const isActive = searchParams.get("isActive");

    let query = client
      .from("style_templates")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (styleType) {
      query = query.eq("style_type", styleType);
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Get style templates error:", error);
    return NextResponse.json(
      { error: "获取风格模板列表失败" },
      { status: 500 }
    );
  }
}

// 创建风格模板
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const processedData = {
      name: body.name,
      description: body.description || null,
      style_type: body.styleType || body.style_type,
      opening_rules: body.openingRules ? JSON.stringify(body.openingRules) : null,
      selling_rules: body.sellingRules ? JSON.stringify(body.sellingRules) : null,
      promotion_rules: body.promotionRules ? JSON.stringify(body.promotionRules) : null,
      closing_rules: body.closingRules ? JSON.stringify(body.closingRules) : null,
      tone_guidelines: body.toneGuidelines || null,
      example_scripts: body.exampleScripts ? JSON.stringify(body.exampleScripts) : null,
    };

    // 直接使用processedData，跳过zod验证
    const { data, error } = await client
      .from("style_templates")
      .insert(processedData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "数据验证失败", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Create style template error:", error);
    return NextResponse.json(
      { error: "创建风格模板失败" },
      { status: 500 }
    );
  }
}

// 更新风格模板
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少模板ID" }, { status: 400 });
    }

    const processedData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.name !== undefined) processedData.name = updateData.name;
    if (updateData.description !== undefined) processedData.description = updateData.description;
    if (updateData.styleType !== undefined) processedData.style_type = updateData.styleType;
    if (updateData.openingRules !== undefined) processedData.opening_rules = JSON.stringify(updateData.openingRules);
    if (updateData.sellingRules !== undefined) processedData.selling_rules = JSON.stringify(updateData.sellingRules);
    if (updateData.promotionRules !== undefined) processedData.promotion_rules = JSON.stringify(updateData.promotionRules);
    if (updateData.closingRules !== undefined) processedData.closing_rules = JSON.stringify(updateData.closingRules);
    if (updateData.toneGuidelines !== undefined) processedData.tone_guidelines = updateData.toneGuidelines;
    if (updateData.exampleScripts !== undefined) processedData.example_scripts = JSON.stringify(updateData.exampleScripts);
    if (updateData.isActive !== undefined) processedData.is_active = updateData.isActive;

    const { data, error } = await client
      .from("style_templates")
      .update(processedData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update style template error:", error);
    return NextResponse.json(
      { error: "更新风格模板失败" },
      { status: 500 }
    );
  }
}

// 删除风格模板
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少模板ID" }, { status: 400 });
    }

    const { error } = await client
      .from("style_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "风格模板已删除",
    });
  } catch (error) {
    console.error("Delete style template error:", error);
    return NextResponse.json(
      { error: "删除风格模板失败" },
      { status: 500 }
    );
  }
}
