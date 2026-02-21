"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search, 
  Plus, 
  Trash2, 
  Video, 
  Clock, 
  Heart, 
  Eye,
  Loader2,
  Sparkles,
  Database,
  Wand2,
  ExternalLink,
  FileText,
  BarChart3,
  X,
  Check
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface VideoItem {
  id: string;
  title: string;
  author: string;
  duration: number;
  likes: number;
  plays: number;
  coverUrl: string;
  sourceUrl: string;
  sourceId: string;
  createdAt: string;
}

interface SavedMaterial {
  id: string;
  title: string;
  author: string;
  duration: number | null;
  likes: number | null;
  plays: number | null;
  cover_url: string | null;
  source_url: string | null;
  process_status: string;
  transcription: string | null;
  analysis_result: string | null;
  created_at: string;
}

export default function MaterialsPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");
  
  // 详情弹窗状态
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    material: SavedMaterial | null;
  }>({ open: false, material: null });

  // 初始化加载素材
  useEffect(() => {
    loadSavedMaterials();
  }, []);

  // 搜索视频
  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/materials/search?keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.videos);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchKeyword]);

  // 加载已保存的素材
  const loadSavedMaterials = useCallback(async () => {
    try {
      const response = await fetch("/api/materials");
      const data = await response.json();
      if (data.success) {
        setSavedMaterials(data.data);
      }
    } catch (error) {
      console.error("Load materials failed:", error);
    }
  }, []);

  // 添加到素材库
  const handleAddToLibrary = useCallback(async (video: VideoItem) => {
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          author: video.author,
          duration: video.duration,
          likes: video.likes,
          plays: video.plays,
          cover_url: video.coverUrl,
          source_url: video.sourceUrl,
          source_id: video.sourceId,
          source_platform: "douyin",
        }),
      });
      const data = await response.json();
      if (data.success) {
        loadSavedMaterials();
        setActiveTab("library");
      }
    } catch (error) {
      console.error("Add to library failed:", error);
    }
  }, [loadSavedMaterials]);

  // 分析素材
  const handleAnalyze = useCallback(async (materialId: string) => {
    setIsAnalyzing(materialId);
    try {
      const response = await fetch("/api/materials/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      const data = await response.json();
      if (data.success) {
        loadSavedMaterials();
      }
    } catch (error) {
      console.error("Analyze failed:", error);
    } finally {
      setIsAnalyzing(null);
    }
  }, [loadSavedMaterials]);

  // 删除素材
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("确定要删除这个素材吗？")) return;
    try {
      await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      loadSavedMaterials();
      setDetailDialog({ open: false, material: null });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [loadSavedMaterials]);

  // 查看详情
  const handleViewDetail = useCallback((material: SavedMaterial) => {
    setDetailDialog({ open: true, material });
  }, []);

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toString();
  };

  // 解析分析结果
  const parseAnalysis = (result: string | null) => {
    if (!result) return null;
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <PageHeader 
          title="素材采集" 
          description="搜索抖音直播视频，采集优秀话术素材"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="search">视频搜索</TabsTrigger>
            <TabsTrigger value="library" onClick={loadSavedMaterials}>素材库 ({savedMaterials.length})</TabsTrigger>
          </TabsList>

          {/* 视频搜索 */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <div className="flex gap-4">
                  <Input
                    placeholder="输入搜索关键词，如：苹果 直播带货"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="max-w-md"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    搜索
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {searchResults.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>输入关键词搜索抖音直播视频</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((video) => (
                      <div 
                        key={video.id}
                        className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="relative w-32 h-20 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={video.coverUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium line-clamp-2 mb-1 text-sm">{video.title}</h3>
                          <p className="text-xs text-slate-500 mb-2">{video.author}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatNumber(video.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(video.plays)}
                            </span>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleAddToLibrary(video)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            添加到素材库
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 素材库 */}
          <TabsContent value="library">
            <Card>
              <CardContent className="pt-6">
                {savedMaterials.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无素材，请先搜索并添加视频</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedMaterials.map((material) => (
                      <div 
                        key={material.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => handleViewDetail(material)}
                      >
                        {/* 封面 */}
                        <div className="relative h-36 bg-slate-200">
                          {material.cover_url ? (
                            <img 
                              src={material.cover_url} 
                              alt={material.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Video className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant={
                                material.process_status === "completed" ? "default" :
                                material.process_status === "processing" ? "secondary" :
                                material.process_status === "failed" ? "destructive" : "outline"
                              }
                              className="text-xs"
                            >
                              {material.process_status === "completed" ? "已分析" :
                               material.process_status === "processing" ? "分析中" :
                               material.process_status === "failed" ? "失败" : "待处理"}
                            </Badge>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
                              点击查看详情
                            </span>
                          </div>
                        </div>
                        
                        {/* 信息 */}
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">{material.title}</h3>
                          <p className="text-xs text-slate-500 mb-2">{material.author}</p>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex gap-2">
                              {material.likes && (
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {formatNumber(material.likes)}
                                </span>
                              )}
                              {material.plays && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {formatNumber(material.plays)}
                                </span>
                              )}
                            </div>
                            <span>{new Date(material.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, material: detailDialog.material })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailDialog.material && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detailDialog.material.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                  <span>作者：{detailDialog.material.author}</span>
                  {detailDialog.material.source_url && (
                    <a 
                      href={detailDialog.material.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看原视频
                    </a>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* 封面和数据 */}
                <div className="flex gap-6">
                  {detailDialog.material.cover_url && (
                    <div className="w-48 h-28 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={detailDialog.material.cover_url} 
                        alt={detailDialog.material.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      {detailDialog.material.likes && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span className="font-medium">{formatNumber(detailDialog.material.likes)}</span>
                          <span className="text-sm">点赞</span>
                        </div>
                      )}
                      {detailDialog.material.plays && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Eye className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{formatNumber(detailDialog.material.plays)}</span>
                          <span className="text-sm">播放</span>
                        </div>
                      )}
                      {detailDialog.material.duration && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-5 h-5 text-green-500" />
                          <span className="font-medium">{formatDuration(detailDialog.material.duration)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge 
                        variant={
                          detailDialog.material.process_status === "completed" ? "default" :
                          detailDialog.material.process_status === "processing" ? "secondary" :
                          detailDialog.material.process_status === "failed" ? "destructive" : "outline"
                        }
                      >
                        {detailDialog.material.process_status === "completed" ? "✓ 已分析" :
                         detailDialog.material.process_status === "processing" ? "⏳ 分析中" :
                         detailDialog.material.process_status === "failed" ? "✗ 失败" : "○ 待处理"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {detailDialog.material.process_status === "pending" && (
                    <Button 
                      onClick={() => handleAnalyze(detailDialog.material!.id)}
                      disabled={isAnalyzing === detailDialog.material.id}
                    >
                      {isAnalyzing === detailDialog.material.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      开始分析
                    </Button>
                  )}
                  <Button 
                    variant="destructive"
                    onClick={() => handleDelete(detailDialog.material!.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除素材
                  </Button>
                </div>

                {/* 转录文本 */}
                {detailDialog.material.transcription && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">转录文本</h4>
                    </div>
                    <div className="bg-white rounded p-4 text-sm text-slate-700 max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {detailDialog.material.transcription}
                    </div>
                  </div>
                )}

                {/* 分析结果 */}
                {detailDialog.material.analysis_result && (() => {
                  const analysis = parseAnalysis(detailDialog.material.analysis_result);
                  if (!analysis) return null;
                  
                  return (
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-900">分析结果</h4>
                      </div>
                      <div className="space-y-4">
                        {/* 话术技巧 */}
                        {analysis.techniques && (
                          <div className="bg-white rounded p-3">
                            <h5 className="font-medium text-sm mb-2">话术技巧</h5>
                            <div className="flex flex-wrap gap-2">
                              {analysis.techniques.map((t: string, i: number) => (
                                <Badge key={i} variant="secondary">{t}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 卖点提炼 */}
                        {analysis.sellingPoints && (
                          <div className="bg-white rounded p-3">
                            <h5 className="font-medium text-sm mb-2">卖点提炼</h5>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                              {analysis.sellingPoints.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* 互动话术 */}
                        {analysis.interactionScripts && (
                          <div className="bg-white rounded p-3">
                            <h5 className="font-medium text-sm mb-2">互动话术示例</h5>
                            <div className="space-y-2 text-sm text-slate-600">
                              {analysis.interactionScripts.map((s: string, i: number) => (
                                <div key={i} className="p-2 bg-slate-50 rounded">"{s}"</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 原始JSON */}
                        <details className="bg-white rounded p-3">
                          <summary className="cursor-pointer text-sm font-medium">查看完整分析数据</summary>
                          <pre className="mt-2 text-xs text-slate-600 overflow-x-auto">
                            {JSON.stringify(analysis, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
