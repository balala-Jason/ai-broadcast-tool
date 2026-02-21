"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wand2
} from "lucide-react";
import { useState, useCallback } from "react";
import Image from "next/image";

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
  process_status: string;
  transcription: string | null;
  analysis_result: string | null;
  created_at: string;
}

export default function MaterialsPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

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
    try {
      await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      loadSavedMaterials();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [loadSavedMaterials]);

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

  return (
    <MainLayout>
      <div className="p-6">
        <PageHeader 
          title="素材采集" 
          description="搜索抖音直播视频，采集优秀话术素材"
        />

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList>
            <TabsTrigger value="search">视频搜索</TabsTrigger>
            <TabsTrigger value="library" onClick={loadSavedMaterials}>素材库</TabsTrigger>
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
                  <div className="space-y-4">
                    {searchResults.map((video) => (
                      <div 
                        key={video.id}
                        className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="relative w-40 h-24 bg-slate-200 rounded overflow-hidden flex-shrink-0">
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
                          <h3 className="font-medium line-clamp-2 mb-1">{video.title}</h3>
                          <p className="text-sm text-slate-500 mb-2">{video.author}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {formatNumber(video.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatNumber(video.plays)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button 
                            size="sm"
                            onClick={() => handleAddToLibrary(video)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
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
                  <div className="space-y-4">
                    {savedMaterials.map((material) => (
                      <div 
                        key={material.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{material.title}</h3>
                            <p className="text-sm text-slate-500">{material.author}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                material.process_status === "completed" ? "default" :
                                material.process_status === "processing" ? "secondary" :
                                material.process_status === "failed" ? "destructive" : "outline"
                              }
                            >
                              {material.process_status === "completed" ? "已分析" :
                               material.process_status === "processing" ? "分析中" :
                               material.process_status === "failed" ? "失败" : "待处理"}
                            </Badge>
                            {material.process_status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAnalyze(material.id)}
                                disabled={isAnalyzing === material.id}
                              >
                                {isAnalyzing === material.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <Wand2 className="w-4 h-4 mr-1" />
                                )}
                                分析
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDelete(material.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {material.transcription && (
                          <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                            <p className="font-medium mb-1">转录文本：</p>
                            <p className="text-slate-600 line-clamp-3">{material.transcription}</p>
                          </div>
                        )}
                        {material.analysis_result && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded text-sm">
                            <p className="font-medium mb-1 text-emerald-700">分析结果：</p>
                            <pre className="text-slate-600 whitespace-pre-wrap text-xs">
                              {JSON.stringify(JSON.parse(material.analysis_result), null, 2).slice(0, 500)}...
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
