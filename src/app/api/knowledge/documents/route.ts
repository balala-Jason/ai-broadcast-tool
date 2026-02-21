import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { 
  KnowledgeClient, 
  Config, 
  KnowledgeDocument, 
  DataSourceType,
  HeaderUtils,
  ChunkConfig 
} from "coze-coding-dev-sdk";
import { insertKnowledgeDocumentSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

/**
 * 知识库文档导入API
 * 
 * 支持三种导入方式：
 * 1. 文本导入
 * 2. URL导入
 * 3. 视频素材导入
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, sourceType, content, url, materialId, title, tags, metadata } = body;

    if (!collectionId) {
      return NextResponse.json({ error: "缺少知识库集合ID" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    // 检查集合是否存在
    const { data: collection, error: collectionError } = await client
      .from("knowledge_collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: "知识库集合不存在" }, { status: 404 });
    }

    let documentTitle = title;
    let documentContent = content;
    let sourceUrl = url;
    let sourceId = materialId;

    // 如果是视频素材导入，获取素材信息
    if (sourceType === "video_material" && materialId) {
      const { data: material, error: materialError } = await client
        .from("video_materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (materialError || !material) {
        return NextResponse.json({ error: "视频素材不存在" }, { status: 404 });
      }

      documentTitle = documentTitle || material.title;
      documentContent = documentContent || material.transcription;
      sourceUrl = material.source_url;
    }

    if (!documentContent) {
      return NextResponse.json({ error: "文档内容不能为空" }, { status: 400 });
    }

    // 导入到向量库
    const docs: KnowledgeDocument[] = [];
    
    if (sourceType === "url" && url) {
      docs.push({
        source: DataSourceType.URL,
        url,
      });
    } else {
      docs.push({
        source: DataSourceType.TEXT,
        raw_data: documentContent,
      });
    }

    const chunkConfig: ChunkConfig = {
      separator: "\n\n",
      max_tokens: 2000,
      remove_extra_spaces: true,
    };

    const importResult = await knowledgeClient.addDocuments(
      docs,
      "coze_doc_knowledge",
      chunkConfig
    );

    if (importResult.code !== 0) {
      return NextResponse.json(
        { error: importResult.msg || "导入向量库失败" },
        { status: 500 }
      );
    }

    // 保存文档记录到数据库
    const docRecord = {
      collection_id: collectionId,
      title: documentTitle || "未命名文档",
      content: documentContent,
      source_type: sourceType || "text",
      source_id: sourceId,
      source_url: sourceUrl,
      tags: tags ? JSON.stringify(tags) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      vector_doc_id: importResult.doc_ids?.[0] || null,
    };

    const { data: savedDoc, error: saveError } = await client
      .from("knowledge_documents")
      .insert(docRecord)
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    // 更新集合文档计数
    await client
      .from("knowledge_collections")
      .update({
        document_count: (collection.document_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collectionId);

    // 如果是视频素材导入，更新素材的导入状态
    if (sourceType === "video_material" && materialId) {
      const { data: material } = await client
        .from("video_materials")
        .select("knowledge_doc_ids")
        .eq("id", materialId)
        .single();

      const existingDocIds = material?.knowledge_doc_ids 
        ? JSON.parse(material.knowledge_doc_ids) 
        : [];
      
      await client
        .from("video_materials")
        .update({
          imported_to_knowledge: true,
          knowledge_doc_ids: JSON.stringify([...existingDocIds, savedDoc.id]),
          updated_at: new Date().toISOString(),
        })
        .eq("id", materialId);
    }

    return NextResponse.json({
      success: true,
      data: savedDoc,
      vectorDocIds: importResult.doc_ids,
    });
  } catch (error) {
    console.error("Import document error:", error);
    return NextResponse.json(
      { error: "导入文档失败" },
      { status: 500 }
    );
  }
}

// 获取文档列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!collectionId) {
      return NextResponse.json({ error: "缺少集合ID" }, { status: 400 });
    }

    const { data, error, count } = await client
      .from("knowledge_documents")
      .select("*", { count: "exact" })
      .eq("collection_id", collectionId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

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
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "获取文档列表失败" },
      { status: 500 }
    );
  }
}

// 删除文档
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少文档ID" }, { status: 400 });
    }

    // 获取文档信息
    const { data: doc, error: fetchError } = await client
      .from("knowledge_documents")
      .select("*, knowledge_collections!inner(id, document_count)")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }

    // 软删除文档
    const { error: updateError } = await client
      .from("knowledge_documents")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 更新集合文档计数
    if (doc.collection_id) {
      await client
        .from("knowledge_collections")
        .update({
          document_count: Math.max(0, (doc.knowledge_collections?.document_count || 1) - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.collection_id);
    }

    return NextResponse.json({
      success: true,
      message: "文档已删除",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "删除文档失败" },
      { status: 500 }
    );
  }
}
