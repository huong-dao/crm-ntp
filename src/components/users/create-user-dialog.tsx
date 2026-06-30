"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, CreateUserIcon, SaveIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@prisma/client";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;
    const role = form.get("role") as UserRole;

    const result = await createUser({ username, password, role });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    e.currentTarget.reset();
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" icon={CreateUserIcon} onClick={() => setOpen(true)}>
        Tạo tài khoản
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2
          id="create-user-title"
          className="text-lg font-semibold text-gray-900"
        >
          Tạo tài khoản mới
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              name="username"
              required
              autoComplete="off"
              placeholder="vd: staff01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-role">Role</Label>
            <select id="new-role" name="role" className={selectClass} defaultValue="user">
              <option value="user">Người dùng</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              icon={CancelIcon}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} icon={loading ? undefined : SaveIcon}>
              {loading ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
