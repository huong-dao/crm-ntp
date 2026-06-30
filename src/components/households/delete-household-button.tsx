"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHousehold } from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, DeleteIcon } from "@/lib/button-icons";

export function DeleteHouseholdButton({
  householdId,
  householdCode,
}: {
  householdId: string;
  householdCode: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);

    const result = await deleteHousehold(householdId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push("/households");
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
        icon={DeleteIcon}
        onClick={() => setOpen(true)}
      >
        Xóa hộ
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Xác nhận xóa hộ</h2>
        <p className="mt-2 text-sm text-gray-600">
          Bạn có chắc muốn xóa hộ <strong>{householdCode}</strong>? Chỉ xóa được
          khi hộ không còn thành viên.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
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
          <Button
            type="button"
            className="bg-red-700 hover:bg-red-800"
            icon={loading ? undefined : DeleteIcon}
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
