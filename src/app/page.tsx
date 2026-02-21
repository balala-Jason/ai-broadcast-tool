"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Package, 
  Sparkles, 
  Database, 
  ArrowRight,
  TrendingUp,
  FileText,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  productsCount: number;
  scriptsCount: number;
  materialsCount: number;
  knowledgeCount: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    productsCount: 0,
    scriptsCount: 0,
    materialsCount: 0,
    knowledgeCount: 0,
  });

  useEffect(() => {
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const [products, scripts, materials, knowledge] = await Promise.all([
          fetch("/api/products").then(r => r.json()),
          fetch("/api/scripts").then(r => r.json()),
          fetch("/api/materials").then(r => r.json()),
          fetch("/api/knowledge").then(r => r.json()),
        ]);

        setStats({
          productsCount: products.total || 0,
          scriptsCount: scripts.total || 0,
          materialsCount: materials.total || 0,
          knowledgeCount: knowledge.data?.reduce((sum: number, c: { document_count?: number }) => sum + (c.document_count || 0), 0) || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: "搜索素材",
      description: "搜索抖音直播视频，采集优秀话术素材",
      icon: Video,
      href: "/materials",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "添加产品",
      description: "录入新的农产品信息，为话术生成做准备",
      icon: Package,
      href: "/products",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "生成话术",
      description: "选择产品和风格，AI自动生成直播话术",
      icon: Sparkles,
      href: "/scripts",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "知识库管理",
      description: "管理话术素材库，提升生成质量",
      icon: Database,
      href: "/knowledge",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        <PageHeader 
          title="工作台" 
          description="农产品直播话术AI生成系统"
        />

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">产品数量</p>
                  <p className="text-2xl font-bold">{stats.productsCount}</p>
                </div>
                <Package className="w-10 h-10 text-emerald-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">话术数量</p>
                  <p className="text-2xl font-bold">{stats.scriptsCount}</p>
                </div>
                <FileText className="w-10 h-10 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">视频素材</p>
                  <p className="text-2xl font-bold">{stats.materialsCount}</p>
                </div>
                <Video className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">知识库文档</p>
                  <p className="text-2xl font-bold">{stats.knowledgeCount}</p>
                </div>
                <Database className="w-10 h-10 text-orange-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作 */}
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-slate-500">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 使用指南 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              使用流程
            </CardTitle>
            <CardDescription>四步快速生成专业直播话术</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: 1, title: "采集素材", desc: "搜索抖音直播视频，分析优秀话术" },
                { step: 2, title: "录入产品", desc: "填写产品信息、卖点、禁用词等" },
                { step: 3, title: "生成话术", desc: "选择风格模板，AI自动生成话术" },
                { step: 4, title: "导出使用", desc: "编辑调整后导出到直播平台" },
              ].map((item, index) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
