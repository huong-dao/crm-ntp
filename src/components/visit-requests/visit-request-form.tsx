"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createVisitRequest,
  getDefaultVisitTeamForHousehold,
  type VisitRequestFormOptions,
} from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

const multiSelectClass =
  "flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function VisitRequestForm({
  options,
  defaultHouseholdId,
}: {
  options: VisitRequestFormOptions;
  defaultHouseholdId?: string;
}) {
  const router = useRouter();
  const householdValid =
    defaultHouseholdId &&
    options.households.some((household) => household.id === defaultHouseholdId);

  const initialHouseholdId = householdValid ? defaultHouseholdId : "";
  const [householdId, setHouseholdId] = useState(initialHouseholdId);
  const [visitTeamId, setVisitTeamId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    if (!initialHouseholdId) return;

    let cancelled = false;
    setTeamLoading(true);
    getDefaultVisitTeamForHousehold(initialHouseholdId).then((teamId) => {
      if (!cancelled && teamId) {
        setVisitTeamId(teamId);
      }
      if (!cancelled) {
        setTeamLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialHouseholdId]);

  async function handleHouseholdChange(value: string) {
    setHouseholdId(value);

    if (!value) {
      setVisitTeamId("");
      return;
    }

    setTeamLoading(true);
    const teamId = await getDefaultVisitTeamForHousehold(value);
    setTeamLoading(false);

    if (teamId) {
      setVisitTeamId(teamId);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const staffMemberIds = form.getAll("staffMemberIds") as string[];
    const staffCodesRaw = (form.get("staffCodes") as string).trim();

    const result = await createVisitRequest({
      householdId: form.get("householdId") as string,
      visitTeamId: form.get("visitTeamId") as string,
      scheduledDate: form.get("scheduledDate") as string,
      content: (form.get("content") as string) || null,
      staffMemberIds:
        staffMemberIds.length > 0 ? staffMemberIds : undefined,
      staffCodes: staffCodesRaw.length > 0 ? staffCodesRaw : null,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/visit-requests");
    router.refresh();
  }

  const cancelHref = householdValid
    ? `/households/${defaultHouseholdId}`
    : "/visit-requests";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <p className="text-sm text-gray-600">
          Mã đơn sẽ được tự động sinh khi lưu (8 ký tự in hoa, vd: AB123DG3).
        </p>

        <div className="space-y-2">
          <Label htmlFor="householdId">Hộ gia đình *</Label>
          <select
            id="householdId"
            name="householdId"
            required
            className={selectClass}
            value={householdId}
            onChange={(e) => handleHouseholdChange(e.target.value)}
          >
            <option value="">— Chọn hộ —</option>
            {options.households.map((household) => (
              <option key={household.id} value={household.id}>
                {household.code}
                {household.headName ? ` — ${household.headName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Lịch thăm viếng *</Label>
          <Input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitTeamId">Tổ thăm viếng *</Label>
          <select
            id="visitTeamId"
            name="visitTeamId"
            required
            className={selectClass}
            value={visitTeamId}
            onChange={(e) => setVisitTeamId(e.target.value)}
            disabled={teamLoading}
          >
            <option value="">
              {teamLoading ? "Đang tải gợi ý tổ..." : "— Chọn tổ —"}
            </option>
            {options.visitTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.code} — {team.area}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Tự động gợi ý tổ theo thành viên trong hộ (nếu có).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staffMemberIds">Nhân sự thăm viếng</Label>
          <select
            id="staffMemberIds"
            name="staffMemberIds"
            multiple
            className={multiSelectClass}
          >
            {options.staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.code} — {member.fullName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Giữ Ctrl để chọn nhiều. Hoặc nhập mã thủ công bên dưới.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staffCodes">Mã nhân sự (tùy chọn)</Label>
          <Input
            id="staffCodes"
            name="staffCodes"
            placeholder="vd: 00001, 00002"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Nội dung / ghi chú</Label>
          <textarea
            id="content"
            name="content"
            rows={4}
            maxLength={2000}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
            placeholder="Ghi chú nội dung thăm viếng..."
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading || teamLoading}>
          {loading ? "Đang lưu..." : "Tạo đơn thăm viếng"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
