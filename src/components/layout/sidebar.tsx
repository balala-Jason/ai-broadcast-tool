"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  Package, 
  MessageSquare, 
  Database, 
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Settings,
  Palette
} from "lucide-react";

const navigation = [
  { 
    name: "工作台", 
    href: "/", 
    icon: LayoutDashboard 
  },
  { 
    name: "素材采集", 
    href: "/materials", 
    icon: Video 
  },
  { 
    name: "产品管理", 
    href: "/products", 
    icon: Package 
  },
  { 
    name: "话术生成", 
    href: "/scripts", 
    icon: Sparkles 
  },
  { 
    name: "风格模板", 
    href: "/templates", 
    icon: Palette 
  },
  { 
    name: "知识库", 
    href: "/knowledge", 
    icon: Database 
  },
  { 
    name: "系统设置", 
    href: "/settings", 
    icon: Settings 
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">话术AI</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800",
                    isActive && "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center">
            农产品直播话术AI生成系统
          </div>
        </div>
      )}
    </div>
  );
}
