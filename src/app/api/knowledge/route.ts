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
      .select("*")
      .order("created_at", { ascending: false });

    if (collectionType) {
      query = query.eq("collection_type", collectionType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 单独获取每个集合的文档计数
    let processedData = data || [];
    if (data && data.length > 0) {
      const collectionIds = data.map(c => c.id);
      const { data: docCounts } = await client
        .from("knowledge_documents")
        .select("collection_id")
        .in("collection_id", collectionIds)
        .eq("is_active", true);
      
      // 手动计数
      const countMap = new Map<string, number>();
      (docCounts || []).forEach(doc => {
        const current = countMap.get(doc.collection_id) || 0;
        countMap.set(doc.collection_id, current + 1);
      });
      
      processedData = data.map(item => ({
        ...item,
        document_count: countMap.get(item.id) || item.document_count || 0,
      }));
    }

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
