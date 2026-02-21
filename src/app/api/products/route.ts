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

    // 处理JSON字段
    const processedData = {
      ...body,
      selling_points: body.sellingPoints ? JSON.stringify(body.sellingPoints) : null,
      certificates: body.certificates ? JSON.stringify(body.certificates) : null,
      prohibited_words: body.prohibitedWords ? JSON.stringify(body.prohibitedWords) : null,
      images: body.images ? JSON.stringify(body.images) : null,
    };

    const validatedData = insertProductSchema.parse(processedData);

    const { data, error } = await client
      .from("products")
      .insert(validatedData)
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
