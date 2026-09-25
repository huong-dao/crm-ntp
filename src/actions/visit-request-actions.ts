"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, VisitRequestStatus, VisitRequestType } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { generateVisitRequestCode } from "@/lib/generate-code";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { buildExcelBase64 } from "@/lib/member-excel";
import { prisma } from "@/lib/prisma";
import {
  assertVisitTeamWriteAccess,
  buildHouseholdTeamScopeWhere,
  buildVisitRequestTeamScopeWhere,
  canCreateVisitRequest,
  getAuthUserRecord,
  isAdmin,
  requireAuthUser,
} from "@/lib/user-scope";
import {
  getVisitRequestHistories,
  logVisitRequestHistory,
} from "@/lib/visit-request-history";
import { logActivity } from "@/lib/activity-log";
import type { VisitRequestFiltersInput } from "@/lib/visit-request-list";
import {
  VISIT_REQUEST_EXPORT_HEADERS,
  visitRequestToExportRow,
} from "@/lib/visit-request-export";
import {
  formatDateForInput,
  parseScheduledDateInput,
  visitRequestFormSchema,
  visitRequestStatusSchema,
  visitRequestUpdateSchema,
  type VisitRequestFormInput,
  type VisitRequestStatusInput,
  type VisitRequestUpdateInput,
} from "@/lib/validations/visit-request";

export type VisitRequestListItem = {
  id: string;
  code: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  visitType: VisitRequestType;
  householdCode: string;
  householdId: string;
  householdHeadName: string | null;
  visitTeamCode: string;
  visitTeamId: string;
  staffCodes: string | null;
  staffNames: string[];
  representativeMemberName: string | null;
};

export type VisitRequestsResult = {
  requests: VisitRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type VisitRequestHouseholdOption = {
  id: string;
  code: string;
  headName: string | null;
};

export type VisitRequestTeamOption = {
  id: string;
  code: string;
  area: string;
};

export type VisitRequestStaffOption = {
  id: string;
  code: string;
  fullName: string;
};

export type VisitRequestFormContext = {
  isAdmin: boolean;
  lockedVisitTeamId: string | null;
  canCreate: boolean;
  households: VisitRequestHouseholdOption[];
  visitTeams: VisitRequestTeamOption[];
};

export type VisitRequestDetail = {
  id: string;
  code: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  visitType: VisitRequestType;
  content: string | null;
  statusNote: string | null;
  staffCodes: string | null;
  representativeMemberId: string | null;
  representativeMemberCode: string | null;
  representativeMemberName: string | null;
  householdId: string;
  householdCode: string;
  householdHeadName: string | null;
  visitTeamId: string;
  visitTeamCode: string;
  visitTeamArea: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VisitRequestHouseholdMember = {
  id: string;
  code: string;
  fullName: string;
  relationship: string | null;
  birthYear: number | null;
  status: string;
  notes: string | null;
};

export type VisitRequestHistoryItem = {
  id: string;
  action: string;
  note: string | null;
  createdAt: Date;
  username: string | null;
};

export type VisitRequestPrintMember = {
  code: string;
  fullName: string;
  relationship: string | null;
  birthYear: number | null;
  gender: string | null;
  status: string;
  notes: string | null;
  ageDepartmentName: string | null;
  actualDepartmentName: string | null;
};

export type VisitRequestPrintData = VisitRequestDetail & {
  staffNames: string[];
  members: VisitRequestPrintMember[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function assertTeamAccess(visitTeamId: string) {
  return assertVisitTeamWriteAccess(visitTeamId);
}

async function resolveStaffNames(
  representativeName: string | null,
  staffCodes: string | null
): Promise<string[]> {
  const additionalCodes = staffCodes
    ? staffCodes.split(/[,;]/).map((code) => code.trim()).filter(Boolean)
    : [];

  let additionalStaffNames: string[] = [];
  if (additionalCodes.length > 0) {
    const members = await prisma.member.findMany({
      where: { code: { in: additionalCodes } },
      select: { code: true, fullName: true },
    });
    const nameByCode = new Map(
      members.map((member) => [member.code.toLowerCase(), member.fullName])
    );
    additionalStaffNames = additionalCodes.map(
      (code) => nameByCode.get(code.toLowerCase()) ?? code
    );
  }

  return [representativeName, ...additionalStaffNames].filter(
    (name): name is string => Boolean(name)
  );
}

async function validateTeamMembers(
  visitTeamId: string,
  representativeMemberId: string | null | undefined,
  additionalStaffMemberIds: string[] | undefined
) {
  const additionalIds = additionalStaffMemberIds ?? [];
  const allIds = [
    ...(representativeMemberId ? [representativeMemberId] : []),
    ...additionalIds,
  ];

  if (allIds.length === 0) {
    return {
      representativeMemberId: representativeMemberId ?? null,
      staffCodes: null as string | null,
    };
  }

  const uniqueIds = [...new Set(allIds)];
  const [members, visitTeam] = await Promise.all([
    prisma.member.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, code: true, visitStaffTeamId: true },
    }),
    prisma.visitTeam.findUnique({
      where: { id: visitTeamId },
      select: { leaderMemberId: true },
    }),
  ]);

  if (members.length !== uniqueIds.length) {
    throw new Error("Một hoặc nhiều nhân sự không tồn tại");
  }

  const leaderMemberId = visitTeam?.leaderMemberId ?? null;

  if (representativeMemberId) {
    if (!leaderMemberId || representativeMemberId !== leaderMemberId) {
      throw new Error("Nhân sự đại diện phải là trưởng tổ");
    }
  }

  for (const member of members) {
    if (member.id === leaderMemberId) {
      continue;
    }

    if (member.visitStaffTeamId !== visitTeamId) {
      throw new Error(
        `Nhân sự ${member.code} không thuộc nhân sự tổ thăm viếng đã chọn`
      );
    }
  }

  const additionalCodes = additionalIds
    .map((id) => members.find((member) => member.id === id)?.code)
    .filter((code): code is string => Boolean(code));

  return {
    representativeMemberId: representativeMemberId ?? null,
    staffCodes:
      additionalCodes.length > 0 ? additionalCodes.join(", ") : null,
  };
}

export async function getVisitRequestFilterOptions(): Promise<{
  visitTeams: VisitRequestTeamOption[];
  isAdmin: boolean;
  lockedVisitTeamId: string | null;
}> {
  const user = await requireAuthUser();

  if (isAdmin(user)) {
    const visitTeams = await prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    });
    return { visitTeams, isAdmin: true, lockedVisitTeamId: null };
  }

  const teamId = user.visitStaffTeamId;
  if (!teamId) {
    return { visitTeams: [], isAdmin: false, lockedVisitTeamId: null };
  }

  const visitTeams = await prisma.visitTeam.findMany({
    where: { id: teamId },
    select: { id: true, code: true, area: true },
  });

  return { visitTeams, isAdmin: false, lockedVisitTeamId: teamId };
}

