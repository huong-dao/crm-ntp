"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  assignMembersToVisitTeam,
  type LeaderMemberOption,
} from "@/actions/visit-team-actions";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function AssignMembersForm({
  teamId,
  memberOptions,
}: {
  teamId: string;
  memberOptions: LeaderMemberOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const selected = form.getAll("memberIds") as string[];

    const result = await assignMembersToVisitTeam(teamId, selected);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  }

  if (memberOptions.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Tất cả thành viên đã được gán vào tổ này hoặc không còn thành viên khả dụng.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberIds">
          Chọn thành viên (giữ Ctrl để chọn nhiều)
        </Label>
        <select
          id="memberIds"
          name="memberIds"
          multiple
          required
          className={selectClass}
        >
          {memberOptions.map((member) => (
            <option key={member.id} value={member.id}>
              {member.code} — {member.fullName}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Thành viên đang ở tổ khác sẽ được chuyển sang tổ này.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={loading} icon={loading ? undefined : SaveIcon}>
        {loading ? "Đang gán..." : "Gán thành viên vào tổ"}
      </Button>
    </form>
  );
}
