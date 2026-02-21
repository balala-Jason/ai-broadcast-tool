import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * 视频素材API
 * 
 * GET: 获取素材列表
 * POST: 添加新素材
 * DELETE: 删除素材
 */

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
      console.error("Get materials error:", error);
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

    // 直接使用snake_case字段名插入数据库
    // 前端发送的字段已经是snake_case格式
    const materialData = {
      title: body.title,
      author: body.author || null,
      duration: body.duration || null,
      cover_url: body.cover_url || body.coverUrl || null,
      source_url: body.source_url || body.sourceUrl || null,
      source_id: body.source_id || body.sourceId || null,
      source_platform: body.source_platform || body.sourcePlatform || "douyin",
      likes: body.likes || 0,
      plays: body.plays || 0,
      process_status: "pending",
    };

    // 验证必填字段
    if (!materialData.title) {
      return NextResponse.json(
        { error: "标题不能为空" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("video_materials")
      .insert(materialData)
      .select()
      .single();

    if (error) {
      console.error("Insert material error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
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
      console.error("Delete material error:", error);
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
