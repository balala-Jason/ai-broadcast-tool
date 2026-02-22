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
  Play,
  Trash2,
  Eye
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

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
  products: { name: string; category?: string };
  style_templates: { name: string };
}

interface SavedScript {
  id: number;
  title: string;
  content: string | null;
  parsed_data: ParsedScriptData | null;
  warm_up: string | null;
  retention: string | null;
  lock_customer: string | null;
  push_order: string | null;
  atmosphere: string | null;
  quality_score: number | null;
  compliance_status: string | null;
  created_at: string;
  product_id: string;
  template_id: string;
  products?: { name: string; category?: string };
  style_templates?: { name: string };
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
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [productList, setProductList] = useState<string[]>([]);
  const [historyProduct, setHistoryProduct] = useState("all");
  const [selectedHistoryScript, setSelectedHistoryScript] = useState<SavedScript | null>(null);
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
  
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    script: Script | null;
  }>({ open: false, script: null });
  
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
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  // 状态轮询 - 用于页面切换后恢复状态
  const startStatusPolling = useCallback(() => {
    // 清除之前的轮询
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    
    // 每500ms检查一次localStorage中的状态
    statusPollingRef.current = setInterval(() => {
      const savedStatus = localStorage.getItem("script_generation_status");
      if (savedStatus) {
        try {
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
        } catch (e) {
          console.error("Failed to parse status:", e);
        }
      }
    }, 500);
  }, []);

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
          } else if (data.isGenerating) {
            // 仍在生成中，启动轮询
            setIsGenerating(true);
            startStatusPolling();
          }
        }
      };
    }
    
    // 初始化时检查是否有之前的状态
    const savedStatus = localStorage.getItem("script_generation_status");
    if (savedStatus) {
      try {
        const status = JSON.parse(savedStatus);
        // 检查状态是否是最近5分钟内的
        if (status.timestamp && Date.now() - status.timestamp < 5 * 60 * 1000) {
          setGenerationStatus(status);
          
          if (status.result) {
            // 生成已完成，恢复结果
            setGeneratedContent(status.result.content || "");
            setParsedData(status.result.parsedData || null);
            setCurrentScriptId(status.result.scriptId || null);
            setIsGenerating(false);
          } else if (status.isGenerating) {
            // 仍在生成中，启动轮询
            setIsGenerating(true);
            startStatusPolling();
          }
        } else {
          // 状态过期，清除
          localStorage.removeItem("script_generation_status");
        }
      } catch (e) {
        console.error("Failed to parse saved status:", e);
        localStorage.removeItem("script_generation_status");
      }
    }
    
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [startStatusPolling]);

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
  }, [startStatusPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      broadcastChannelRef.current?.close();
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  // 加载保存的话术
  const loadSavedScripts = useCallback(async () => {
    try {
      const url = historyProduct && historyProduct !== "all"
        ? `/api/scripts?category=${encodeURIComponent(historyProduct)}`
        : "/api/scripts";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSavedScripts(data.data);
        if (data.products) {
          setProductList(data.products);
        }
      }
    } catch (error) {
      console.error("Load scripts failed:", error);
    }
  }, [historyProduct]);

  // 产品变化时重新加载
  useEffect(() => {
    loadSavedScripts();
  }, [loadSavedScripts]);

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
        if (scriptsData.success) {
          setSavedScripts(scriptsData.data);
          if (scriptsData.products) {
            setProductList(scriptsData.products);
          }
        }
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

    let isCompleted = false; // 标记是否已完成

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
                
                // 更新进度状态 - 使用更合理的进度计算
                // 假设完整响应大约6000字符
                const progress = Math.min(90, Math.round((fullContent.length / 6000) * 100));
                const newStatus = {
                  isGenerating: true,
                  progress,
                  message: `正在生成话术... ${progress}%`,
                  result: null,
                  timestamp: Date.now(),
                };
                setGenerationStatus(newStatus);
                localStorage.setItem("script_generation_status", JSON.stringify(newStatus));
              } else if (data.type === "done") {
                isCompleted = true;
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
                
                // 生成完成后自动刷新历史话术列表
                loadSavedScripts();
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
            } catch (parseError) {
              // 忽略解析错误，继续处理
              console.log("Parse error:", parseError);
            }
          }
        }
      }
      
      // 如果流结束了但没有收到done事件，尝试从内容中解析
      if (!isCompleted && fullContent) {
        console.log("Stream ended without done event, parsing content...");
        
        try {
          // 尝试从内容中提取JSON
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const scriptData = JSON.parse(jsonMatch[0]);
            setParsedData(scriptData);
            
            const finalStatus = {
              isGenerating: false,
              progress: 100,
              message: "生成完成",
              result: {
                content: fullContent,
                parsedData: scriptData,
                scriptId: null,
              },
              timestamp: Date.now(),
            };
            setGenerationStatus(finalStatus);
            localStorage.setItem("script_generation_status", JSON.stringify(finalStatus));
            
            // 刷新历史话术列表
            loadSavedScripts();
          }
        } catch (parseError) {
          console.error("Failed to parse script data:", parseError);
          // 即使解析失败，也标记为完成
          const finalStatus = {
            isGenerating: false,
            progress: 100,
            message: "生成完成",
            result: {
              content: fullContent,
              parsedData: null,
              scriptId: null,
            },
            timestamp: Date.now(),
          };
          setGenerationStatus(finalStatus);
          localStorage.setItem("script_generation_status", JSON.stringify(finalStatus));
          
          // 刷新历史话术列表
          loadSavedScripts();
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

  // 解析流式数据为结构化话术
  const parseStreamData = useCallback((content: string): ParsedScriptData | null => {
    if (!content) return null;
    
    try {
      // 尝试从内容中提取JSON数据
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ParsedScriptData;
      }
      
      // 如果没有JSON格式，尝试解析段落格式
      const segments = content.split(/【[^】]+】/);
      const result: ParsedScriptData = {};
      
      SCRIPT_SEGMENTS.forEach((seg, index) => {
        if (segments[index + 1]) {
          (result as Record<string, ScriptSegment>)[seg.key] = {
            title: seg.label,
            target: seg.target,
            description: seg.desc,
            options: [{
              id: `opt-${seg.key}-1`,
              style: "默认风格",
              script: segments[index + 1].trim()
            }]
          };
        }
      });
      
      return Object.keys(result).length > 0 ? result : null;
    } catch (e) {
      console.error("Parse stream data failed:", e);
      return null;
    }
  }, []);

  // 查看历史话术详情
  const handleViewHistoryScript = useCallback((script: SavedScript) => {
    setSelectedHistoryScript(script);
    if (script.parsed_data) {
      setParsedData(script.parsed_data);
    } else if (script.content) {
      // 如果没有解析数据，尝试从内容解析
      try {
        const parsed = parseStreamData(script.content);
        setParsedData(parsed);
      } catch (e) {
        console.error("Parse script failed:", e);
      }
    }
  }, [parseStreamData]);

  // 删除历史话术
  const handleDeleteScript = useCallback(async (scriptId: number) => {
    if (!confirm("确定要删除这个话术吗？")) return;
    
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.success) {
        setSavedScripts(prev => prev.filter(s => s.id !== scriptId));
        if (selectedHistoryScript?.id === scriptId) {
          setSelectedHistoryScript(null);
        }
        toast.success("话术已删除");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("Delete script failed:", error);
      toast.error("删除失败");
    }
  }, [selectedHistoryScript]);

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

          {/* 右侧：生成结果 - 手机端直接展示全部内容 */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base md:text-lg">生成结果</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    5段式话术 · 点击复制即可使用
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => {
                          // 复制全部话术
                          const allText = SCRIPT_SEGMENTS.map(seg => {
                            const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
                            const option = data?.options?.[0];
                            if (!option) return '';
                            return `【${seg.label}】\n${option.script}`;
                          }).filter(Boolean).join('\n\n');
                          navigator.clipboard.writeText(allText);
                          toast.success("全部话术已复制");
                        }} 
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        一键复制全部
                      </Button>
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
                <div className="space-y-3">
                  {/* 直接展示5段话术 - 无需点击切换 */}
                  {SCRIPT_SEGMENTS.map((seg, index) => {
                    const Icon = seg.icon;
                    const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
                    if (!data || !data.options?.length) return null;
                    
                    // 手机端只显示第一个选项（最佳推荐），桌面端显示全部
                    const displayOptions = data.options.slice(0, 1);
                    
                    return (
                      <div key={seg.key} className={`rounded-xl border-2 ${seg.borderColor} ${seg.bgColor} overflow-hidden`}>
                        {/* 标题栏 */}
                        <div className={`p-3 flex items-center justify-between bg-gradient-to-r ${seg.color} text-white`}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-sm">{index + 1}. {seg.label}</span>
                              <span className="text-xs text-white/80 ml-2">目标: {seg.target}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                            {data.options.length}种可选
                          </Badge>
                        </div>
                        
                        {/* 话术内容 */}
                        <div className="p-3 space-y-2">
                          {displayOptions.map((option, optIndex) => (
                            <div key={option.id} className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-xs text-slate-600">{option.style}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs px-2"
                                  onClick={() => {
                                    navigator.clipboard.writeText(option.script);
                                    toast.success(`${seg.label}话术已复制`);
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  复制
                                </Button>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {option.script}
                              </p>
                              {option.tips && (
                                <p className="text-xs text-slate-500 mt-2 pt-2 border-t">
                                  💡 {option.tips}
                                </p>
                              )}
                            </div>
                          ))}
                          
                          {/* 更多选项提示 - 桌面端展开全部 */}
                          <div className="hidden md:block">
                            {data.options.length > 1 && (
                              <details className="bg-white rounded-lg">
                                <summary className="p-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                                  查看其他 {data.options.length - 1} 种话术选择
                                </summary>
                                <div className="p-2 space-y-2">
                                  {data.options.slice(1).map((option) => (
                                    <div key={option.id} className="bg-slate-50 rounded-lg p-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-xs text-slate-600">{option.style}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-xs px-2"
                                          onClick={() => {
                                            navigator.clipboard.writeText(option.script);
                                            toast.success("话术已复制");
                                          }}
                                        >
                                          <Copy className="w-3 h-3 mr-1" />
                                        </Button>
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed">{option.script}</p>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 合规提醒 */}
                  {parsedData.complianceNotes && parsedData.complianceNotes.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-800 text-sm mb-2">⚠️ 合规提醒</h4>
                      <ul className="text-xs text-amber-700 space-y-1">
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
                          <p className="text-amber-600 font-medium">话术正在生成中...</p>
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
                            生成完成后自动保存到历史记录
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
                      <p className="text-xs mt-2">话术会自动保存到历史记录</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 历史话术 - 手机端优化：直接展示内容 */}
        <Card className="mt-4 md:mt-6 shadow-sm">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base md:text-lg">历史话术</CardTitle>
              <div className="flex gap-2">
                <Select value={historyProduct} onValueChange={setHistoryProduct}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="全部产品" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部产品</SelectItem>
                    {productList.map((prod) => (
                      <SelectItem key={prod} value={prod}>{prod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={loadSavedScripts}
                >
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {savedScripts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                暂无历史话术，点击上方"生成话术"按钮创建
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {savedScripts.map((script) => {
                  // 解析话术内容
                  const warmUp = script.warm_up ? (typeof script.warm_up === 'string' ? JSON.parse(script.warm_up) : script.warm_up) : null;
                  const retention = script.retention ? (typeof script.retention === 'string' ? JSON.parse(script.retention) : script.retention) : null;
                  const lockCustomer = script.lock_customer ? (typeof script.lock_customer === 'string' ? JSON.parse(script.lock_customer) : script.lock_customer) : null;
                  const pushOrder = script.push_order ? (typeof script.push_order === 'string' ? JSON.parse(script.push_order) : script.push_order) : null;
                  const atmosphere = script.atmosphere ? (typeof script.atmosphere === 'string' ? JSON.parse(script.atmosphere) : script.atmosphere) : null;
                  
                  return (
                    <div 
                      key={script.id}
                      className="border rounded-xl overflow-hidden bg-white"
                    >
                      {/* 头部信息 */}
                      <div className="p-3 md:p-4 bg-slate-50 border-b">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{script.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {script.products?.name} · {new Date(script.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {script.products?.category && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {script.products.category}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScript(script.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 话术内容 - 直接展示 */}
                      <div className="p-3 md:p-4 space-y-3">
                        {/* 预热 */}
                        {warmUp?.options?.[0] && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Target className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-sm text-blue-700">预热环节</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                              {warmUp.options[0].script}
                            </p>
                          </div>
                        )}
                        
                        {/* 留人 */}
                        {retention?.options?.[0] && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-sm text-green-700">留人环节</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                              {retention.options[0].script}
                            </p>
                          </div>
                        )}
                        
                        {/* 锁客 */}
                        {lockCustomer?.options?.[0] && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <Lock className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-sm text-purple-700">锁客环节</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                              {lockCustomer.options[0].script}
                            </p>
                          </div>
                        )}
                        
                        {/* 逼单 */}
                        {pushOrder?.options?.[0] && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-sm text-orange-700">逼单环节</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                              {pushOrder.options[0].script}
                            </p>
                          </div>
                        )}
                        
                        {/* 气氛 */}
                        {atmosphere?.options?.[0] && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                                <PartyPopper className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-sm text-pink-700">气氛环节</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                              {atmosphere.options[0].script}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="px-3 pb-3 md:px-4 md:pb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full h-8 text-xs"
                          onClick={() => {
                            // 复制全部话术
                            const allText = [
                              warmUp?.options?.[0]?.script,
                              retention?.options?.[0]?.script,
                              lockCustomer?.options?.[0]?.script,
                              pushOrder?.options?.[0]?.script,
                              atmosphere?.options?.[0]?.script,
                            ].filter(Boolean).join('\n\n');
                            navigator.clipboard.writeText(allText);
                            toast.success("话术已复制到剪贴板");
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制全部话术
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