export async function getVisitRequests(
  filters: VisitRequestFiltersInput = {}
): Promise<VisitRequestsResult> {
  const user = await requireAuthUser();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = filters.search?.trim();
  const statuses = filters.status?.filter(Boolean);
  const visitTeamId = filters.visitTeamId?.trim();
  const dateFrom = filters.dateFrom?.trim();
  const dateTo = filters.dateTo?.trim();

  const where: Prisma.VisitRequestWhereInput = {};
  const teamScope = buildVisitRequestTeamScopeWhere(user);
  if (teamScope) {
    where.visitTeamId = teamScope.visitTeamId;
  }

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { staffCodes: { contains: search } },
      { household: { code: { contains: search } } },
      { visitTeam: { code: { contains: search } } },
      {
        household: {
          members: {
            some: { isHead: true, fullName: { contains: search } },
          },
        },
      },
    ];
  }

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (visitTeamId) {
    where.visitTeamId = visitTeamId;
  }

  if (dateFrom || dateTo) {
    const scheduledDate: Prisma.DateTimeFilter = {};

    if (dateFrom) {
      scheduledDate.gte = parseScheduledDateInput(dateFrom);
    }

    if (dateTo) {
      const end = parseScheduledDateInput(dateTo);
      end.setHours(23, 59, 59, 999);
      scheduledDate.lte = end;
    }

    where.scheduledDate = scheduledDate;
  }

  const [rows, total] = await prisma.$transaction([
    prisma.visitRequest.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ scheduledDate: "desc" }, { code: "desc" }],
      select: {
        id: true,
        code: true,
        scheduledDate: true,
        actualDate: true,
        status: true,
        visitType: true,
        staffCodes: true,
        householdId: true,
        visitTeamId: true,
        household: {
          select: {
            code: true,
            members: {
              where: { isHead: true },
              select: { fullName: true },
              take: 1,
            },
          },
        },
        visitTeam: { select: { code: true } },
        representativeMember: { select: { fullName: true } },
      },
    }),
    prisma.visitRequest.count({ where }),
  ]);

  const requests: VisitRequestListItem[] = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      code: row.code,
      scheduledDate: row.scheduledDate,
      actualDate: row.actualDate,
      status: row.status,
      visitType: row.visitType,
      householdCode: row.household.code,
      householdId: row.householdId,
      householdHeadName: row.household.members[0]?.fullName ?? null,
      visitTeamCode: row.visitTeam.code,
      visitTeamId: row.visitTeamId,
      staffCodes: row.staffCodes,
      staffNames: await resolveStaffNames(
        row.representativeMember?.fullName ?? null,
        row.staffCodes
      ),
      representativeMemberName: row.representativeMember?.fullName ?? null,
    }))
  );

  return {
    requests,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVisitRequestFormContext(): Promise<VisitRequestFormContext> {
  const user = await getAuthUserRecord();
  if (!user) throw new Error("Unauthorized");

  const householdWhere: Prisma.HouseholdWhereInput = {};
  const teamScope = buildHouseholdTeamScopeWhere(user);
  if (teamScope) {
    Object.assign(householdWhere, teamScope);
  }

  const households = await prisma.household.findMany({
    where: householdWhere,
    select: {
      id: true,
      code: true,
      members: {
        where: { isHead: true },
        select: { fullName: true },
        take: 1,
      },
    },
    orderBy: { code: "asc" },
    take: 1000,
  });

  const admin = isAdmin(user);
  const lockedVisitTeamId = !admin ? user.visitStaffTeamId : null;

  let visitTeams: VisitRequestTeamOption[] = [];

  if (admin) {
    visitTeams = await prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    });
  } else if (lockedVisitTeamId) {
    visitTeams = await prisma.visitTeam.findMany({
      where: { id: lockedVisitTeamId },
      select: { id: true, code: true, area: true },
    });
  }

  return {
    isAdmin: admin,
    lockedVisitTeamId,
    canCreate: canCreateVisitRequest(user),
    households: households.map((household) => ({
      id: household.id,
      code: household.code,
      headName: household.members[0]?.fullName ?? null,
    })),
    visitTeams,
  };
}

