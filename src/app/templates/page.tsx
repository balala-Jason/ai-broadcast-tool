"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Pencil, 
  Trash2, 
  Palette,
  Loader2
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface StyleTemplate {
  id: string;
  name: string;
  style_type: string;
  description: string | null;
  tone_guidelines: string | null;
  is_active: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    styleType: "",
    description: "",
    toneGuidelines: "",
  });

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/style-templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Load templates failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const initDefaultTemplates = async () => {
    const defaultTemplates = [
      {
        name: "亲民朴实型",
        style_type: "亲民朴实型",
        description: "以真诚、接地气的语气与观众交流，建立信任感",
        tone_guidelines: "使用亲切、朴实的语言，避免过于华丽的词藻，多用日常用语和比喻",
      },
      {
        name: "激情促销型",
        style_type: "激情促销型",
        description: "以高昂热情感染观众，强调优惠力度和紧迫感",
        tone_guidelines: "语速快、语气激昂，多使用感叹句和强调词，营造紧张氛围",
      },
    ];

    for (const template of defaultTemplates) {
      try {
        await fetch("/api/style-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
      } catch (error) {
        console.error("Init template failed:", error);
      }
    }
    
    loadTemplates();
  };

  const handleOpenDialog = (template?: StyleTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        styleType: template.style_type,
        description: template.description || "",
        toneGuidelines: template.tone_guidelines || "",
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        styleType: "",
        description: "",
        toneGuidelines: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...(editingTemplate ? { id: editingTemplate.id } : {}),
        name: formData.name,
        styleType: formData.styleType,
        description: formData.description || null,
        toneGuidelines: formData.toneGuidelines || null,
      };

      const response = await fetch("/api/style-templates", {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        loadTemplates();
      }
    } catch (error) {
      console.error("Save template failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个风格模板吗？")) return;
    
    try {
      await fetch(`/api/style-templates?id=${id}`, { method: "DELETE" });
      loadTemplates();
    } catch (error) {
      console.error("Delete template failed:", error);
    }
  };

  const styleTypes = [
    "亲民朴实型", "激情促销型", "专业科普型", "故事叙述型", "互动娱乐型"
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <PageHeader title="风格模板" description="管理直播话术的风格模板">
          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
            <Button variant="outline" size="sm" onClick={initDefaultTemplates} className="h-9">
              初始化默认模板
            </Button>
            <Button size="sm" onClick={() => handleOpenDialog()} className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              添加模板
            </Button>
          </div>
        </PageHeader>

        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-slate-500">
                <Palette className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">暂无风格模板</p>
                <Button size="sm" className="mt-4" onClick={initDefaultTemplates}>
                  初始化默认模板
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden shadow-sm">
                    <CardHeader className="p-3 md:p-4 pb-2 md:pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base md:text-lg line-clamp-1">{template.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {template.style_type}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(template)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                      <p className="text-xs md:text-sm text-slate-500 mb-3 line-clamp-2">
                        {template.description || "暂无描述"}
                      </p>
                      {template.tone_guidelines && (
                        <div className="p-2 bg-slate-50 rounded text-xs text-slate-600 line-clamp-2">
                          {template.tone_guidelines}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新增/编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] md:max-w-2xl p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{editingTemplate ? "编辑风格模板" : "添加风格模板"}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                配置话术风格的具体规则
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 md:gap-4 py-3 md:py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="name" className="text-sm">模板名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：亲民朴实型"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="styleType" className="text-sm">风格类型 *</Label>
                  <Select 
                    value={formData.styleType} 
                    onValueChange={(value) => setFormData({ ...formData, styleType: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="选择风格类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {styleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="description" className="text-sm">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这种风格的特点和适用场景"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="toneGuidelines" className="text-sm">语气语调指南</Label>
                <Textarea
                  id="toneGuidelines"
                  value={formData.toneGuidelines}
                  onChange={(e) => setFormData({ ...formData, toneGuidelines: e.target.value })}
                  placeholder="描述话术的语气、语调、用词风格等"
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formData.name || !formData.styleType}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
