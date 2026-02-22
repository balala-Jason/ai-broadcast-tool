"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

// 底部导航（移动端常用功能）
const bottomNav = [
  { name: "工作台", href: "/", icon: LayoutDashboard },
  { name: "素材", href: "/materials", icon: Video },
  { name: "话术", href: "/scripts", icon: Sparkles },
  { name: "我的", href: "/settings", icon: Settings },
];

// 导航项组件
function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={onNavigate}
          >
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
  );
}

// 桌面端侧边栏
function DesktopSidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      "hidden md:flex flex-col h-screen bg-slate-900 text-white transition-all duration-300",
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
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <NavItems collapsed={collapsed} />
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

// 移动端底部导航
function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
      <nav className="flex justify-around items-center h-14">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 min-w-[64px]",
                isActive ? "text-emerald-600" : "text-slate-500"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// 移动端顶部栏
function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <span className="font-bold">话术AI</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0 bg-slate-900 border-slate-700">
          <SheetHeader className="h-14 border-b border-slate-700 flex flex-row items-center justify-between px-4">
            <SheetTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>菜单</span>
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <NavItems collapsed={false} onNavigate={() => setOpen(false)} />
          </div>
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 text-center">
              农产品直播话术AI生成系统
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* 桌面端侧边栏 */}
      <DesktopSidebar collapsed={collapsed} />
      
      {/* 移动端顶部栏 */}
      <MobileTopBar />
      
      {/* 移动端底部导航 */}
      <MobileBottomNav />
    </>
  );
}
