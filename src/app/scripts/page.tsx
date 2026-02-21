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
  DollarSign
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

// 5段式话术结构定义（对应抖音核心算法指标）
const SCRIPT_SEGMENTS = [
  { 
    key: "warmUp", 
    label: "预热环节", 
    target: "停留时长", 
    icon: Target, 
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    desc: "吸引注意力，建立期待感，前3秒决定去留"
  },
  { 
    key: "retention", 
    label: "留人环节", 
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
    label: "锁客环节", 
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
    label: "逼单环节", 
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
    label: "气氛组", 
    target: "参与度", 
    icon: PartyPopper, 
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    desc: "营造氛围，维持热度"
  },
];

// 指标图标
const METRIC_ICONS: Record<string, typeof Clock> = {
  "停留时长": Clock,
  "互动率": Users,
  "转化率": TrendingUp,
  "GPM": DollarSign,
  "参与度": PartyPopper,
};

export default function ScriptsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 生成参数
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("30");
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [parsedData, setParsedData] = useState<ParsedScriptData | null>(null);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSegment, setActiveSegment] = useState("warmUp");
  
  // 选项详情弹窗
  const [optionDialog, setOptionDialog] = useState<{
    open: boolean;
    segment: string;
    option: ScriptOption | null;
  }>({ open: false, segment: "", option: null });
  
  // 已选择的话术
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  const outputRef = useRef<HTMLDivElement>(null);

  // 加载初始数据
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

  // 生成话术（流式）
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
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

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
                setGeneratedContent((prev) => prev + data.content);
              } else if (data.type === "done") {
                setCurrentScriptId(data.scriptId);
                if (data.scriptData) {
                  setParsedData(data.scriptData);
                }
              } else if (data.type === "error") {
                console.error("Stream error:", data.message);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error("Generate failed:", error);
      alert("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProduct, selectedTemplate, targetAudience, duration]);

  // 选择话术
  const handleSelectOption = useCallback((segment: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [segment]: optionId
    }));
  }, []);

  // 复制单个选项
  const handleCopyOption = useCallback((script: string) => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // 导出已选择的话术
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
          // 如果没有选择，导出所有选项
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

  // 合规检查
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

  // 获取已选择数量
  const selectedCount = Object.values(selectedOptions).filter(Boolean).length;

  return (
    <MainLayout>
      <div className="p-6">
        <PageHeader title="话术生成" description="选择产品和风格，AI自动生成直播话术（每环节5+种选择）" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：生成参数 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>生成参数</CardTitle>
              <CardDescription>配置话术生成的参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择产品 *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个产品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>风格模板 *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>目标人群</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="如：家庭主妇、中老年人"
                />
              </div>

              <div className="space-y-2">
                <Label>直播时长（分钟）</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={5}
                  max={120}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedProduct || !selectedTemplate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成话术
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 右侧：生成结果 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>生成结果</CardTitle>
                  <CardDescription>
                    抖音实战5段式话术 · 每环节5+种选择 · 点击选择心仪版本
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {parsedData && (
                    <>
                      <Badge variant="secondary" className="px-3 py-1">
                        已选择 {selectedCount}/5
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-1" />
                        导出
                      </Button>
                      {currentScriptId && (
                        <Button size="sm" variant="outline" onClick={handleCheckCompliance}>
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          合规检查
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {parsedData ? (
                <div className="space-y-4">
                  {/* 5段式指标概览 */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {SCRIPT_SEGMENTS.map((seg) => {
                      const Icon = seg.icon;
                      const data = parsedData[seg.key as keyof ParsedScriptData] as ScriptSegment | undefined;
                      const optionCount = data?.options?.length || 0;
                      const isSelected = !!selectedOptions[seg.key];
                      
                      return (
                        <button
                          key={seg.key}
                          onClick={() => setActiveSegment(seg.key)}
                          className={`relative p-3 rounded-xl border-2 transition-all ${
                            activeSegment === seg.key 
                              ? `${seg.borderColor} ${seg.bgColor} shadow-md` 
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${seg.color} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium">{seg.label}</span>
                            <span className="text-xs text-slate-500">{optionCount}种</span>
                            {isSelected && (
                              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${seg.bgColor} border-2 ${seg.borderColor} flex items-center justify-center`}>
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                          </div>
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
                        <div className={`p-4 rounded-lg ${seg.bgColor} ${seg.borderColor} border`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{data.title}</span>
                            <Badge variant="outline">{data.target}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{data.description}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {data.options?.map((option, index) => {
                            const isSelected = selectedOptions[seg.key] === option.id;
                            
                            return (
                              <div
                                key={option.id}
                                onClick={() => handleSelectOption(seg.key, option.id)}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected 
                                    ? `${seg.borderColor} ${seg.bgColor} shadow-md` 
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${seg.color}`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium">{option.style}</span>
                                      {isSelected && (
                                        <Badge className={`${seg.textColor} ${seg.bgColor}`}>
                                          <Check className="w-3 h-3 mr-1" />
                                          已选择
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                                      {option.script}
                                    </p>
                                    {option.tips && (
                                      <p className="text-xs text-slate-500 mt-2 italic">
                                        💡 {option.tips}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOptionDialog({ open: true, segment: seg.key, option });
                                      }}
                                    >
                                      查看
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyOption(option.script);
                                      }}
                                    >
                                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                  </div>
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
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-800 mb-2">⚠️ 合规提醒</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
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
                  className="min-h-[400px] max-h-[600px] overflow-y-auto bg-slate-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap"
                >
                  {generatedContent || (
                    <div className="text-slate-400 text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>选择产品和风格后点击生成按钮</p>
                      <p className="text-xs mt-2">每个环节将生成5种以上不同风格的话术供您选择</p>
                    </div>
                  )}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 历史话术 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>历史话术</CardTitle>
          </CardHeader>
          <CardContent>
            {savedScripts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无历史话术
              </div>
            ) : (
              <div className="space-y-3">
                {savedScripts.slice(0, 5).map((script) => (
                  <div 
                    key={script.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <h4 className="font-medium">{script.title}</h4>
                      <p className="text-sm text-slate-500">
                        {script.products?.name} | {script.style_templates?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {script.quality_score && (
                        <Badge variant="secondary">评分: {script.quality_score}</Badge>
                      )}
                      {script.compliance_status && (
                        <Badge 
                          variant={script.compliance_status === "pass" ? "default" : "destructive"}
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

      {/* 话术详情弹窗 */}
      <Dialog open={optionDialog.open} onOpenChange={(open) => setOptionDialog({ ...optionDialog, open })}>
        <DialogContent className="max-w-2xl">
          {optionDialog.option && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-slate-100 rounded text-sm">{optionDialog.option.style}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {optionDialog.option.script}
                  </p>
                </div>
                
                {optionDialog.option.tips && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">💡 使用技巧：</span>
                      {optionDialog.option.tips}
                    </p>
                  </div>
                )}
                
                {optionDialog.option.valuePoint && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">
                      <span className="font-medium">🎯 核心价值：</span>
                      {optionDialog.option.valuePoint}
                    </p>
                  </div>
                )}
                
                {optionDialog.option.urgency && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">⚡ 紧迫点：</span>
                      {optionDialog.option.urgency}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      handleSelectOption(optionDialog.segment, optionDialog.option!.id);
                      setOptionDialog({ ...optionDialog, open: false });
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    选择此话术
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCopyOption(optionDialog.option!.script)}
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
