"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignMembersToVisitTeam,
  type LeaderMemberOption,
} from "@/actions/visit-team-actions";
import { Button } from "@/components/ui/button";
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select";
import { SaveIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";

export function AssignMembersForm({
  teamId,
  memberOptions,
}: {
  teamId: string;
  memberOptions: LeaderMemberOption[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const options = useMemo(
    () =>
      memberOptions.map((member) => ({
        value: member.id,
        label: `${member.code} — ${member.fullName}`,
        searchText: `${member.code} ${member.fullName}`,
      })),
    [memberOptions]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (selectedIds.length === 0) {
      setError("Chọn ít nhất một thành viên");
      return;
    }

    setLoading(true);

    const result = await assignMembersToVisitTeam(teamId, selectedIds);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSelectedIds([]);
    router.refresh();
  }

  if (memberOptions.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Tất cả nhân sự đã được gán vào tổ này hoặc không còn tín hữu khả dụng.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberIds">Chọn nhân sự</Label>
        <MultiSearchableSelect
          id="memberIds"
          name="memberIds"
          options={options}
          values={selectedIds}
          onChange={setSelectedIds}
          placeholder="Chọn nhân sự..."
          searchPlaceholder="Tìm theo tên hoặc mã..."
        />
        <p className="text-xs text-gray-500">
          Thành viên đang ở tổ khác sẽ được chuyển sang tổ này.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={loading} icon={loading ? undefined : SaveIcon}>
        {loading ? "Đang gán..." : "Gán nhân sự vào tổ"}
      </Button>
    </form>
  );
}
