"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";

export function Header({
  username,
  role,
  isAdmin,
}: {
  username: string;
  role: string;
  isAdmin: boolean;
}) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileSidebar isAdmin={isAdmin} />
        <p className="truncate text-sm text-gray-500">CRM Nội bộ</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden text-sm text-gray-700 sm:inline">
          {username}{" "}
          <span className="text-gray-400">({role})</span>
        </span>
        <span className="text-sm text-gray-700 sm:hidden">{username}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
