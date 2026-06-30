"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  updateUser,
  type MemberLinkOption,
  type UserDetail,
} from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function EditUserForm({
  user,
  memberOptions,
  isSelf,
}: {
  user: UserDetail;
  memberOptions: MemberLinkOption[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState(user.memberId ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await updateUser({
      id: user.id,
      password: (form.get("password") as string) || null,
      role: form.get("role") as "admin" | "user",
      isActive: form.get("isActive") === "on",
      memberId: memberId || null,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/users");
    router.refresh();
  }

  const memberSelectOptions = [
    { value: "", label: "— Không liên kết —", searchText: "" },
    ...memberOptions.map((member) => ({
      value: member.id,
      label: `${member.code} — ${member.fullName}`,
      searchText: `${member.code} ${member.fullName}`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={user.username} readOnly className="bg-gray-50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Để trống nếu không đổi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            className={selectClass}
            defaultValue={user.role}
            disabled={isSelf}
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị</option>
          </select>
          {isSelf && (
            <p className="text-xs text-gray-500">
              Không thể đổi role của chính mình.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user.isActive}
              disabled={isSelf}
              className="h-4 w-4 rounded border-gray-300 disabled:opacity-60"
            />
            Tài khoản hoạt động
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="memberId">Liên kết thành viên</Label>
          <SearchableSelect
            id="memberId"
            options={memberSelectOptions}
            value={memberId}
            onChange={setMemberId}
            placeholder="— Không liên kết —"
            searchPlaceholder="Tìm theo mã hoặc tên..."
          />
          <p className="text-xs text-gray-500">
            Mỗi thành viên chỉ liên kết với một tài khoản.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading} icon={loading ? undefined : SaveIcon}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href="/users">Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