export type VisitTeamStaffResult = {
  leader: VisitRequestStaffOption | null;
  staffMembers: VisitRequestStaffOption[];
};

export async function getVisitTeamStaffMembers(
  visitTeamId: string
): Promise<VisitTeamStaffResult> {
  await assertTeamAccess(visitTeamId);

  const team = await prisma.visitTeam.findUnique({
    where: { id: visitTeamId },
    select: { leaderMemberId: true },
  });

  const staffRows = await prisma.member.findMany({
    where: { visitStaffTeamId: visitTeamId },
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const leaderMemberId = team?.leaderMemberId ?? null;
  let leader: VisitRequestStaffOption | null = null;

  if (leaderMemberId) {
    leader =
      staffRows.find((member) => member.id === leaderMemberId) ??
      (await prisma.member.findUnique({
        where: { id: leaderMemberId },
        select: { id: true, code: true, fullName: true },
      })) ??
      null;
  }

  const staffMembers = leaderMemberId
    ? staffRows.filter((member) => member.id !== leaderMemberId)
    : staffRows;

  return { leader, staffMembers };
}

export async function getDefaultVisitTeamForHousehold(
  householdId: string
): Promise<string | null> {
  await requireAuth();

  const member = await prisma.member.findFirst({
    where: { householdId, visitTeamId: { not: null } },
    select: { visitTeamId: true },
    orderBy: { isHead: "desc" },
  });

  return member?.visitTeamId ?? null;
}

export async function createVisitRequest(
  input: VisitRequestFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const parsed = visitRequestFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const {
      householdId,
      visitTeamId,
      visitType,
      scheduledDate,
      actualDate,
      content,
      representativeMemberId,
      additionalStaffMemberIds,
    } = parsed.data;

    const user = await assertTeamAccess(visitTeamId);

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { id: true },
    });
    if (!household) {
      return { success: false, error: "Hộ gia đình không tồn tại" };
    }

    const visitTeam = await prisma.visitTeam.findUnique({
      where: { id: visitTeamId },
      select: { id: true },
    });
    if (!visitTeam) {
      return { success: false, error: "Tổ thăm viếng không tồn tại" };
    }

    let staffData: {
      representativeMemberId: string | null;
      staffCodes: string | null;
    };
    try {
      staffData = await validateTeamMembers(
        visitTeamId,
        representativeMemberId,
        additionalStaffMemberIds
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nhân sự không hợp lệ";
      return { success: false, error: message };
    }

    const code = await generateVisitRequestCode();
    const scheduled = parseScheduledDateInput(scheduledDate);
    const actual = actualDate?.trim()
      ? parseScheduledDateInput(actualDate.trim())
      : null;
    const trimmedContent = content?.trim();

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.visitRequest.create({
        data: {
          code,
          householdId,
          visitTeamId,
          visitType,
          scheduledDate: scheduled,
          actualDate: actual,
          status: "scheduled",
          representativeMemberId: staffData.representativeMemberId,
          staffCodes: staffData.staffCodes,
          createdById: user.id,
          content:
            trimmedContent && trimmedContent.length > 0 ? trimmedContent : null,
        },
        select: { id: true, code: true },
      });

      await logVisitRequestHistory(tx, {
        visitRequestId: created.id,
        userId: user.id,
        action: "created",
        note: trimmedContent || null,
      });

      await logActivity(
        {
          userId: user.id,
          entityType: "visit_request",
          entityId: created.id,
          action: "created",
          note: `Tạo đơn ${created.code}`,
        },
        tx
      );

      return created;
    });

    revalidatePath("/visit-requests");
    revalidatePath("/dashboard");

    return { success: true, data: request };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể tạo đơn thăm viếng";
    return { success: false, error: message };
  }
}

