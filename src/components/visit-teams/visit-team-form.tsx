"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createVisitTeam,
  updateVisitTeam,
  type LeaderMemberOption,
} from "@/actions/visit-team-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function VisitTeamForm({
  mode,
  leaderOptions,
  team,
}: {
  mode: "create" | "edit";
  leaderOptions: LeaderMemberOption[];
  team?: {
    id: string;
    code: string;
    area: string;
    leaderMemberId: string | null;
  };
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && team;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const leaderValue = form.get("leaderMemberId") as string;
    const leaderMemberId = leaderValue === "" ? null : leaderValue;
    const area = (form.get("area") as string).trim();

    const result = isEdit
      ? await updateVisitTeam(team.id, { area, leaderMemberId })
      : await createVisitTeam({
          code: (form.get("code") as string).trim(),
          area,
          leaderMemberId,
        });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/visit-teams");
    router.refresh();
  }

  const cancelHref = "/visit-teams";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {isEdit ? (
          <div className="space-y-2">
            <Label>Mã tổ</Label>
            <p className="text-lg font-semibold text-[#1e3a5f]">{team.code}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="code">Mã tổ thăm viếng *</Label>
            <Input
              id="code"
              name="code"
              required
              maxLength={20}
              placeholder="vd: 3A, 3B"
            />
            <p className="text-xs text-gray-500">
              Nhập mã tổ do người dùng định nghĩa (không trùng).
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="area">Khu vực phụ trách *</Label>
          <Input
            id="area"
            name="area"
            required
            maxLength={200}
            defaultValue={team?.area ?? ""}
            placeholder="vd: Khu vực 1, Phường X..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leaderMemberId">Trưởng tổ (tùy chọn)</Label>
          <select
            id="leaderMemberId"
            name="leaderMemberId"
            className={selectClass}
            defaultValue={team?.leaderMemberId ?? ""}
          >
            <option value="">— Chưa chọn —</option>
            {leaderOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.code} — {member.fullName}
              </option>
            ))}
          </select>
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
              ? "Lưu thay đổi"
              : "Tạo tổ thăm viếng"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
