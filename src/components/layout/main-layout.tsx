"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto 
        md:ml-0
        mt-14 md:mt-0 
        mb-14 md:mb-0
      ">
        {children}
      </main>
    </div>
  );
}
