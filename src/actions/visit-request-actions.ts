"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, VisitRequestStatus } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { generateVisitRequestCode } from "@/lib/generate-code";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { prisma } from "@/lib/prisma";
import type { VisitRequestFiltersInput } from "@/lib/visit-request-list";
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
  householdCode: string;
  householdId: string;
  visitTeamCode: string;
  visitTeamId: string;
  staffCodes: string | null;
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
  households: VisitRequestHouseholdOption[];
  visitTeams: VisitRequestTeamOption[];
};

export type VisitRequestDetail = {
  id: string;
  code: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  content: string | null;
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

export type VisitRequestPrintData = VisitRequestDetail & {
  staffNames: string[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function getAuthUserRecord() {
  const session = await requireAuth();
  return prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      role: true,
      memberId: true,
      member: { select: { visitTeamId: true } },
    },
  });
}

async function assertTeamAccess(visitTeamId: string) {
  const user = await getAuthUserRecord();
  if (!user) throw new Error("Unauthorized");

  if (user.role === "admin") return user;

  const lockedTeamId = user.member?.visitTeamId ?? null;
  if (!lockedTeamId || lockedTeamId !== visitTeamId) {
    throw new Error("Không có quyền thao tác tổ thăm viếng này");
  }

  return user;
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
  const members = await prisma.member.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, code: true, visitTeamId: true },
  });

  if (members.length !== uniqueIds.length) {
    throw new Error("Một hoặc nhiều nhân sự không tồn tại");
  }

  for (const member of members) {
    if (member.visitTeamId !== visitTeamId) {
      throw new Error(
        `Nhân sự ${member.code} không thuộc tổ thăm viếng đã chọn`
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
}> {
  await requireAuth();

  const visitTeams = await prisma.visitTeam.findMany({
    select: { id: true, code: true, area: true },
    orderBy: { code: "asc" },
  });

  return { visitTeams };
}

export async function getVisitRequests(
  filters: VisitRequestFiltersInput = {}
): Promise<VisitRequestsResult> {
  await requireAuth();

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
        staffCodes: true,
        householdId: true,
        visitTeamId: true,
        household: { select: { code: true } },
        visitTeam: { select: { code: true } },
      },
    }),
    prisma.visitRequest.count({ where }),
  ]);

  const requests: VisitRequestListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    scheduledDate: row.scheduledDate,
    actualDate: row.actualDate,
    status: row.status,
    householdCode: row.household.code,
    householdId: row.householdId,
    visitTeamCode: row.visitTeam.code,
    visitTeamId: row.visitTeamId,
    staffCodes: row.staffCodes,
  }));

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

  const households = await prisma.household.findMany({
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

  const isAdmin = user.role === "admin";
  const lockedVisitTeamId = !isAdmin
    ? user.member?.visitTeamId ?? null
    : null;

  let visitTeams: VisitRequestTeamOption[] = [];

  if (isAdmin) {
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
    isAdmin,
    lockedVisitTeamId,
    households: households.map((household) => ({
      id: household.id,
      code: household.code,
      headName: household.members[0]?.fullName ?? null,
    })),
    visitTeams,
  };
}

export async function getVisitTeamStaffMembers(
  visitTeamId: string
): Promise<VisitRequestStaffOption[]> {
  await assertTeamAccess(visitTeamId);

  return prisma.member.findMany({
    where: { visitTeamId },
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
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
      scheduledDate,
      actualDate,
      content,
      representativeMemberId,
      additionalStaffMemberIds,
    } = parsed.data;

    await assertTeamAccess(visitTeamId);

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

    const request = await prisma.visitRequest.create({
      data: {
        code,
        householdId,
        visitTeamId,
        scheduledDate: scheduled,
        actualDate: actual,
        status: "scheduled",
        representativeMemberId: staffData.representativeMemberId,
        staffCodes: staffData.staffCodes,
        content:
          trimmedContent && trimmedContent.length > 0 ? trimmedContent : null,
      },
      select: { id: true, code: true },
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
    content: string | null;
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
    content: request.content,
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
  content: true,
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
  await requireAuth();

  const request = await prisma.visitRequest.findUnique({
    where: { id },
    select: visitRequestSelect,
  });

  if (!request) return null;

  return loadVisitRequestDetail(request);
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

  return {
    ...detail,
    staffNames,
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
      scheduledDate,
      actualDate,
      content,
      status,
      representativeMemberId,
      additionalStaffMemberIds,
    } = parsed.data;

    await assertTeamAccess(visitTeamId);

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

    const request = await prisma.visitRequest.update({
      where: { id },
      data: {
        householdId,
        visitTeamId,
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
    await requireAuth();
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

    await assertTeamAccess(existing.visitTeamId);

    const { status } = parsed.data;
    let actualDate: Date | null = existing.actualDate;

    if (status === "completed") {
      actualDate = parseScheduledDateInput(parsed.data.actualDate!.trim());
    } else if (status === "scheduled") {
      actualDate = existing.actualDate;
    } else {
      actualDate = existing.actualDate;
    }

    const request = await prisma.visitRequest.update({
      where: { id },
      data: { status, actualDate },
      select: { id: true, status: true },
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
