"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  username,
  role,
}: {
  username: string;
  role: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <p className="text-sm text-gray-500">CRM Nội bộ</p>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {username}{" "}
          <span className="text-gray-400">({role})</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
