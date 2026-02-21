import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  serial,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============================================
// 系统健康检查表（由Supabase系统创建）
// ============================================
export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ============================================
// 农产品表
// ============================================
export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(), // 品类
    origin: varchar("origin", { length: 200 }), // 产地
    price: numeric("price", { precision: 10, scale: 2 }), // 价格
    specification: varchar("specification", { length: 500 }), // 规格
    sellingPoints: text("selling_points"), // 卖点（JSON数组）
    certificates: text("certificates"), // 资质证书（JSON数组）
    prohibitedWords: text("prohibited_words"), // 禁用宣传语（JSON数组）
    description: text("description"), // 产品描述
    images: text("images"), // 产品图片（JSON数组）
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("products_category_idx").on(table.category),
    index("products_name_idx").on(table.name),
  ]
);

// ============================================
// 风格模板表
// ============================================
export const styleTemplates = pgTable(
  "style_templates",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    styleType: varchar("style_type", { length: 50 }).notNull(), // 如：亲民朴实型、激情促销型
    openingRules: text("opening_rules"), // 开场白规范（JSON）
    sellingRules: text("selling_rules"), // 卖点话术规范（JSON）
    promotionRules: text("promotion_rules"), // 促销话术规范（JSON）
    closingRules: text("closing_rules"), // 逼单话术规范（JSON）
    toneGuidelines: text("tone_guidelines"), // 语气语调指南
    exampleScripts: text("example_scripts"), // 示例话术（JSON数组）
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("style_templates_style_type_idx").on(table.styleType),
  ]
);

// ============================================
// 直播话术表
// ============================================
export const scripts = pgTable(
  "scripts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: varchar("product_id", { length: 36 }).notNull(),
    styleTemplateId: varchar("style_template_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    targetAudience: varchar("target_audience", { length: 500 }), // 目标人群
    duration: integer("duration"), // 直播时长（分钟）
    promotionRules: text("promotion_rules"), // 促销规则（JSON）
    // 结构化话术内容
    opening: text("opening"), // 开场白
    productIntro: text("product_intro"), // 产品介绍
    sellingPoints: text("selling_points"), // 卖点话术（JSON数组）
    promotions: text("promotions"), // 促销话术（JSON数组）
    closing: text("closing"), // 逼单话术
    faq: text("faq"), // 常见问题回答（JSON数组）
    // 质量评估
    qualityScore: numeric("quality_score", { precision: 3, scale: 2 }), // 质量评分 0-10
    complianceStatus: varchar("compliance_status", { length: 20 }), // 合规状态：pass/warning/fail
    complianceIssues: text("compliance_issues"), // 合规问题（JSON数组）
    // 元数据
    referencedMaterials: text("referenced_materials"), // 参考的素材ID（JSON数组）
    status: varchar("status", { length: 20 }).default("draft").notNull(), // draft/published/archived
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("scripts_product_id_idx").on(table.productId),
    index("scripts_style_template_id_idx").on(table.styleTemplateId),
    index("scripts_status_idx").on(table.status),
  ]
);

// ============================================
// 视频素材表
// ============================================
export const videoMaterials = pgTable(
  "video_materials",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // 来源信息
    sourcePlatform: varchar("source_platform", { length: 50 }).default("douyin"), // 来源平台
    sourceId: varchar("source_id", { length: 200 }), // 平台视频ID
    sourceUrl: varchar("source_url", { length: 500 }), // 原始链接
    // 视频信息
    title: varchar("title", { length: 500 }).notNull(),
    author: varchar("author", { length: 200 }), // 主播
    duration: integer("duration"), // 时长（秒）
    coverUrl: varchar("cover_url", { length: 500 }), // 封面图
    likes: integer("likes").default(0), // 点赞数
    plays: integer("plays").default(0), // 播放量
    // 处理状态
    processStatus: varchar("process_status", { length: 20 }).default("pending"), // pending/processing/completed/failed
    processError: text("process_error"), // 处理错误信息
    // 文件存储
    audioFileKey: varchar("audio_file_key", { length: 500 }), // 音频文件key
    // 分析结果
    transcription: text("transcription"), // ASR转录文本
    analysisResult: text("analysis_result"), // AI分析结果（JSON）
    // 分类标签
    tags: text("tags"), // 标签（JSON数组）
    // 导入状态
    importedToKnowledge: boolean("imported_to_knowledge").default(false),
    knowledgeDocIds: text("knowledge_doc_ids"), // 导入到知识库的文档ID（JSON数组）
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("video_materials_source_id_idx").on(table.sourceId),
    index("video_materials_process_status_idx").on(table.processStatus),
  ]
);

