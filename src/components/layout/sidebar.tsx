"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-[#1e3a5f] text-white lg:block">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm font-semibold">HTTL Nguyễn Tri Phương</p>
        <p className="text-xs text-white/70">Ban Thăm Viếng</p>
      </div>
      <div className="p-3">
        <SidebarNav isAdmin={isAdmin} />
      </div>
    </aside>
  );
}
