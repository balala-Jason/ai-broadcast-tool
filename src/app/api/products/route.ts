import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { insertProductSchema, updateProductSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// 获取产品列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    let query = client
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (category) {
      query = query.eq("category", category);
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
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "获取产品列表失败" },
      { status: 500 }
    );
  }
}

// 创建产品
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 直接构造数据，避免Zod schema字段名映射问题
    const insertData: Record<string, any> = {
      name: body.name,
      category: body.category,
      origin: body.origin || null,
      price: body.price || null,
      specification: body.specification || null,
      description: body.description || null,
      is_active: true,
    };

    // 处理JSON字段
    if (body.sellingPoints && Array.isArray(body.sellingPoints)) {
      insertData.selling_points = JSON.stringify(body.sellingPoints);
    }
    if (body.certificates && Array.isArray(body.certificates)) {
      insertData.certificates = JSON.stringify(body.certificates);
    }
    if (body.prohibitedWords && Array.isArray(body.prohibitedWords)) {
      insertData.prohibited_words = JSON.stringify(body.prohibitedWords);
    }
    if (body.images && Array.isArray(body.images)) {
      insertData.images = JSON.stringify(body.images);
    }

    const { data, error } = await client
      .from("products")
      .insert(insertData)
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
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "创建产品失败" },
      { status: 500 }
    );
  }
}

// 更新产品
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少产品ID" }, { status: 400 });
    }

    // 处理JSON字段
    const processedData = {
      ...updateData,
      selling_points: updateData.sellingPoints ? JSON.stringify(updateData.sellingPoints) : undefined,
      certificates: updateData.certificates ? JSON.stringify(updateData.certificates) : undefined,
      prohibited_words: updateData.prohibitedWords ? JSON.stringify(updateData.prohibitedWords) : undefined,
      images: updateData.images ? JSON.stringify(updateData.images) : undefined,
      updated_at: new Date().toISOString(),
    };

    // 移除undefined字段
    Object.keys(processedData).forEach(key => {
      if (processedData[key as keyof typeof processedData] === undefined) {
        delete processedData[key as keyof typeof processedData];
      }
    });

    const { data, error } = await client
      .from("products")
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
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "更新产品失败" },
      { status: 500 }
    );
  }
}

// 删除产品
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少产品ID" }, { status: 400 });
    }

    const { error } = await client
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "产品已删除",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "删除产品失败" },
      { status: 500 }
    );
  }
}
