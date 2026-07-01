"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus, Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import {
  generateHouseholdCode,
  generateMemberCode,
} from "@/lib/generate-code";
import {
  DEFAULT_PAGE_SIZE,
  STATUS_LABELS,
  type MemberFiltersInput,
} from "@/lib/member-list";
import { buildExcelBase64, memberToImportExportRow } from "@/lib/member-excel";
import { MEMBER_IMPORT_TEMPLATE_HEADERS } from "@/lib/csv";
import { ageFromBirthYear } from "@/lib/department-age";
import { buildOldFullAddress, buildNewFullAddress } from "@/lib/member-format";
import { applyHeadOfHousehold, buildMemberWriteData } from "@/lib/member-write";
import { prisma } from "@/lib/prisma";
import {
  memberFormSchema,
  type MemberFormInput,
} from "@/lib/validations/member";

export type MemberListItem = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  mobile1: string | null;
  actualDepartmentName: string | null;
  householdCode: string | null;
};

export type MembersResult = {
  members: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MemberFilterOptions = {
  visitTeams: { id: string; code: string; area: string }[];
  departments: { id: string; name: string }[];
};

export type MemberFormOptions = {
  households: { id: string; code: string; headName: string | null }[];
  visitTeams: { id: string; code: string; area: string }[];
  departments: { id: string; name: string; minAge: number | null; maxAge: number | null }[];
};

export type MemberFormDefaults = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  firstName: string;
  lastName: string;
  gender: "male" | "female" | null;
  birthYear: number | null;
  occupation: string | null;
  houseNumber: string | null;
  street: string | null;
  oldWard: string | null;
  oldDistrict: string | null;
  oldProvince: string | null;
  newWard: string | null;
  newProvince: string | null;
  mobile1: string | null;
  mobile2: string | null;
  landline: string | null;
  householdId: string;
  isHead: boolean;
  relationship: string | null;
  isBaptized: boolean;
  baptismYear: number | null;
  ageDepartmentId: string | null;
  actualDepartmentId: string | null;
  boardServiceYear: number | null;
  visitDepartmentYear: number | null;
  visitTeamId: string | null;
  notes: string | null;
};

export type MemberDetail = {
  id: string;
  code: string;
  fullName: string;
  firstName: string;
  lastName: string;
  status: MemberStatus;
  gender: "male" | "female" | null;
  birthYear: number | null;
  age: number | null;
  occupation: string | null;
  houseNumber: string | null;
  street: string | null;
  oldWard: string | null;
  oldDistrict: string | null;
  oldProvince: string | null;
  oldFullAddress: string | null;
  newWard: string | null;
  newProvince: string | null;
  newFullAddress: string | null;
  mobile1: string | null;
  mobile2: string | null;
  landline: string | null;
  isHead: boolean;
  relationship: string | null;
  household: { id: string; code: string } | null;
  isBaptized: boolean;
  baptismYear: number | null;
  ageDepartment: { id: string; name: string } | null;
  actualDepartment: { id: string; name: string } | null;
  boardServiceYear: number | null;
  visitDepartmentYear: number | null;
  visitTeam: { id: string; code: string; area: string } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function yearFromDate(date: Date | null): number | null {
  if (!date) return null;
  return date.getFullYear();
}

function parseVisitDepartmentYear(value: string | null): number | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 1900) return null;
  return year;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function buildWhere(filters: MemberFiltersInput): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {};

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { code: { contains: search } },
      { household: { code: { contains: search } } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.visitTeamId) {
    where.visitTeamId = filters.visitTeamId;
  }

  if (filters.ageDepartment) {
    where.ageDepartmentId = filters.ageDepartment;
  }

  if (filters.actualDepartment) {
    where.actualDepartmentId = filters.actualDepartment;
  }

  return where;
}

