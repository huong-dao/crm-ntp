"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMember } from "@/actions/member-actions";
import { Button } from "@/components/ui/button";

export function DeleteMemberButton({
  memberId,
  memberCode,
  memberName,
  redirectTo = "/members",
}: {
  memberId: string;
  memberCode: string;
  memberName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);

    const result = await deleteMember(memberId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push(redirectTo);
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
        onClick={() => setOpen(true)}
      >
        Xóa
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-member-title"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2
          id="delete-member-title"
          className="text-lg font-semibold text-gray-900"
        >
          Xác nhận xóa thành viên
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Bạn có chắc muốn xóa{" "}
          <span className="font-medium text-gray-900">
            {memberCode} — {memberName}
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setError("");
            }}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-red-700 hover:bg-red-800"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