async function loadVisitRequestDetail(
  request: {
    id: string;
    code: string;
    scheduledDate: Date;
    actualDate: Date | null;
    status: VisitRequestStatus;
    visitType: VisitRequestType;
    content: string | null;
    statusNote: string | null;
    staffCodes: string | null;
    representativeMemberId: string | null;
    householdId: string;
    visitTeamId: string;
    createdAt: Date;
    updatedAt: Date;
    household: { code: string; members: { fullName: string }[] };
    visitTeam: { code: string; area: string };
    representativeMember: { code: string; fullName: string } | null;
  }
): Promise<VisitRequestDetail> {
  return {
    id: request.id,
    code: request.code,
    scheduledDate: request.scheduledDate,
    actualDate: request.actualDate,
    status: request.status,
    visitType: request.visitType,
    content: request.content,
    statusNote: request.statusNote,
    staffCodes: request.staffCodes,
    representativeMemberId: request.representativeMemberId,
    representativeMemberCode: request.representativeMember?.code ?? null,
    representativeMemberName: request.representativeMember?.fullName ?? null,
    householdId: request.householdId,
    householdCode: request.household.code,
    householdHeadName: request.household.members[0]?.fullName ?? null,
    visitTeamId: request.visitTeamId,
    visitTeamCode: request.visitTeam.code,
    visitTeamArea: request.visitTeam.area,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

const visitRequestSelect = {
  id: true,
  code: true,
  scheduledDate: true,
  actualDate: true,
  status: true,
  visitType: true,
  content: true,
  statusNote: true,
  staffCodes: true,
  representativeMemberId: true,
  householdId: true,
  visitTeamId: true,
  createdAt: true,
  updatedAt: true,
  household: {
    select: {
      code: true,
      members: {
        where: { isHead: true },
        select: { fullName: true },
        take: 1,
      },
    },
  },
  visitTeam: { select: { code: true, area: true } },
  representativeMember: { select: { code: true, fullName: true } },
} as const;

export async function getVisitRequestById(
  id: string
): Promise<VisitRequestDetail | null> {
  const user = await requireAuthUser();

  const request = await prisma.visitRequest.findUnique({
    where: { id },
    select: visitRequestSelect,
  });

  if (!request) return null;

  const teamScope = buildVisitRequestTeamScopeWhere(user);
  if (teamScope && request.visitTeamId !== teamScope.visitTeamId) {
    return null;
  }

  return loadVisitRequestDetail(request);
}

export async function getVisitRequestHouseholdMembers(
  householdId: string
): Promise<VisitRequestHouseholdMember[]> {
  await requireAuth();

  const members = await prisma.member.findMany({
    where: { householdId },
    orderBy: [{ isHead: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      code: true,
      fullName: true,
      relationship: true,
      birthYear: true,
      status: true,
      notes: true,
    },
  });

  return members;
}

export async function getVisitRequestHistoryItems(
  visitRequestId: string
): Promise<VisitRequestHistoryItem[]> {
  await requireAuth();

  const rows = await getVisitRequestHistories(visitRequestId);
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    note: row.note,
    createdAt: row.createdAt,
    username: row.user?.username ?? null,
  }));
}

