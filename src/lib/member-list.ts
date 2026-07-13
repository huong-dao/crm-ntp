import type { MemberStatus } from "@prisma/client";

export type MemberFiltersInput = {
  search?: string;
  status?: MemberStatus;
  visitTeamId?: string;
  ageDepartment?: string;
  actualDepartment?: string;
  birthYearFrom?: number;
  birthYearTo?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "fullName" | "code" | "status";
  sortOrder?: "asc" | "desc";
};

export function formatActualDepartmentName(name: string | null | undefined): string {
  return name?.trim() || "Chưa tham gia";
}

export function formatWardDistrict(
  ward: string | null | undefined,
  district: string | null | undefined
): string {
  const parts = [ward?.trim(), district?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : "—";
}

export function membersFilterUrl(
  filters: Partial<
    Pick<MemberFiltersInput, "ageDepartment" | "actualDepartment" | "visitTeamId">
  >
): string {
  const params = new URLSearchParams();
  if (filters.ageDepartment) {
    params.set("ageDepartment", filters.ageDepartment);
  }
  if (filters.actualDepartment) {
    params.set("actualDepartment", filters.actualDepartment);
  }
  if (filters.visitTeamId) {
    params.set("visitTeamId", filters.visitTeamId);
  }
  const query = params.toString();
  return query ? `/members?${query}` : "/members";
}

export function householdsFilterUrl(visitTeamId?: string): string {
  if (!visitTeamId) return "/households";
  return `/households?visitTeamId=${encodeURIComponent(visitTeamId)}`;
}

export const MEMBER_STATUSES: MemberStatus[] = [
  "active",
  "inactive",
  "transferred",
  "deceased",
];

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  transferred: "Chuyển đi",
  deceased: "Đã mất",
};

export function statusBadgeClass(status: MemberStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "transferred":
      return "bg-amber-100 text-amber-800";
    case "deceased":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export const GENDER_LABELS = {
  male: "Nam",
  female: "Nữ",
} as const;

export const DEFAULT_PAGE_SIZE = 20;
