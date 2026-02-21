import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { insertScriptSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// 获取话术列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    let query = client
      .from("scripts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 单独获取产品和模板信息
    let enrichedData = data || [];
    if (data && data.length > 0) {
      const productIds = [...new Set(data.map(s => s.product_id))];
      const templateIds = [...new Set(data.map(s => s.style_template_id))];
      
      const [productsRes, templatesRes] = await Promise.all([
        client.from("products").select("id, name, category").in("id", productIds),
        client.from("style_templates").select("id, name, style_type").in("id", templateIds),
      ]);
      
      const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));
      const templatesMap = new Map((templatesRes.data || []).map(t => [t.id, t]));
      
      enrichedData = data.map(script => ({
        ...script,
        products: productsMap.get(script.product_id) || null,
        style_templates: templatesMap.get(script.style_template_id) || null,
      }));
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get scripts error:", error);
    return NextResponse.json(
      { error: "获取话术列表失败" },
      { status: 500 }
    );
  }
}

// 更新话术
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少话术ID" }, { status: 400 });
    }

    // 处理JSON字段
    const processedData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.title !== undefined) processedData.title = updateData.title;
    if (updateData.opening !== undefined) processedData.opening = updateData.opening;
    if (updateData.productIntro !== undefined) processedData.product_intro = updateData.productIntro;
    if (updateData.sellingPoints !== undefined) processedData.selling_points = JSON.stringify(updateData.sellingPoints);
    if (updateData.promotions !== undefined) processedData.promotions = JSON.stringify(updateData.promotions);
    if (updateData.closing !== undefined) processedData.closing = updateData.closing;
    if (updateData.faq !== undefined) processedData.faq = JSON.stringify(updateData.faq);
    if (updateData.qualityScore !== undefined) processedData.quality_score = updateData.qualityScore;
    if (updateData.complianceStatus !== undefined) processedData.compliance_status = updateData.complianceStatus;
    if (updateData.complianceIssues !== undefined) processedData.compliance_issues = JSON.stringify(updateData.complianceIssues);
    if (updateData.status !== undefined) processedData.status = updateData.status;

    const { data, error } = await client
      .from("scripts")
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
    console.error("Update script error:", error);
    return NextResponse.json(
      { error: "更新话术失败" },
      { status: 500 }
    );
  }
}

// 删除话术
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少话术ID" }, { status: 400 });
    }

    const { error } = await client
      .from("scripts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "话术已删除",
    });
  } catch (error) {
    console.error("Delete script error:", error);
    return NextResponse.json(
      { error: "删除话术失败" },
      { status: 500 }
    );
  }
}