export async function getVisitRequestForPrint(
  id: string
): Promise<VisitRequestPrintData | null> {
  await requireAuth();

  const request = await prisma.visitRequest.findUnique({
    where: { id },
    select: visitRequestSelect,
  });

  if (!request) return null;

  const detail = await loadVisitRequestDetail(request);

  const additionalCodes = request.staffCodes
    ? request.staffCodes.split(/[,;]/).map((code) => code.trim()).filter(Boolean)
    : [];

  let additionalStaffNames: string[] = [];
  if (additionalCodes.length > 0) {
    const members = await prisma.member.findMany({
      where: { code: { in: additionalCodes } },
      select: { code: true, fullName: true },
    });
    const nameByCode = new Map(
      members.map((member) => [member.code.toLowerCase(), member.fullName])
    );
    additionalStaffNames = additionalCodes.map(
      (code) => nameByCode.get(code.toLowerCase()) ?? code
    );
  }

  const staffNames = [
    request.representativeMember?.fullName,
    ...additionalStaffNames,
  ].filter((name): name is string => Boolean(name));

  const householdMembers = await prisma.member.findMany({
    where: { householdId: detail.householdId },
    orderBy: [{ isHead: "desc" }, { fullName: "asc" }],
    select: {
      code: true,
      fullName: true,
      relationship: true,
      birthYear: true,
      gender: true,
      status: true,
      notes: true,
      ageDepartment: { select: { name: true } },
      actualDepartment: { select: { name: true } },
    },
  });

  const members: VisitRequestPrintMember[] = householdMembers.map((member) => ({
    code: member.code,
    fullName: member.fullName,
    relationship: member.relationship,
    birthYear: member.birthYear,
    gender: member.gender,
    status: member.status,
    notes: member.notes,
    ageDepartmentName: member.ageDepartment?.name ?? null,
    actualDepartmentName: member.actualDepartment?.name ?? null,
  }));

  return {
    ...detail,
    staffNames,
    members,
  };
}

export async function updateVisitRequest(
  id: string,
  input: VisitRequestUpdateInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const parsed = visitRequestUpdateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const existing = await prisma.visitRequest.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Đơn thăm viếng không tồn tại" };
    }

    const {
      householdId,
      visitTeamId,
      visitType,
      scheduledDate,
      actualDate,
      content,
      status,
      representativeMemberId,
      additionalStaffMemberIds,
    } = parsed.data;

    const user = await assertTeamAccess(visitTeamId);

    let staffData: {
      representativeMemberId: string | null;
      staffCodes: string | null;
    };
    try {
      staffData = await validateTeamMembers(
        visitTeamId,
        representativeMemberId,
        additionalStaffMemberIds
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nhân sự không hợp lệ";
      return { success: false, error: message };
    }

    const scheduled = parseScheduledDateInput(scheduledDate);
    let actual: Date | null = actualDate?.trim()
      ? parseScheduledDateInput(actualDate.trim())
      : null;

    if (status !== "completed") {
      actual = actualDate?.trim()
        ? parseScheduledDateInput(actualDate.trim())
        : null;
    }

    const trimmedContent = content?.trim();

    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.visitRequest.update({
        where: { id },
        data: {
          householdId,
          visitTeamId,
          visitType,
          scheduledDate: scheduled,
          actualDate: actual,
          status,
          representativeMemberId: staffData.representativeMemberId,
          staffCodes: staffData.staffCodes,
          content:
            trimmedContent && trimmedContent.length > 0 ? trimmedContent : null,
        },
        select: { id: true, code: true },
      });

      await logVisitRequestHistory(tx, {
        visitRequestId: id,
        userId: user.id,
        action: "updated",
        note: trimmedContent || null,
      });

      await logActivity(
        {
          userId: user.id,
          entityType: "visit_request",
          entityId: id,
          action: "updated",
          note: `Cập nhật đơn ${updated.code}`,
        },
        tx
      );

      return updated;
    });

    revalidatePath("/visit-requests");
    revalidatePath(`/visit-requests/${id}`);
    revalidatePath(`/visit-requests/${id}/edit`);
    revalidatePath("/dashboard");

    return { success: true, data: request };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể cập nhật đơn thăm viếng";
    return { success: false, error: message };
  }
}

