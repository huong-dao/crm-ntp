"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createVisitRequest,
  getDefaultVisitTeamForHousehold,
  getVisitTeamStaffMembers,
  updateVisitRequest,
  type VisitRequestDetail,
  type VisitRequestFormContext,
  type VisitRequestStaffOption,
} from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { matchStaffMemberIds } from "@/lib/visit-request-list";
import {
  VISIT_REQUEST_STATUSES,
  VISIT_REQUEST_STATUS_LABELS,
} from "@/lib/visit-request-list";
import { formatDateForInput } from "@/lib/validations/visit-request";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

type VisitRequestFormProps = {
  mode: "create" | "edit";
  context: VisitRequestFormContext;
  request?: VisitRequestDetail;
  defaultHouseholdId?: string;
};

export function VisitRequestForm({
  mode,
  context,
  request,
  defaultHouseholdId,
}: VisitRequestFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && request;

  const householdValid =
    defaultHouseholdId &&
    context.households.some((household) => household.id === defaultHouseholdId);

  const initialHouseholdId = isEdit
    ? request.householdId
    : householdValid
      ? defaultHouseholdId
      : "";

  const initialTeamId = isEdit
    ? request.visitTeamId
    : context.lockedVisitTeamId ?? "";

  const [householdId, setHouseholdId] = useState(initialHouseholdId);
  const [visitTeamId, setVisitTeamId] = useState(initialTeamId);
  const [representativeMemberId, setRepresentativeMemberId] = useState(
    isEdit ? request.representativeMemberId ?? "" : ""
  );
  const [additionalStaffIds, setAdditionalStaffIds] = useState<string[]>([]);
  const [teamStaff, setTeamStaff] = useState<VisitRequestStaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  const teamLocked = !context.isAdmin && Boolean(context.lockedVisitTeamId);

  useEffect(() => {
    if (!visitTeamId) {
      setTeamStaff([]);
      setRepresentativeMemberId("");
      setAdditionalStaffIds([]);
      return;
    }

    let cancelled = false;
    setStaffLoading(true);

    getVisitTeamStaffMembers(visitTeamId)
      .then((members) => {
        if (cancelled) return;
        setTeamStaff(members);

        if (isEdit && request) {
          const additional = matchStaffMemberIds(request.staffCodes, members);
          setAdditionalStaffIds(additional);
          if (request.representativeMemberId) {
            setRepresentativeMemberId(request.representativeMemberId);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setTeamStaff([]);
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visitTeamId, isEdit, request]);

  useEffect(() => {
    if (isEdit || !initialHouseholdId || teamLocked) return;

    let cancelled = false;
    setTeamLoading(true);
    getDefaultVisitTeamForHousehold(initialHouseholdId).then((teamId) => {
      if (!cancelled && teamId) setVisitTeamId(teamId);
      if (!cancelled) setTeamLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [initialHouseholdId, isEdit, teamLocked]);

  async function handleHouseholdChange(value: string) {
    setHouseholdId(value);

    if (teamLocked || isEdit) return;

    if (!value) {
      if (!context.lockedVisitTeamId) setVisitTeamId("");
      return;
    }

    setTeamLoading(true);
    const teamId = await getDefaultVisitTeamForHousehold(value);
    setTeamLoading(false);

    if (teamId && !context.lockedVisitTeamId) {
      setVisitTeamId(teamId);
    }
  }

  function handleTeamChange(value: string) {
    setVisitTeamId(value);
    setRepresentativeMemberId("");
    setAdditionalStaffIds([]);
  }

  const householdOptions = useMemo(
    () =>
      context.households.map((household) => ({
        value: household.id,
        label: `${household.code}${household.headName ? ` — ${household.headName}` : ""}`,
        searchText: `${household.code} ${household.headName ?? ""}`,
      })),
    [context.households]
  );

  const teamOptions = useMemo(
    () =>
      context.visitTeams.map((team) => ({
        value: team.id,
        label: `${team.code} — ${team.area}`,
        searchText: `${team.code} ${team.area}`,
      })),
    [context.visitTeams]
  );

  const staffOptions = useMemo(
    () =>
      teamStaff.map((member) => ({
        value: member.id,
        label: `${member.code} — ${member.fullName}`,
        searchText: `${member.code} ${member.fullName}`,
      })),
    [teamStaff]
  );

  const additionalOptions = useMemo(
    () =>
      staffOptions.filter(
        (option) => option.value !== representativeMemberId
      ),
    [staffOptions, representativeMemberId]
  );

  function handleRepresentativeChange(value: string) {
    setRepresentativeMemberId(value);
    setAdditionalStaffIds((prev) => prev.filter((id) => id !== value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      householdId,
      visitTeamId,
      scheduledDate: form.get("scheduledDate") as string,
      actualDate: (form.get("actualDate") as string) || null,
      representativeMemberId: representativeMemberId || null,
      additionalStaffMemberIds: additionalStaffIds,
      content: (form.get("content") as string) || null,
    };

    const result = isEdit
      ? await updateVisitRequest(request.id, {
          ...payload,
          status: form.get("status") as "scheduled" | "completed" | "cancelled",
        })
      : await createVisitRequest(payload);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(isEdit ? `/visit-requests/${request.id}` : "/visit-requests");
    router.refresh();
  }

  const cancelHref = isEdit
    ? `/visit-requests/${request.id}`
    : householdValid
      ? `/households/${defaultHouseholdId}`
      : "/visit-requests";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {mode === "create" && (
          <p className="text-sm text-gray-600">
            Mã đơn tự sinh khi lưu. Tình trạng mặc định:{" "}
            <strong>Lên lịch</strong>.
          </p>
        )}

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Tình trạng</Label>
            <select
              id="status"
              name="status"
              className={selectClass}
              defaultValue={request.status}
            >
              {VISIT_REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {VISIT_REQUEST_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="householdId">Hộ gia đình cần thăm viếng *</Label>
          <SearchableSelect
            id="householdId"
            name="householdId"
            required
            options={householdOptions}
            value={householdId}
            onChange={handleHouseholdChange}
            placeholder="— Chọn hộ —"
            searchPlaceholder="Tìm theo mã hộ hoặc chủ hộ..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Lịch thăm viếng *</Label>
          <Input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            required
            defaultValue={
              isEdit ? formatDateForInput(request.scheduledDate) : undefined
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actualDate">Ngày thăm viếng thực tế</Label>
          <Input
            id="actualDate"
            name="actualDate"
            type="date"
            defaultValue={
              isEdit ? formatDateForInput(request.actualDate) : undefined
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitTeamId">Tổ thăm viếng *</Label>
          <SearchableSelect
            id="visitTeamId"
            name="visitTeamId"
            required
            options={teamOptions}
            value={visitTeamId}
            onChange={handleTeamChange}
            disabled={teamLocked || teamLoading || teamOptions.length === 0}
            placeholder={
              teamLoading
                ? "Đang tải..."
                : teamOptions.length === 0
                  ? "Không có tổ được phép chọn"
                  : "— Chọn tổ —"
            }
            searchPlaceholder="Tìm theo mã tổ..."
          />
          {teamLocked && (
            <p className="text-xs text-gray-500">
              Tài khoản của bạn chỉ được thao tác tổ thăm viếng đã gán.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="representativeMemberId">Nhân sự thăm viếng</Label>
          <SearchableSelect
            id="representativeMemberId"
            options={staffOptions}
            value={representativeMemberId}
            onChange={handleRepresentativeChange}
            disabled={!visitTeamId || staffLoading}
            placeholder={
              staffLoading
                ? "Đang tải nhân sự..."
                : !visitTeamId
                  ? "Chọn tổ trước"
                  : "— Chọn 1 nhân sự đại diện —"
            }
            searchPlaceholder="Tìm theo tên hoặc mã..."
            emptyMessage="Tổ chưa có thành viên"
          />
          <p className="text-xs text-gray-500">
            Chọn một nhân sự đại diện thuộc tổ đã chọn.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalStaff">Mã nhân sự (tùy chọn)</Label>
          <MultiSearchableSelect
            id="additionalStaff"
            name="additionalStaffMemberIds"
            options={additionalOptions}
            values={additionalStaffIds}
            onChange={setAdditionalStaffIds}
            disabled={!visitTeamId || staffLoading}
            placeholder="Thêm nhân sự khác trong tổ..."
            searchPlaceholder="Tìm theo tên hoặc mã..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Nội dung / ghi chú</Label>
          <textarea
            id="content"
            name="content"
            rows={4}
            maxLength={2000}
            defaultValue={isEdit ? request.content ?? "" : ""}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
            placeholder="Ghi chú nội dung thăm viếng..."
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={loading || teamLoading || staffLoading}
          icon={loading ? undefined : SaveIcon}
        >
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo đơn thăm viếng"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
