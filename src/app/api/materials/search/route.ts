import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * 抖音视频搜索API
 * 
 * 由于抖音API需要授权，这里提供模拟数据接口
 * 实际部署时可替换为真实的抖音搜索API
 */

// 模拟视频搜索结果
function generateMockVideos(keyword: string, count: number = 10) {
  const categories = ["苹果", "橙子", "芒果", "葡萄", "草莓", "桃子", "西瓜", "樱桃"];
  const anchors = ["农哥直播间", "乡村小妹", "果园达人", "鲜果优选", "农家小院"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `video_${Date.now()}_${i}`,
    title: `${keyword}直播带货 | ${categories[i % categories.length]}专场 | 高清实录`,
    author: anchors[i % anchors.length],
    duration: Math.floor(Math.random() * 3600) + 600, // 10分钟到70分钟
    likes: Math.floor(Math.random() * 100000) + 1000,
    plays: Math.floor(Math.random() * 1000000) + 10000,
    coverUrl: `https://picsum.photos/seed/${keyword}${i}/400/300`,
    sourceUrl: `https://example.com/video/${Date.now()}_${i}`,
    sourceId: `douyin_${Date.now()}_${i}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (!keyword.trim()) {
      return NextResponse.json(
        { error: "关键词不能为空" },
        { status: 400 }
      );
    }

    // 模拟搜索延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 生成模拟数据
    const mockVideos = generateMockVideos(keyword, pageSize);

    return NextResponse.json({
      success: true,
      data: {
        videos: mockVideos,
        total: 100,
        page,
        pageSize,
        keyword,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "搜索失败，请稍后重试" },
      { status: 500 }
    );
  }
}