export async function getMembers(
  filters: MemberFiltersInput = {}
): Promise<MembersResult> {
  await requireAuth();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const sortBy = filters.sortBy ?? "fullName";
  const sortOrder = filters.sortOrder ?? "asc";
  const where = buildWhere(filters);

  const [rows, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        code: true,
        fullName: true,
        status: true,
        mobile1: true,
        actualDepartment: { select: { name: true } },
        household: { select: { code: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  const members: MemberListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    status: row.status,
    mobile1: row.mobile1,
    actualDepartmentName: row.actualDepartment?.name ?? null,
    householdCode: row.household?.code ?? null,
  }));

  return {
    members,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMemberFilterOptions(): Promise<MemberFilterOptions> {
  await requireAuth();

  const [visitTeams, departments] = await Promise.all([
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { visitTeams, departments };
}

export async function getMemberFormOptions(): Promise<MemberFormOptions> {
  await requireAuth();

  const [householdRows, visitTeams, departments] = await Promise.all([
    prisma.household.findMany({
      select: {
        id: true,
        code: true,
        headMemberId: true,
        members: {
          where: { isHead: true },
          select: { fullName: true },
          take: 1,
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true, minAge: true, maxAge: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const missingHeadIds = householdRows
    .filter((row) => !row.members[0] && row.headMemberId)
    .map((row) => row.headMemberId!);

  const headById = new Map<string, string>();
  if (missingHeadIds.length > 0) {
    const heads = await prisma.member.findMany({
      where: { id: { in: missingHeadIds } },
      select: { id: true, fullName: true },
    });
    for (const head of heads) {
      headById.set(head.id, head.fullName);
    }
  }

  const households = householdRows.map((row) => ({
    id: row.id,
    code: row.code,
    headName:
      row.members[0]?.fullName ??
      (row.headMemberId ? headById.get(row.headMemberId) : null) ??
      null,
  }));

  return { households, visitTeams, departments };
}

export async function getMemberById(
  id: string
): Promise<MemberFormDefaults | null> {
  await requireAuth();

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member || !member.householdId) return null;

  return {
    id: member.id,
    code: member.code,
    fullName: member.fullName,
    status: member.status,
    firstName: member.firstName,
    lastName: member.lastName,
    gender: member.gender,
    birthYear: member.birthYear,
    occupation: member.occupation,
    houseNumber: member.houseNumber,
    street: member.street,
    oldWard: member.oldWard,
    oldDistrict: member.oldDistrict,
    oldProvince: member.oldProvince,
    newWard: member.newWard,
    newProvince: member.newProvince,
    mobile1: member.mobile1,
    mobile2: member.mobile2,
    landline: member.landline,
    householdId: member.householdId,
    isHead: member.isHead,
    relationship: member.relationship,
    isBaptized: member.isBaptized,
    baptismYear: member.baptismYear,
    ageDepartmentId: member.ageDepartmentId,
    actualDepartmentId: member.actualDepartmentId,
    boardServiceYear: yearFromDate(member.boardServiceDate),
    visitDepartmentYear: parseVisitDepartmentYear(member.visitDepartment),
    visitTeamId: member.visitTeamId,
    notes: member.notes,
  };
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  await requireAuth();

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      household: { select: { id: true, code: true } },
      visitTeam: { select: { id: true, code: true, area: true } },
      ageDepartment: { select: { id: true, name: true } },
      actualDepartment: { select: { id: true, name: true } },
    },
  });

  if (!member) return null;

  const oldFullAddress =
    member.oldFullAddress ||
    buildOldFullAddress(member) ||
    null;
  const newFullAddress =
    member.newFullAddress ||
    buildNewFullAddress(member) ||
    null;

  return {
    id: member.id,
    code: member.code,
    fullName: member.fullName,
    firstName: member.firstName,
    lastName: member.lastName,
    status: member.status,
    gender: member.gender,
    birthYear: member.birthYear,
    age:
      member.birthYear != null
        ? ageFromBirthYear(member.birthYear)
        : null,
    occupation: member.occupation,
    houseNumber: member.houseNumber,
    street: member.street,
    oldWard: member.oldWard,
    oldDistrict: member.oldDistrict,
    oldProvince: member.oldProvince,
    oldFullAddress,
    newWard: member.newWard,
    newProvince: member.newProvince,
    newFullAddress,
    mobile1: member.mobile1,
    mobile2: member.mobile2,
    landline: member.landline,
    isHead: member.isHead,
    relationship: member.relationship,
    household: member.household,
    isBaptized: member.isBaptized,
    baptismYear: member.baptismYear,
    ageDepartment: member.ageDepartment,
    actualDepartment: member.actualDepartment,
    boardServiceYear: yearFromDate(member.boardServiceDate),
    visitDepartmentYear: parseVisitDepartmentYear(member.visitDepartment),
    visitTeam: member.visitTeam,
    notes: member.notes,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

export async function createMember(
  input: MemberFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = memberFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const data = parsed.data;

    if (!data.createNewHousehold) {
      const household = await prisma.household.findUnique({
        where: { id: data.householdId! },
      });
      if (!household) {
        return { success: false, error: "Mã hộ không tồn tại" };
      }
    }

    if (data.visitTeamId) {
      const team = await prisma.visitTeam.findUnique({
        where: { id: data.visitTeamId },
      });
      if (!team) {
        return { success: false, error: "Tổ thăm viếng không tồn tại" };
      }
    }

    if (data.ageDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.ageDepartmentId },
      });
      if (!department) {
        return { success: false, error: "Ban ngành theo tuổi không tồn tại" };
      }
    }

    if (data.actualDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.actualDepartmentId },
      });
      if (!department) {
        return { success: false, error: "Ban ngành thực tế không tồn tại" };
      }
    }

    const code = await generateMemberCode();
    const built = buildMemberWriteData(
      {
        ...data,
        householdId: data.createNewHousehold ? null : data.householdId,
      },
      code
    );
    if (!built.ok) {
      return { success: false, error: built.error };
    }

    const member = await prisma.$transaction(async (tx) => {
      let householdId = data.householdId!;

      if (data.createNewHousehold) {
        const householdCode = await generateHouseholdCode();
        const household = await tx.household.create({
          data: { code: householdCode },
        });
        householdId = household.id;
      }

      const created = await tx.member.create({
        data: { ...built.data, householdId },
      });

      await applyHeadOfHousehold(tx, householdId, created.id, data.isHead);

      return created;
    });

    revalidatePath("/members");
    revalidatePath("/households");
    revalidatePath(`/households/${member.householdId}`);

    return { success: true, data: { id: member.id, code: member.code } };
  } catch {
    return { success: false, error: "Không thể tạo thành viên" };
  }
}

export async function updateMember(
  id: string,
  input: MemberFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = memberFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const data = parsed.data;
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Thành viên không tồn tại" };
    }

    if (data.createNewHousehold || !data.householdId) {
      return { success: false, error: "Mã hộ không được trống" };
    }

    const householdId = data.householdId;

    const household = await prisma.household.findUnique({
      where: { id: householdId },
    });
    if (!household) {
      return { success: false, error: "Mã hộ không tồn tại" };
    }

    if (data.visitTeamId) {
      const team = await prisma.visitTeam.findUnique({
        where: { id: data.visitTeamId },
      });
      if (!team) {
        return { success: false, error: "Tổ thăm viếng không tồn tại" };
      }
    }

    if (data.ageDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.ageDepartmentId },
      });
      if (!department) {
        return { success: false, error: "Ban ngành theo tuổi không tồn tại" };
      }
    }

    if (data.actualDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.actualDepartmentId },
      });
      if (!department) {
        return { success: false, error: "Ban ngành thực tế không tồn tại" };
      }
    }

    const built = buildMemberWriteData(data);
    if (!built.ok) {
      return { success: false, error: built.error };
    }

    const oldHouseholdId = existing.householdId;

    const member = await prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id },
        data: built.data,
      });

      await applyHeadOfHousehold(tx, householdId, id, data.isHead);

      if (oldHouseholdId && oldHouseholdId !== householdId) {
        const oldHousehold = await tx.household.findUnique({
          where: { id: oldHouseholdId },
          select: { headMemberId: true },
        });
        if (oldHousehold?.headMemberId === id) {
          await tx.household.update({
            where: { id: oldHouseholdId },
            data: { headMemberId: null },
          });
        }
      }

      return updated;
    });

    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    revalidatePath(`/households/${householdId}`);
    if (oldHouseholdId && oldHouseholdId !== householdId) {
      revalidatePath(`/households/${oldHouseholdId}`);
    }

    return { success: true, data: { id: member.id, code: member.code } };
  } catch {
    return { success: false, error: "Không thể cập nhật thành viên" };
  }
}

