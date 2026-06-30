"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { CancelIcon, MenuIcon } from "@/lib/button-icons";

export function MobileSidebar({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="lg:hidden"
        icon={MenuIcon}
        onClick={() => setOpen(true)}
        aria-label="Mở menu điều hướng"
      />

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-[#1e3a5f] text-white shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-sm font-semibold">HTTL Nguyễn Tri Phương</p>
                <p className="text-xs text-white/70">Quản lý nội bộ</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                icon={CancelIcon}
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SidebarNav
                isAdmin={isAdmin}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
