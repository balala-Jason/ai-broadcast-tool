"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Loader2,
  FileText,
  AlertTriangle,
  RefreshCw
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

interface Script {
  id: string;
  title: string;
  warm_up: string | null;
  retention: string | null;
  lock_customer: string | null;
  push_order: string | null;
  atmosphere: string | null;
  opening: string | null;
  product_intro: string | null;
  selling_points: string | null;
  promotions: string | null;
  closing: string | null;
  faq: string | null;
  quality_score: string | null;
  compliance_status: string | null;
  created_at: string;
  products: { name: string };
  style_templates: { name: string };
}

// 5段式话术结构定义（对应抖音核心算法指标）
const SCRIPT_SEGMENTS = [
  { key: "warmUp", label: "预热环节", target: "停留时长", color: "bg-blue-500", icon: "🎯", desc: "吸引注意力，建立期待感" },
  { key: "retention", label: "留人环节", target: "互动率", color: "bg-green-500", icon: "💬", desc: "引导互动，提升热度" },
  { key: "lockCustomer", label: "锁客环节", target: "转化率", color: "bg-purple-500", icon: "🔒", desc: "建立信任，激发购买意愿" },
  { key: "pushOrder", label: "逼单环节", target: "GPM", color: "bg-orange-500", icon: "⚡", desc: "制造紧迫，促成下单" },
  { key: "atmosphere", label: "气氛组", target: "参与度", color: "bg-pink-500", icon: "🎉", desc: "营造氛围，维持热度" },
];

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
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
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
    setCurrentScriptId(null);

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

  // 复制内容
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedContent]);

  // 导出话术
  const handleExport = useCallback(() => {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `话术_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedContent]);

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

  return (
    <MainLayout>
      <div className="p-6">
        <PageHeader title="话术生成" description="选择产品和风格，AI自动生成直播话术" />

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
                  <CardDescription>抖音实战5段式话术（对应核心算法指标）</CardDescription>
                </div>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? "已复制" : "复制"}
                    </Button>
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
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* 5段式指标展示 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {SCRIPT_SEGMENTS.map((seg) => (
                  <div key={seg.key} className="text-center p-2 rounded-lg bg-slate-100">
                    <div className="text-lg">{seg.icon}</div>
                    <div className="text-xs font-medium mt-1">{seg.label}</div>
                    <div className="text-xs text-slate-500">{seg.target}</div>
                  </div>
                ))}
              </div>
              
              <div 
                ref={outputRef}
                className="min-h-[400px] max-h-[600px] overflow-y-auto bg-slate-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap"
              >
                {generatedContent || (
                  <div className="text-slate-400 text-center py-12">
                    选择产品和风格后点击生成按钮
                  </div>
                )}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                )}
              </div>
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
    </MainLayout>
  );
}
