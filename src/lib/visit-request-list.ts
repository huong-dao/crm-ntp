import type { VisitRequestStatus } from "@prisma/client";

export type VisitRequestFiltersInput = {
  search?: string;
  status?: VisitRequestStatus[];
  visitTeamId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type VisitRequestFilterValues = Pick<
  VisitRequestFiltersInput,
  "search" | "visitTeamId" | "dateFrom" | "dateTo"
> & {
  status?: VisitRequestStatus[];
};

export const VISIT_REQUEST_STATUSES: VisitRequestStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
];

export const VISIT_REQUEST_STATUS_LABELS: Record<VisitRequestStatus, string> = {
  scheduled: "Lên lịch",
  completed: "Hoàn thành",
  cancelled: "Hủy lịch",
};

export function hasVisitRequestFilters(values: VisitRequestFilterValues): boolean {
  return Boolean(
    values.search ||
      values.visitTeamId ||
      values.dateFrom ||
      values.dateTo ||
      (values.status && values.status.length > 0)
  );
}

export function buildVisitRequestListUrl(
  values: VisitRequestFilterValues,
  page?: number
): string {
  const params = new URLSearchParams();

  if (values.search) params.set("search", values.search);
  if (values.visitTeamId) params.set("visitTeamId", values.visitTeamId);
  if (values.dateFrom) params.set("dateFrom", values.dateFrom);
  if (values.dateTo) params.set("dateTo", values.dateTo);

  if (values.status) {
    for (const status of values.status) {
      params.append("status", status);
    }
  }

  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/visit-requests?${query}` : "/visit-requests";
}

export function visitRequestStatusBadgeClass(status: VisitRequestStatus) {
  switch (status) {
    case "scheduled":
      return "bg-amber-100 text-amber-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function formatVisitRequestDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function matchStaffMemberIds(
  staffCodes: string | null,
  members: { id: string; code: string }[]
): string[] {
  if (!staffCodes) return [];

  const codes = staffCodes
    .split(/[,;]/)
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code.length > 0);

  const codeToId = new Map(
    members.map((member) => [member.code.toLowerCase(), member.id])
  );

  return codes
    .map((code) => codeToId.get(code))
    .filter((id): id is string => id !== undefined);
}