export async function updateVisitStatus(
  id: string,
  input: VisitRequestStatusInput
): Promise<ActionResult<{ id: string; status: VisitRequestStatus }>> {
  try {
    const parsed = visitRequestStatusSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const existing = await prisma.visitRequest.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Đơn thăm viếng không tồn tại" };
    }

    const user = await assertTeamAccess(existing.visitTeamId);

    const { status, visitType, statusNote } = parsed.data;
    let actualDate: Date | null = existing.actualDate;

    if (status === "completed") {
      actualDate = parseScheduledDateInput(parsed.data.actualDate!.trim());
    } else if (status === "scheduled") {
      actualDate = existing.actualDate;
    } else {
      actualDate = existing.actualDate;
    }

    const trimmedNote = statusNote?.trim() || null;

    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.visitRequest.update({
        where: { id },
        data: {
          status,
          visitType,
          actualDate,
          statusNote: trimmedNote,
        },
        select: { id: true, status: true },
      });

      await logVisitRequestHistory(tx, {
        visitRequestId: id,
        userId: user.id,
        action:
          status === "completed"
            ? "completed"
            : status === "cancelled"
              ? "cancelled"
              : "status_changed",
        note: trimmedNote,
      });

      await logActivity(
        {
          userId: user.id,
          entityType: "visit_request",
          entityId: id,
          action:
            status === "completed"
              ? "completed"
              : status === "cancelled"
                ? "cancelled"
                : "status_changed",
          note: trimmedNote,
        },
        tx
      );

      return updated;
    });

    revalidatePath("/visit-requests");
    revalidatePath(`/visit-requests/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: request };
  } catch {
    return { success: false, error: "Không thể cập nhật tình trạng đơn" };
  }
}

export { formatDateForInput };

export async function exportVisitRequests(
  filters: Omit<VisitRequestFiltersInput, "page" | "pageSize"> = {}
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    await requireAuth();

    const search = filters.search?.trim();
    const statuses = filters.status;
    const visitTeamId = filters.visitTeamId?.trim();
    const dateFrom = filters.dateFrom?.trim();
    const dateTo = filters.dateTo?.trim();

    const where: Prisma.VisitRequestWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { staffCodes: { contains: search } },
        { household: { code: { contains: search } } },
        { visitTeam: { code: { contains: search } } },
      ];
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (visitTeamId) {
      where.visitTeamId = visitTeamId;
    }

    if (dateFrom || dateTo) {
      const scheduledDate: Prisma.DateTimeFilter = {};

      if (dateFrom) {
        scheduledDate.gte = parseScheduledDateInput(dateFrom);
      }

      if (dateTo) {
        const end = parseScheduledDateInput(dateTo);
        end.setHours(23, 59, 59, 999);
        scheduledDate.lte = end;
      }

      where.scheduledDate = scheduledDate;
    }

    const requests = await prisma.visitRequest.findMany({
      where,
      orderBy: [{ scheduledDate: "desc" }, { code: "desc" }],
      select: {
        code: true,
        scheduledDate: true,
        actualDate: true,
        status: true,
        content: true,
        staffCodes: true,
        household: { select: { code: true } },
        visitTeam: { select: { code: true } },
        representativeMember: { select: { code: true } },
      },
    });

    const rows = requests.map(visitRequestToExportRow);
    const date = new Date().toISOString().slice(0, 10);
    const base64 = buildExcelBase64(
      VISIT_REQUEST_EXPORT_HEADERS,
      rows,
      "Đơn thăm viếng"
    );

    return {
      success: true,
      data: { base64, fileName: `don-tham-vieng-${date}.xlsx` },
    };
  } catch {
    return { success: false, error: "Không thể xuất file Excel" };
  }
}
