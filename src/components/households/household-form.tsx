"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createHousehold,
  updateHousehold,
  type HeadMemberOption,
} from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function HouseholdForm({
  mode,
  headOptions,
  household,
}: {
  mode: "create" | "edit";
  headOptions: HeadMemberOption[];
  household?: { id: string; code: string; headMemberId: string | null };
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && household;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const headValue = form.get("headMemberId") as string;
    const headMemberId = headValue === "" ? null : headValue;

    const result = isEdit
      ? await updateHousehold(household.id, { headMemberId })
      : await createHousehold({ headMemberId });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/households/${result.data.id}`);
    router.refresh();
  }

  const cancelHref = isEdit
    ? `/households/${household.id}`
    : "/households";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {isEdit && (
          <div className="space-y-2">
            <Label>Mã hộ</Label>
            <p className="text-lg font-semibold text-[#1e3a5f]">
              {household.code}
            </p>
          </div>
        )}
        {!isEdit && (
          <p className="text-sm text-gray-600">
            Mã hộ sẽ được tự động sinh khi lưu (định dạng 0001).
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="headMemberId">Chủ hộ (tùy chọn)</Label>
          <select
            id="headMemberId"
            name="headMemberId"
            className={selectClass}
            defaultValue={household?.headMemberId ?? ""}
          >
            <option value="">— Chưa chọn —</option>
            {headOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.code} — {member.fullName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {isEdit
              ? "Chọn thành viên trong hộ hoặc thành viên chưa có hộ."
              : "Chỉ chọn thành viên chưa có hộ."}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo hộ gia đình"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
