"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  ClipboardList,
  FileText,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Thành viên", icon: Users },
  { href: "/households", label: "Hộ gia đình", icon: Home },
  { href: "/visit-teams", label: "Tổ thăm viếng", icon: ClipboardList },
  { href: "/visit-requests", label: "Đơn thăm viếng", icon: FileText },
];

const adminNav = { href: "/users", label: "Tài khoản", icon: UserCog };

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...navItems, adminNav] : navItems;

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-[#1e3a5f] text-white">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm font-semibold">HTTL Nguyễn Tri Phương</p>
        <p className="text-xs text-white/70">Quản lý nội bộ</p>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
