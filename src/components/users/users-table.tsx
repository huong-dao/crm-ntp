"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserActive, type UserListItem } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { EditIcon, LockIcon, UnlockIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { cn } from "@/lib/utils";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function roleLabel(role: UserListItem["role"]) {
  return role === "admin" ? "Quản trị" : "Người dùng";
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleToggle(user: UserListItem) {
    setError("");
    setPendingId(user.id);

    const result = await toggleUserActive({
      id: user.id,
      isActive: !user.isActive,
    });

    setPendingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (users.length === 0) {
    return (
      <p className="mt-6 text-sm text-gray-500">Chưa có tài khoản nào.</p>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>
      )}
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Username
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Thành viên
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user, index) => {
              const isSelf = user.id === currentUserId;
              const isPending = pendingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.username}
                    {isSelf && (
                      <span className="ml-2 text-xs text-gray-400">(bạn)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {roleLabel(user.role)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.memberName
                      ? `${user.memberCode} — ${user.memberName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {user.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" asChild icon={EditIcon}>
                        <a href={`/users/${user.id}/edit`}>Sửa</a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={
                          isPending
                            ? undefined
                            : user.isActive
                              ? LockIcon
                              : UnlockIcon
                        }
                        disabled={isSelf || isPending}
                        onClick={() => handleToggle(user)}
                      >
                        {isPending
                          ? "..."
                          : user.isActive
                            ? "Vô hiệu hóa"
                            : "Kích hoạt"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isPending = pendingId === user.id;

          return (
            <MobileDataCard
              key={user.id}
              actions={
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" asChild icon={EditIcon}>
                    <a href={`/users/${user.id}/edit`}>Sửa</a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={
                      isPending
                        ? undefined
                        : user.isActive
                          ? LockIcon
                          : UnlockIcon
                    }
                    disabled={isSelf || isPending}
                    onClick={() => handleToggle(user)}
                  >
                    {isPending
                      ? "..."
                      : user.isActive
                        ? "Vô hiệu hóa"
                        : "Kích hoạt"}
                  </Button>
                </div>
              }
            >
              <p className="font-semibold text-gray-900">
                {user.username}
                {isSelf && (
                  <span className="ml-2 text-xs text-gray-400">(bạn)</span>
                )}
              </p>
              <div className="mt-2">
                <MobileDataRow label="Role">{roleLabel(user.role)}</MobileDataRow>
                <MobileDataRow label="Thành viên">
                  {user.memberName
                    ? `${user.memberCode} — ${user.memberName}`
                    : "—"}
                </MobileDataRow>
                <MobileDataRow label="Trạng thái">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {user.isActive ? "Hoạt động" : "Đã khóa"}
                  </span>
                </MobileDataRow>
                <MobileDataRow label="Ngày tạo">
                  {formatDate(user.createdAt)}
                </MobileDataRow>
              </div>
            </MobileDataCard>
          );
        })}
      </div>
    </div>
  );
}
