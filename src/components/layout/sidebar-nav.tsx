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
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Thành viên", icon: Users },
  { href: "/households", label: "Hộ gia đình", icon: Home },
  { href: "/departments", label: "Ban ngành", icon: Layers },
  { href: "/visit-teams", label: "Tổ thăm viếng", icon: ClipboardList },
  { href: "/visit-requests", label: "Đơn thăm viếng", icon: FileText },
];

export const adminSidebarNavItem: SidebarNavItem = {
  href: "/users",
  label: "Tài khoản",
  icon: UserCog,
};

export function SidebarNav({
  isAdmin,
  onNavigate,
  className,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...sidebarNavItems, adminSidebarNavItem]
    : sidebarNavItems;

  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}
