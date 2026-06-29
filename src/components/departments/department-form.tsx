"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createDepartment,
  updateDepartment,
} from "@/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseDepartmentFormData,
  type DepartmentFormInput,
} from "@/lib/validations/department";

export function DepartmentForm({
  mode,
  department,
}: {
  mode: "create" | "edit";
  department?: {
    id: string;
    name: string;
    minAge: number | null;
    maxAge: number | null;
  };
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && department;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = parseDepartmentFormData(
      new FormData(e.currentTarget)
    ) as DepartmentFormInput;

    const result = isEdit
      ? await updateDepartment(department.id, payload)
      : await createDepartment(payload);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(isEdit ? `/departments/${department.id}` : "/departments");
    router.refresh();
  }

  const cancelHref = isEdit ? `/departments/${department.id}` : "/departments";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên ban ngành *</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={100}
            defaultValue={department?.name ?? ""}
            placeholder="vd: Thanh niên, Phụ nữ, Trẻ em..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minAge">Độ tuổi tối thiểu</Label>
          <Input
            id="minAge"
            name="minAge"
            type="number"
            min={0}
            max={150}
            defaultValue={department?.minAge ?? ""}
            placeholder="vd: 13"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAge">Độ tuổi tối đa</Label>
          <Input
            id="maxAge"
            name="maxAge"
            type="number"
            min={0}
            max={150}
            defaultValue={department?.maxAge ?? ""}
            placeholder="vd: 35"
          />
          <p className="text-xs text-gray-500">
            Để trống nếu ban ngành không giới hạn theo tuổi.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo ban ngành"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
