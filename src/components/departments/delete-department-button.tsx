"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDepartment } from "@/actions/department-actions";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/lib/button-icons";

export function DeleteDepartmentButton({
  departmentId,
  departmentName,
}: {
  departmentId: string;
  departmentName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Xóa ban ngành "${departmentName}"? Hành động không thể hoàn tác.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");

    const result = await deleteDepartment(departmentId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/departments");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
        icon={loading ? undefined : DeleteIcon}
        disabled={loading}
        onClick={handleDelete}
      >
        {loading ? "Đang xóa..." : "Xóa ban ngành"}
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
