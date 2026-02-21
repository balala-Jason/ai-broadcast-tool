import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { insertVideoMaterialSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// 获取视频素材列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    let query = client
      .from("video_materials")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) {
      query = query.eq("process_status", status);
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
    console.error("Get materials error:", error);
    return NextResponse.json(
      { error: "获取素材列表失败" },
      { status: 500 }
    );
  }
}

// 添加视频素材
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 验证输入
    const validatedData = insertVideoMaterialSchema.parse({
      ...body,
      processStatus: "pending",
    });

    const { data, error } = await client
      .from("video_materials")
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
    console.error("Create material error:", error);
    return NextResponse.json(
      { error: "添加素材失败" },
      { status: 500 }
    );
  }
}

// 删除视频素材
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少素材ID" }, { status: 400 });
    }

    const { error } = await client
      .from("video_materials")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "素材已删除",
    });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { error: "删除素材失败" },
      { status: 500 }
    );
  }
}
