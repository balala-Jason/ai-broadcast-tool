"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Database,
  Search,
  Upload,
  Loader2,
  FileText,
  FolderOpen
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface KnowledgeCollection {
  id: string;
  name: string;
  collection_type: string;
  description: string | null;
  document_count: number;
  is_active: boolean;
  created_at: string;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source_type: string;
  tags: string | null;
  created_at: string;
}

interface SearchResult {
  content?: string;
  score?: number;
  doc_id?: string;
}

export default function KnowledgePage() {
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    collectionType: "",
    description: "",
    content: "",
    title: "",
    sourceType: "text",
  });

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error("Load collections failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const loadDocuments = useCallback(async (collectionId: string) => {
    try {
      const response = await fetch(`/api/knowledge/documents?collectionId=${collectionId}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("Load documents failed:", error);
    }
  }, []);

  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollection(collectionId);
    loadDocuments(collectionId);
  };

  const handleCreateCollection = async () => {
    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          collectionType: formData.collectionType,
          description: formData.description || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsCreateDialogOpen(false);
        setFormData({ name: "", collectionType: "", description: "", content: "", title: "", sourceType: "text" });
        loadCollections();
      }
    } catch (error) {
      console.error("Create collection failed:", error);
    }
  };

  const handleImportDocument = async () => {
    if (!selectedCollection) return;

    try {
      const response = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: selectedCollection,
          title: formData.title,
          content: formData.content,
          sourceType: formData.sourceType,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsImportDialogOpen(false);
        setFormData({ name: "", collectionType: "", description: "", content: "", title: "", sourceType: "text" });
        loadDocuments(selectedCollection);
        loadCollections();
      }
    } catch (error) {
      console.error("Import document failed:", error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("确定要删除这个文档吗？")) return;
    
    try {
      await fetch(`/api/knowledge/documents?id=${id}`, { method: "DELETE" });
      if (selectedCollection) {
        loadDocuments(selectedCollection);
        loadCollections();
      }
    } catch (error) {
      console.error("Delete document failed:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, topK: 5 }),
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const collectionTypes = [
    "产品知识", "话术样本", "FAQ", "合规规则"
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <PageHeader title="知识库管理" description="管理话术素材库，提升生成质量">
          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)} className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">新建</span>集合
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={!selectedCollection}
              className="h-9"
            >
              <Upload className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">导入</span>文档
            </Button>
          </div>
        </PageHeader>

        <Tabs defaultValue="collections" className="space-y-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="collections" className="flex-1 md:flex-none text-xs md:text-sm">集合管理</TabsTrigger>
            <TabsTrigger value="search" className="flex-1 md:flex-none text-xs md:text-sm">知识搜索</TabsTrigger>
          </TabsList>

          {/* 集合管理 */}
          <TabsContent value="collections">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
              {/* 集合列表 */}
              <Card className="lg:col-span-1 shadow-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">知识库集合</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无集合</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {collections.map((collection) => (
                        <div
                          key={collection.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCollection === collection.id 
                              ? "bg-emerald-50 border-emerald-200" 
                              : "hover:bg-slate-50"
                          }`}
                          onClick={() => handleSelectCollection(collection.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{collection.name}</h4>
                              <p className="text-xs text-slate-500">{collection.collection_type}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {collection.document_count} 篇
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 文档列表 */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">文档列表</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {selectedCollection 
                      ? "当前集合的文档" 
                      : "选择一个集合查看其文档"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {!selectedCollection ? (
                    <div className="text-center py-8 md:py-12 text-slate-500">
                      <Database className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">请先选择一个知识库集合</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-slate-500">
                      <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">该集合暂无文档</p>
                      <Button 
                        size="sm"
                        className="mt-4" 
                        onClick={() => setIsImportDialogOpen(true)}
                      >
                        导入文档
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {doc.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{doc.source_type}</Badge>
                                <span className="text-xs text-slate-400">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 知识搜索 */}
          <TabsContent value="search">
            <Card className="shadow-sm">
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="输入搜索关键词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} className="w-full sm:w-auto">
                    <Search className="w-4 h-4 mr-2" />
                    搜索
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-slate-500">
                    <Search className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">输入关键词搜索知识库</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className="p-3 md:p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-xs">相似度: {(result.score || 0).toFixed(2)}</Badge>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600">{result.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 创建集合对话框 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="w-[95vw] md:max-w-lg p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">新建知识库集合</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">创建一个新的知识库集合来组织文档</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">集合名称 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：苹果话术样本"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">集合类型 *</Label>
                <Select 
                  value={formData.collectionType}
                  onValueChange={(value) => setFormData({ ...formData, collectionType: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个集合的用途..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleCreateCollection} disabled={!formData.name || !formData.collectionType}>
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 导入文档对话框 */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="w-[95vw] md:max-w-lg p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">导入文档</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">向知识库导入新的文档</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">文档标题 *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="文档标题"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">来源类型</Label>
                <Select 
                  value={formData.sourceType}
                  onValueChange={(value) => setFormData({ ...formData, sourceType: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文本</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">文档内容 *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="粘贴文档内容..."
                  rows={5}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleImportDocument} disabled={!formData.title || !formData.content}>
                导入
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