export async function deleteMember(
  id: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Thành viên không tồn tại" };
    }

    const householdId = existing.householdId;

    await prisma.$transaction(async (tx) => {
      if (householdId) {
        const household = await tx.household.findUnique({
          where: { id: householdId },
          select: { headMemberId: true },
        });
        if (household?.headMemberId === id) {
          await tx.household.update({
            where: { id: householdId },
            data: { headMemberId: null },
          });
        }
      }

      await tx.visitTeam.updateMany({
        where: { leaderMemberId: id },
        data: { leaderMemberId: null },
      });

      await tx.member.delete({ where: { id } });
    });

    revalidatePath("/members");
    if (householdId) {
      revalidatePath(`/households/${householdId}`);
    }

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể xóa thành viên" };
  }
}

export async function exportMembers(
  filters: MemberFiltersInput = {}
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    await requireAuth();

    const sortBy = filters.sortBy ?? "fullName";
    const sortOrder = filters.sortOrder ?? "asc";
    const where = buildWhere(filters);

    const members = await prisma.member.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      select: {
        code: true,
        status: true,
        firstName: true,
        lastName: true,
        houseNumber: true,
        street: true,
        oldWard: true,
        oldDistrict: true,
        oldProvince: true,
        newWard: true,
        newProvince: true,
        mobile1: true,
        mobile2: true,
        landline: true,
        birthYear: true,
        gender: true,
        occupation: true,
        isHead: true,
        relationship: true,
        isBaptized: true,
        baptismYear: true,
        boardServiceDate: true,
        visitDepartment: true,
        notes: true,
        household: { select: { code: true } },
        visitTeam: { select: { code: true } },
        ageDepartment: { select: { name: true } },
        actualDepartment: { select: { name: true } },
      },
    });

    const rows = members.map(memberToImportExportRow);
    const date = new Date().toISOString().slice(0, 10);
    const base64 = buildExcelBase64(MEMBER_IMPORT_TEMPLATE_HEADERS, rows);
    return {
      success: true,
      data: { base64, fileName: `thanh-vien-${date}.xlsx` },
    };
  } catch {
    return { success: false, error: "Không thể xuất file Excel" };
  }
}
