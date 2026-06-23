import type { MemberStatus } from "@prisma/client";

export type MemberFiltersInput = {
  search?: string;
  status?: MemberStatus;
  visitTeamId?: string;
  department?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "fullName" | "code" | "status";
  sortOrder?: "asc" | "desc";
};

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

export const DEFAULT_PAGE_SIZE = 20;
