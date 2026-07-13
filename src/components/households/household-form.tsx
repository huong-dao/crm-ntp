"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createHousehold,
  updateHousehold,
  type HeadMemberOption,
} from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function HouseholdForm({
  mode,
  headOptions,
  household,
  defaultHeadMemberId,
}: {
  mode: "create" | "edit";
  headOptions: HeadMemberOption[];
  household?: { id: string; code: string; headMemberId: string | null };
  defaultHeadMemberId?: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && household;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [headMemberId, setHeadMemberId] = useState(
    household?.headMemberId ?? defaultHeadMemberId ?? ""
  );

  const headSelectOptions = useMemo(
    () =>
      headOptions.map((member) => ({
        value: member.id,
        label: `${member.code} — ${member.fullName}`,
        searchText: `${member.code} ${member.fullName}`,
      })),
    [headOptions]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const headValue = headMemberId.trim();
    const result = isEdit
      ? await updateHousehold(household.id, {
          headMemberId: headValue || null,
        })
      : await createHousehold({
          headMemberId: headValue || null,
        });

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
          <Label htmlFor="headMemberId">
            {isEdit ? "Đổi chủ hộ *" : "Chủ hộ (tùy chọn)"}
          </Label>
          <SearchableSelect
            id="headMemberId"
            options={headSelectOptions}
            value={headMemberId}
            onChange={setHeadMemberId}
            placeholder="— Chọn chủ hộ —"
            searchPlaceholder="Tìm theo mã hoặc tên..."
            emptyMessage="Không tìm thấy thành viên"
            required={Boolean(isEdit)}
          />
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
        <Button type="submit" disabled={loading} icon={loading ? undefined : SaveIcon}>
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Đổi chủ hộ"
              : "Tạo hộ gia đình"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
