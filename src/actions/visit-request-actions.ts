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
  parseScheduledDateInput,
  parseStaffCodeList,
  visitRequestFormSchema,
  visitRequestStaffSchema,
  visitRequestStatusSchema,
  type VisitRequestFormInput,
  type VisitRequestStaffInput,
  type VisitRequestStatusInput,
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

export type VisitRequestFormOptions = {
  households: VisitRequestHouseholdOption[];
  visitTeams: VisitRequestTeamOption[];
  staffMembers: VisitRequestStaffOption[];
};

export type VisitRequestDetail = {
  id: string;
  code: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  content: string | null;
  staffCodes: string | null;
  householdId: string;
  householdCode: string;
  visitTeamId: string;
  visitTeamCode: string;
  visitTeamArea: string;
  createdAt: Date;
  updatedAt: Date;
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
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

export async function getVisitRequestFormOptions(): Promise<VisitRequestFormOptions> {
  await requireAuth();

  const [households, visitTeams, staffMembers] = await Promise.all([
    prisma.household.findMany({
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
      take: 500,
    }),
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
    prisma.member.findMany({
      select: { id: true, code: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
  ]);

  return {
    households: households.map((household) => ({
      id: household.id,
      code: household.code,
      headName: household.members[0]?.fullName ?? null,
    })),
    visitTeams,
    staffMembers,
  };
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

async function resolveStaffCodes(
  staffCodes: string | null | undefined,
  staffMemberIds: string[] | undefined
): Promise<string | null> {
  if (staffMemberIds && staffMemberIds.length > 0) {
    const members = await prisma.member.findMany({
      where: { id: { in: staffMemberIds } },
      select: { code: true },
      orderBy: { code: "asc" },
    });

    if (members.length !== staffMemberIds.length) {
      throw new Error("Một hoặc nhiều nhân sự không tồn tại");
    }

    return members.map((member) => member.code).join(", ");
  }

  const trimmed = staffCodes?.trim();
  if (!trimmed) return null;

  const codes = parseStaffCodeList(trimmed);
  if (codes.length === 0) return null;

  const members = await prisma.member.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });

  const foundCodes = new Set(members.map((member) => member.code.toLowerCase()));
  const missing = codes.filter((code) => !foundCodes.has(code.toLowerCase()));

  if (missing.length > 0) {
    throw new Error(`Mã nhân sự không tồn tại: ${missing.join(", ")}`);
  }

  return codes.join(", ");
}

export async function getStaffMemberOptions(): Promise<VisitRequestStaffOption[]> {
  await requireAuth();

  return prisma.member.findMany({
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
}

export async function createVisitRequest(
  input: VisitRequestFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = visitRequestFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { householdId, visitTeamId, scheduledDate, content } = parsed.data;

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

    let staffCodes: string | null;
    try {
      staffCodes = await resolveStaffCodes(
        parsed.data.staffCodes,
        parsed.data.staffMemberIds
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nhân sự không hợp lệ";
      return { success: false, error: message };
    }

    const code = await generateVisitRequestCode();
    const scheduled = parseScheduledDateInput(scheduledDate);
    const trimmedContent = content?.trim();

    const request = await prisma.visitRequest.create({
      data: {
        code,
        householdId,
        visitTeamId,
        scheduledDate: scheduled,
        status: "scheduled",
        staffCodes,
        content: trimmedContent && trimmedContent.length > 0 ? trimmedContent : null,
      },
      select: { id: true, code: true },
    });

    revalidatePath("/visit-requests");
    revalidatePath("/dashboard");

    return { success: true, data: request };
  } catch {
    return { success: false, error: "Không thể tạo đơn thăm viếng" };
  }
}

export async function getVisitRequestById(
  id: string
): Promise<VisitRequestDetail | null> {
  await requireAuth();

  const request = await prisma.visitRequest.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      scheduledDate: true,
      actualDate: true,
      status: true,
      content: true,
      staffCodes: true,
      householdId: true,
      visitTeamId: true,
      createdAt: true,
      updatedAt: true,
      household: { select: { code: true } },
      visitTeam: { select: { code: true, area: true } },
    },
  });

  if (!request) return null;

  return {
    id: request.id,
    code: request.code,
    scheduledDate: request.scheduledDate,
    actualDate: request.actualDate,
    status: request.status,
    content: request.content,
    staffCodes: request.staffCodes,
    householdId: request.householdId,
    householdCode: request.household.code,
    visitTeamId: request.visitTeamId,
    visitTeamCode: request.visitTeam.code,
    visitTeamArea: request.visitTeam.area,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
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

    const { status } = parsed.data;
    let actualDate: Date | null = null;

    if (status === "completed") {
      actualDate = parseScheduledDateInput(parsed.data.actualDate!.trim());
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

export async function updateVisitRequestStaff(
  id: string,
  input: VisitRequestStaffInput
): Promise<ActionResult<{ staffCodes: string | null }>> {
  try {
    await requireAuth();
    const parsed = visitRequestStaffSchema.safeParse(input);

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

    let staffCodes: string | null;
    try {
      staffCodes = await resolveStaffCodes(
        parsed.data.staffCodes,
        parsed.data.staffMemberIds
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nhân sự không hợp lệ";
      return { success: false, error: message };
    }

    const request = await prisma.visitRequest.update({
      where: { id },
      data: { staffCodes },
      select: { staffCodes: true },
    });

    revalidatePath("/visit-requests");
    revalidatePath(`/visit-requests/${id}`);

    return { success: true, data: { staffCodes: request.staffCodes } };
  } catch {
    return { success: false, error: "Không thể cập nhật nhân sự" };
  }
}
