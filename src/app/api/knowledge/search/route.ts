import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { 
  KnowledgeClient, 
  Config, 
  KnowledgeDocument, 
  DataSourceType,
  HeaderUtils 
} from "coze-coding-dev-sdk";

/**
 * 知识库搜索API
 * 使用向量检索技术进行语义搜索
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, collectionIds, topK = 5, minScore = 0.5 } = body;

    if (!query) {
      return NextResponse.json({ error: "搜索查询不能为空" }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    // 执行语义搜索
    const searchResult = await knowledgeClient.search(
      query,
      collectionIds && collectionIds.length > 0 ? collectionIds : undefined,
      topK,
      minScore
    );

    if (searchResult.code !== 0) {
      return NextResponse.json(
        { error: searchResult.msg || "搜索失败" },
        { status: 500 }
      );
    }

    // 增强搜索结果，添加文档元数据
    const client = getSupabaseClient();
    const enhancedChunks = await Promise.all(
      (searchResult.chunks || []).map(async (chunk) => {
        if (chunk.doc_id) {
          const { data: docData } = await client
            .from("knowledge_documents")
            .select("title, collection_id, source_type, tags")
            .eq("vector_doc_id", chunk.doc_id)
            .single();

          return {
            ...chunk,
            metadata: docData || null,
          };
        }
        return chunk;
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: enhancedChunks,
        total: enhancedChunks.length,
      },
    });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json(
      { error: "知识库搜索失败" },
      { status: 500 }
    );
  }
}
