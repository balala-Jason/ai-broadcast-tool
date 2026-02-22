"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Loader2,
  AlertTriangle,
  Target,
  MessageSquare,
  Lock,
  Zap,
  PartyPopper,
  ChevronRight,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Radio,
  Play
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
}

interface StyleTemplate {
  id: string;
  name: string;
  style_type: string;
  description: string | null;
}

interface ScriptOption {
  id: string;
  style: string;
  script: string;
  tips?: string;
  interactionType?: string;
  valuePoint?: string;
  urgency?: string;
  trigger?: string;
}

interface ScriptSegment {
  title: string;
  target: string;
  description: string;
  options: ScriptOption[];
}

interface ParsedScriptData {
  warmUp?: ScriptSegment;
  retention?: ScriptSegment;
  lockCustomer?: ScriptSegment;
  pushOrder?: ScriptSegment;
  atmosphere?: ScriptSegment;
  complianceNotes?: string[];
  estimatedDuration?: string;
  algorithmTips?: string;
}

interface Script {
  id: string;
  title: string;
  warm_up: string | null;
  retention: string | null;
  lock_customer: string | null;
  push_order: string | null;
  atmosphere: string | null;
  quality_score: string | null;
  compliance_status: string | null;
  created_at: string;
  products: { name: string };
  style_templates: { name: string };
}

// 5段式话术结构定义
const SCRIPT_SEGMENTS = [
  { 
    key: "warmUp", 
    label: "预热", 
    target: "停留时长", 
    icon: Target, 
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    desc: "吸引注意力，建立期待感"
  },
  { 
    key: "retention", 
    label: "留人", 
    target: "互动率", 
    icon: MessageSquare, 
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    desc: "引导互动，提升热度"
  },
  { 
    key: "lockCustomer", 
    label: "锁客", 
    target: "转化率", 
    icon: Lock, 
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    desc: "建立信任，激发购买意愿"
  },
  { 
    key: "pushOrder", 
    label: "逼单", 
    target: "GPM", 
    icon: Zap, 
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    desc: "制造紧迫，促成下单"
  },
  { 
    key: "atmosphere", 
    label: "气氛", 
    target: "参与度", 
    icon: PartyPopper, 
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    desc: "营造氛围，维持热度"
  },
];

