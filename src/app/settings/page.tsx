"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Info,
  Server,
  Shield
} from "lucide-react";

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <PageHeader title="系统设置" description="配置系统参数和选项" />

        <div className="grid gap-4 md:gap-6">
          {/* 系统信息 */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Info className="w-4 h-4 md:w-5 md:h-5" />
                系统信息
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">系统版本</p>
                  <p className="font-medium text-sm md:text-base">v1.0.0</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">框架</p>
                  <p className="font-medium text-sm md:text-base">Next.js 16</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">数据库</p>
                  <p className="font-medium text-sm md:text-base">Supabase</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">AI模型</p>
                  <p className="font-medium text-sm md:text-base">Doubao Pro</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 功能模块 */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Server className="w-4 h-4 md:w-5 md:h-5" />
                功能模块
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">系统各模块状态</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-2 md:space-y-3">
                {[
                  { name: "素材采集", status: "active", description: "抖音视频搜索与采集" },
                  { name: "AI分析", status: "active", description: "ASR转录与话术分析" },
                  { name: "话术生成", status: "active", description: "AI话术生成引擎" },
                  { name: "知识库", status: "active", description: "向量检索知识库" },
                  { name: "合规检查", status: "active", description: "广告法合规检测" },
                ].map((module) => (
                  <div key={module.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm">{module.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{module.description}</p>
                    </div>
                    <Badge variant="default" className="bg-emerald-500 text-xs flex-shrink-0">
                      运行中
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">1. 素材采集</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  在"素材采集"页面搜索抖音直播视频，添加到素材库后点击分析按钮，
                  系统会自动进行ASR转录和AI分析，提取话术技巧和金句。
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2">2. 产品管理</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  录入农产品信息，包括名称、品类、产地、价格、卖点、资质证书等，
                  可以设置禁用宣传语以确保护符合合规要求。
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2">3. 话术生成</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  选择产品和风格模板，配置目标人群和直播时长等参数，
                  点击生成按钮，AI会基于知识库素材生成专业的直播话术。
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2">4. 知识库管理</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  创建知识库集合，导入话术样本、产品知识、FAQ等内容，
                  系统会自动进行向量化处理，用于话术生成时的智能检索。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
