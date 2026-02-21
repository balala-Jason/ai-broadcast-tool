import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { 
  KnowledgeClient, 
  Config, 
  KnowledgeDocument, 
  DataSourceType,
  HeaderUtils 
} from "coze-coding-dev-sdk";
import { insertKnowledgeCollectionSchema, insertKnowledgeDocumentSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// 获取知识库集合列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get("collectionType");

    let query = client
      .from("knowledge_collections")
      .select("*, knowledge_documents(count)")
      .order("created_at", { ascending: false });

    if (collectionType) {
      query = query.eq("collection_type", collectionType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 处理文档计数
    const processedData = (data || []).map(item => ({
      ...item,
      documentCount: item.knowledge_documents?.[0]?.count || 0,
      knowledge_documents: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Get knowledge collections error:", error);
    return NextResponse.json(
      { error: "获取知识库列表失败" },
      { status: 500 }
    );
  }
}

// 创建知识库集合
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const validatedData = insertKnowledgeCollectionSchema.parse({
      ...body,
      collectionType: body.collectionType || "话术样本",
    });

    const { data, error } = await client
      .from("knowledge_collections")
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
    console.error("Create knowledge collection error:", error);
    return NextResponse.json(
      { error: "创建知识库失败" },
      { status: 500 }
    );
  }
}