export default function ScriptsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("30");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [parsedData, setParsedData] = useState<ParsedScriptData | null>(null);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSegment, setActiveSegment] = useState("warmUp");
  
  const [optionDialog, setOptionDialog] = useState<{
    open: boolean;
    segment: string;
    option: ScriptOption | null;
  }>({ open: false, segment: "", option: null });
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  // 后台生成状态管理
  const [generationStatus, setGenerationStatus] = useState<{
    isGenerating: boolean;
    progress: number;
    message: string;
  }>({ isGenerating: false, progress: 0, message: "" });
  
  const outputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 初始化BroadcastChannel用于跨页面通信
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannelRef.current = new BroadcastChannel("script_generation");
      broadcastChannelRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === "GENERATION_STATUS") {
          setGenerationStatus(data);
          if (!data.isGenerating && data.result) {
            // 生成完成，恢复结果
            setGeneratedContent(data.result.content || "");
            setParsedData(data.result.parsedData || null);
            setCurrentScriptId(data.result.scriptId || null);
            setIsGenerating(false);
          }
        }
      };
    }
    
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  // 页面可见性变化处理 - 确保后台生成继续
  useEffect(() => {
    const handleVisibilityChange = () => {
      const savedStatus = localStorage.getItem("script_generation_status");
      if (!savedStatus) return;
      
      const status = JSON.parse(savedStatus);
      
      if (!document.hidden) {
        // 页面重新可见时，恢复最新状态
        setGenerationStatus(status);
        
        if (status.result) {
          // 生成已完成，恢复结果
          setGeneratedContent(status.result.content || "");
          setParsedData(status.result.parsedData || null);
          setCurrentScriptId(status.result.scriptId || null);
          setIsGenerating(false);
        } else if (status.isGenerating) {
          // 仍在生成中，显示进度
          setIsGenerating(true);
          // 重新启动状态轮询
          startStatusPolling();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange(); // 初始检查
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 状态轮询 - 用于页面切换后恢复状态
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const startStatusPolling = useCallback(() => {
    // 清除之前的轮询
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    
    // 每500ms检查一次localStorage中的状态
    statusPollingRef.current = setInterval(() => {
      const savedStatus = localStorage.getItem("script_generation_status");
      if (savedStatus) {
        const status = JSON.parse(savedStatus);
        setGenerationStatus(status);
        
        if (!status.isGenerating && status.result) {
          // 生成完成，恢复结果并停止轮询
          setGeneratedContent(status.result.content || "");
          setParsedData(status.result.parsedData || null);
          setCurrentScriptId(status.result.scriptId || null);
          setIsGenerating(false);
          
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
          }
        }
      }
    }, 500);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      broadcastChannelRef.current?.close();
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, templatesRes, scriptsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/style-templates"),
          fetch("/api/scripts"),
        ]);
        
        const [productsData, templatesData, scriptsData] = await Promise.all([
          productsRes.json(),
          templatesRes.json(),
          scriptsRes.json(),
        ]);
        
        if (productsData.success) setProducts(productsData.data);
        if (templatesData.success) setTemplates(templatesData.data);
        if (scriptsData.success) setSavedScripts(scriptsData.data);
      } catch (error) {
        console.error("Load data failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedProduct || !selectedTemplate) {
      alert("请选择产品和风格模板");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setParsedData(null);
    setCurrentScriptId(null);
    setSelectedOptions({});
    
    const status = {
      isGenerating: true,
      progress: 0,
      message: "正在初始化...",
      result: null as any,
      timestamp: Date.now(),
    };
    
    setGenerationStatus(status);
    localStorage.setItem("script_generation_status", JSON.stringify(status));
    broadcastChannelRef.current?.postMessage({ type: "GENERATION_STATUS", data: status });

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          styleTemplateId: selectedTemplate,
          targetAudience,
          duration: parseInt(duration),
        }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

      let fullContent = "";
      let lastParsedData: ParsedScriptData | null = null;
      let lastScriptId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "chunk") {
                fullContent += data.content;
                setGeneratedContent((prev) => prev + data.content);
                
                // 更新进度状态
                const progress = Math.min(95, (fullContent.length / 2000) * 100);
                const newStatus = {
                  ...status,
                  progress,
                  message: `正在生成话术... ${Math.round(progress)}%`,
                };
                setGenerationStatus(newStatus);
                localStorage.setItem("script_generation_status", JSON.stringify(newStatus));
              } else if (data.type === "done") {
                lastScriptId = data.scriptId;
                lastParsedData = data.scriptData || null;
                setCurrentScriptId(data.scriptId);
                if (data.scriptData) {
                  setParsedData(data.scriptData);
                }
                
                // 保存完成状态
                const finalStatus = {
                  isGenerating: false,
                  progress: 100,
                  message: "生成完成",
                  result: {
                    content: fullContent,
                    parsedData: data.scriptData,
                    scriptId: data.scriptId,
                  },
                  timestamp: Date.now(),
                };
                setGenerationStatus(finalStatus);
                localStorage.setItem("script_generation_status", JSON.stringify(finalStatus));
                broadcastChannelRef.current?.postMessage({ type: "GENERATION_STATUS", data: finalStatus });
              } else if (data.type === "error") {
                console.error("Stream error:", data.message);
                const errorStatus = {
                  isGenerating: false,
                  progress: 0,
                  message: `生成失败: ${data.message}`,
                  result: null,
                  timestamp: Date.now(),
                };
                setGenerationStatus(errorStatus);
                localStorage.setItem("script_generation_status", JSON.stringify(errorStatus));
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("生成被中断");
      } else {
        console.error("Generate failed:", error);
        alert("生成失败，请重试");
        
        const errorStatus = {
          isGenerating: false,
          progress: 0,
          message: "生成失败",
          result: null,
          timestamp: Date.now(),
        };
        setGenerationStatus(errorStatus);
        localStorage.setItem("script_generation_status", JSON.stringify(errorStatus));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      // 停止轮询
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
    }
  }, [selectedProduct, selectedTemplate, targetAudience, duration]);

  const handleSelectOption = useCallback((segment: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [segment]: optionId
    }));
  }, []);

  const handleCopyOption = useCallback((script: string) => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleExport = useCallback(() => {
    if (!parsedData) return;
    
    let exportContent = "【抖音直播话术脚本】\n\n";
    
    SCRIPT_SEGMENTS.forEach(seg => {
      const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
      if (data) {
        exportContent += `══════════════════════════════════\n`;
        exportContent += `【${data.title}】目标：${data.target}\n`;
        exportContent += `══════════════════════════════════\n\n`;
        
        const selectedId = selectedOptions[seg.key];
        const selectedOption = data.options?.find(o => o.id === selectedId);
        
        if (selectedOption) {
          exportContent += `✓ 已选择：${selectedOption.style}\n`;
          exportContent += `${selectedOption.script}\n\n`;
        } else if (data.options?.length > 0) {
          data.options.forEach((opt, i) => {
            exportContent += `${i + 1}. 【${opt.style}】\n${opt.script}\n\n`;
          });
        }
      }
    });
    
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `话术_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [parsedData, selectedOptions]);

  const handleCheckCompliance = useCallback(async () => {
    if (!currentScriptId) return;
    
    try {
      const response = await fetch("/api/scripts/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: currentScriptId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`合规检查完成：${data.data.status}\n评分：${data.data.score}`);
      }
    } catch (error) {
      console.error("Compliance check failed:", error);
    }
  }, [currentScriptId]);

  const selectedCount = Object.values(selectedOptions).filter(Boolean).length;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <PageHeader title="话术生成" description="选择产品和风格，AI自动生成直播话术" />

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* 左侧：生成参数 */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">生成参数</CardTitle>
              <CardDescription>配置话术生成的参数</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">选择产品 *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择一个产品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">风格模板 *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="选择话术风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.style_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">目标人群</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="如：家庭主妇、中老年人"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm">直播时长（分钟）</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={5}
                  max={120}
                  className="h-10"
                />
              </div>

              <Button 
                className="w-full h-11 relative overflow-hidden" 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedProduct || !selectedTemplate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="relative z-10">
                      {generationStatus.message || "生成中..."}
                    </span>
                    {/* 进度条背景 */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/30 transition-all duration-300"
                      style={{ width: `${generationStatus.progress}%` }}
                    />
                  </>
                ) : generationStatus.isGenerating ? (
                  <>
                    <Radio className="w-4 h-4 mr-2 text-amber-500 animate-pulse" />
                    <span className="relative z-10 text-amber-600">
                      后台生成中 {generationStatus.progress}%
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成话术
                  </>
                )}
              </Button>
              
              {/* 后台生成状态提示 */}
              {generationStatus.isGenerating && !isGenerating && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>话术正在后台生成中...</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    您可以切换到其他页面，生成完成后会自动保存
                  </p>
                  <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${generationStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧：生成结果 */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base md:text-lg">生成结果</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    5段式话术 · 每环节5+种选择
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData && (
                    <>
                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                        已选择 {selectedCount}/5
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleExport} className="h-8 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        导出
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              {parsedData ? (
                <div className="space-y-4">
                  {/* 5段式指标概览 - 移动端垂直堆叠，桌面端横向排列 */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-2">
                    {SCRIPT_SEGMENTS.map((seg, index) => {
                      const Icon = seg.icon;
                      const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
                      const optionCount = data?.options?.length || 0;
                      const isSelected = !!selectedOptions[seg.key];
                      const isActive = activeSegment === seg.key;
                      
                      return (
                        <button
                          key={seg.key}
                          onClick={() => setActiveSegment(seg.key)}
                          className={`relative p-3 md:p-3 rounded-xl border-2 transition-all text-left md:text-center ${
                            isActive 
                              ? `${seg.borderColor} ${seg.bgColor} shadow-md` 
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          {/* 移动端：水平布局 */}
                          <div className="flex md:flex-col items-center gap-3 md:gap-1">
                            <div className={`flex-shrink-0 w-10 h-10 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${seg.color} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 md:w-5 md:h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center md:justify-center gap-2">
                                <span className="font-semibold text-sm">{index + 1}. {seg.label}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 md:hidden" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 hidden md:block">{optionCount}种选择</p>
                              <p className="text-xs text-slate-500 md:hidden truncate">{seg.desc}</p>
                            </div>
                            <div className="hidden md:block">
                              {isSelected ? (
                                <Badge className={`${seg.textColor} ${seg.bgColor} text-xs`}>
                                  <Check className="w-3 h-3 mr-1" />
                                  已选
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-slate-400">
                                  未选择
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className={`w-5 h-5 text-slate-400 md:hidden transition-transform ${isActive ? 'rotate-90' : ''}`} />
                          </div>
                          
                          {/* 桌面端选中标记 */}
                          {isSelected && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${seg.bgColor} border-2 ${seg.borderColor} items-center justify-center hidden md:flex`}>
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 当前环节详情 */}
                  {SCRIPT_SEGMENTS.map((seg) => {
                    if (activeSegment !== seg.key) return null;
                    const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
                    if (!data) return null;

                    return (
                      <div key={seg.key} className="space-y-3">
                        <div className={`p-3 md:p-4 rounded-lg ${seg.bgColor} ${seg.borderColor} border`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{data.title}</span>
                            <Badge variant="outline" className="text-xs">{data.target}</Badge>
                          </div>
                          <p className="text-xs md:text-sm text-slate-600">{data.description}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {data.options?.map((option, index) => {
                            const isSelected = selectedOptions[seg.key] === option.id;
                            
                            return (
                              <div
                                key={option.id}
                                onClick={() => handleSelectOption(seg.key, option.id)}
                                className={`relative p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected 
                                    ? `${seg.borderColor} ${seg.bgColor} shadow-md` 
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-start gap-2 md:gap-3">
                                  <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm bg-gradient-to-br ${seg.color}`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">{option.style}</span>
                                      {isSelected && (
                                        <Badge className={`${seg.textColor} ${seg.bgColor} text-xs`}>
                                          <Check className="w-3 h-3 mr-1" />
                                          已选择
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed line-clamp-2 md:line-clamp-3">
                                      {option.script}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOptionDialog({ open: true, segment: seg.key, option });
                                    }}
                                  >
                                    查看详情
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyOption(option.script);
                                    }}
                                  >
                                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                    复制
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* 合规提醒 */}
                  {parsedData.complianceNotes && parsedData.complianceNotes.length > 0 && (
                    <div className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-800 text-sm mb-2">⚠️ 合规提醒</h4>
                      <ul className="text-xs md:text-sm text-amber-700 space-y-1">
                        {parsedData.complianceNotes.map((note, i) => (
                          <li key={i}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  ref={outputRef}
                  className="min-h-[300px] md:min-h-[400px] max-h-[500px] md:max-h-[600px] overflow-y-auto bg-slate-50 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm whitespace-pre-wrap"
                >
                  {generatedContent || generationStatus.isGenerating ? (
                    <>
                      {generationStatus.isGenerating && !generatedContent && (
                        <div className="text-center py-8 md:py-12">
                          <div className="relative inline-block">
                            <Radio className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-amber-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          </div>
                          <p className="text-amber-600 font-medium">话术正在后台生成中...</p>
                          <p className="text-xs text-slate-400 mt-2">
                            当前进度: {generationStatus.progress}%
                          </p>
                          <div className="mt-4 mx-auto w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all duration-500"
                              style={{ width: `${generationStatus.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-4">
                            您可以切换到其他页面，生成完成后会自动显示
                          </p>
                        </div>
                      )}
                      {generatedContent && (
                        <div className="text-slate-700">
                          {generatedContent}
                          {isGenerating && (
                            <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-400 text-center py-8 md:py-12">
                      <Sparkles className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm md:text-base">选择产品和风格后点击生成</p>
                      <p className="text-xs mt-2">每个环节将生成5种以上不同风格的话术</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 历史话术 */}
        <Card className="mt-4 md:mt-6 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">历史话术</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {savedScripts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                暂无历史话术
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {savedScripts.slice(0, 5).map((script) => (
                  <div 
                    key={script.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 gap-2"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{script.title}</h4>
                      <p className="text-xs text-slate-500">
                        {script.products?.name} | {script.style_templates?.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {script.quality_score && (
                        <Badge variant="secondary" className="text-xs">评分: {script.quality_score}</Badge>
                      )}
                      {script.compliance_status && (
                        <Badge 
                          variant={script.compliance_status === "pass" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {script.compliance_status === "pass" ? "合规" : "待修改"}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(script.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 话术详情弹窗 - 移动端适配 */}
      <Dialog open={optionDialog.open} onOpenChange={(open) => setOptionDialog({ ...optionDialog, open })}>
        <DialogContent className="w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
          {optionDialog.option && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs md:text-sm">{optionDialog.option.style}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 md:space-y-4 mt-4">
                <div className="p-3 md:p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-xs md:text-sm">
                    {optionDialog.option.script}
                  </p>
                </div>
                
                {optionDialog.option.tips && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs md:text-sm text-blue-700">
                      <span className="font-medium">💡 使用技巧：</span>
                      {optionDialog.option.tips}
                    </p>
                  </div>
                )}
                
                {optionDialog.option.valuePoint && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs md:text-sm text-purple-700">
                      <span className="font-medium">🎯 核心价值：</span>
                      {optionDialog.option.valuePoint}
                    </p>
                  </div>
                )}
                
                {optionDialog.option.urgency && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs md:text-sm text-orange-700">
                      <span className="font-medium">⚡ 紧迫点：</span>
                      {optionDialog.option.urgency}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={() => {
                      handleSelectOption(optionDialog.segment, optionDialog.option!.id);
                      setOptionDialog({ ...optionDialog, open: false });
                    }}
                    className="flex-1 h-10"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    选择此话术
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCopyOption(optionDialog.option!.script)}
                    className="flex-1 h-10"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    复制
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