// ============================================
// 知识库集合表
// ============================================
export const knowledgeCollections = pgTable(
  "knowledge_collections",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    collectionType: varchar("collection_type", { length: 50 }).notNull(), // 产品知识/话术样本/FAQ/合规规则
    documentCount: integer("document_count").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_collections_type_idx").on(table.collectionType),
  ]
);

// ============================================
// 知识库文档表
// ============================================
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    collectionId: varchar("collection_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    sourceType: varchar("source_type", { length: 50 }).notNull(), // text/url/video_material
    sourceId: varchar("source_id", { length: 200 }), // 来源ID（如视频素材ID）
    // 元数据
    tags: text("tags"), // 标签（JSON数组）
    metadata: text("metadata"), // 其他元数据（JSON）
    // 向量库信息
    vectorDocId: varchar("vector_doc_id", { length: 200 }), // 向量库中的文档ID
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_documents_collection_id_idx").on(table.collectionId),
    index("knowledge_documents_source_id_idx").on(table.sourceId),
  ]
);

// ============================================
// Zod Schemas
// ============================================
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Product schemas
export const insertProductSchema = createCoercedInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = createCoercedInsertSchema(products)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// Style Template schemas
export const insertStyleTemplateSchema = createCoercedInsertSchema(styleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateStyleTemplateSchema = createCoercedInsertSchema(styleTemplates)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// Script schemas
export const insertScriptSchema = createCoercedInsertSchema(scripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateScriptSchema = createCoercedInsertSchema(scripts)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// Video Material schemas
export const insertVideoMaterialSchema = createCoercedInsertSchema(videoMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVideoMaterialSchema = createCoercedInsertSchema(videoMaterials)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// Knowledge Collection schemas
export const insertKnowledgeCollectionSchema = createCoercedInsertSchema(knowledgeCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateKnowledgeCollectionSchema = createCoercedInsertSchema(knowledgeCollections)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// Knowledge Document schemas
export const insertKnowledgeDocumentSchema = createCoercedInsertSchema(knowledgeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateKnowledgeDocumentSchema = createCoercedInsertSchema(knowledgeDocuments)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

// ============================================
// TypeScript Types
// ============================================
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

export type StyleTemplate = typeof styleTemplates.$inferSelect;
export type InsertStyleTemplate = z.infer<typeof insertStyleTemplateSchema>;
export type UpdateStyleTemplate = z.infer<typeof updateStyleTemplateSchema>;

export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type UpdateScript = z.infer<typeof updateScriptSchema>;

export type VideoMaterial = typeof videoMaterials.$inferSelect;
export type InsertVideoMaterial = z.infer<typeof insertVideoMaterialSchema>;
export type UpdateVideoMaterial = z.infer<typeof updateVideoMaterialSchema>;

export type KnowledgeCollection = typeof knowledgeCollections.$inferSelect;
export type InsertKnowledgeCollection = z.infer<typeof insertKnowledgeCollectionSchema>;
export type UpdateKnowledgeCollection = z.infer<typeof updateKnowledgeCollectionSchema>;

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type UpdateKnowledgeDocument = z.infer<typeof updateKnowledgeDocumentSchema>;
