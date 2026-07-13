"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus, Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { generateHouseholdCode } from "@/lib/generate-code";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { buildExcelBase64 } from "@/lib/member-excel";
import {
  HOUSEHOLD_EXPORT_HEADERS,
  householdToExportRow,
} from "@/lib/household-export";
import { buildOldFullAddress } from "@/lib/member-format";
import { prisma } from "@/lib/prisma";
import {
  buildHouseholdTeamScopeWhere,
  requireAuthUser,
} from "@/lib/user-scope";
import {
  householdFormSchema,
  type HouseholdFormInput,
} from "@/lib/validations/household";

export type HouseholdMemberItem = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  mobile1: string | null;
  isHead: boolean;
  relationship: string | null;
  birthYear: number | null;
  gender: "male" | "female" | null;
  oldFullAddress: string | null;
  ageDepartmentName: string | null;
  actualDepartmentName: string | null;
};

export type HouseholdDetail = {
  id: string;
  code: string;
  headName: string | null;
  headMemberId: string | null;
  activeMemberCount: number;
  members: HouseholdMemberItem[];
};

export type HouseholdListItem = {
  id: string;
  code: string;
  headName: string | null;
  headPhone: string | null;
  headOldAddress: string | null;
  visitTeamCode: string | null;
  visitTeamId: string | null;
  memberCount: number;
  activeMemberCount: number;
};

export type HouseholdsResult = {
  households: HouseholdListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type HouseholdFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export type HeadMemberOption = {
  id: string;
  code: string;
  fullName: string;
};

export async function applyHouseholdHead(
  tx: Prisma.TransactionClient,
  householdId: string,
  headMemberId: string | null
) {
  await tx.member.updateMany({
    where: { householdId, isHead: true },
    data: { isHead: false },
  });

  if (!headMemberId) {
    await tx.household.update({
      where: { id: householdId },
      data: { headMemberId: null },
    });
    return;
  }

  const member = await tx.member.findUnique({
    where: { id: headMemberId },
    select: { id: true, householdId: true },
  });

  if (!member) {
    throw new Error("Thành viên không tồn tại");
  }

  if (member.householdId && member.householdId !== householdId) {
    throw new Error("Thành viên đã thuộc hộ khác");
  }

  await tx.member.update({
    where: { id: headMemberId },
    data: {
      householdId,
      isHead: true,
    },
  });

  await tx.household.update({
    where: { id: householdId },
    data: { headMemberId },
  });
}

export async function getHeadMemberOptions(
  householdId?: string,
  search?: string
): Promise<HeadMemberOption[]> {
  await requireAuth();

  const searchTrim = search?.trim();
  const where: Prisma.MemberWhereInput = {
    AND: [
      householdId
        ? { OR: [{ householdId: null }, { householdId }] }
        : { householdId: null },
      ...(searchTrim
        ? [
            {
              OR: [
                { fullName: { contains: searchTrim } },
                { code: { contains: searchTrim } },
              ],
            },
          ]
        : []),
    ],
  };

  const members = await prisma.member.findMany({
    where,
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  return members;
}

function resolveHeadMember<
  T extends {
    id: string;
    fullName: string;
    mobile1: string | null;
    oldFullAddress: string | null;
    houseNumber: string | null;
    street: string | null;
    oldWard: string | null;
    oldDistrict: string | null;
    oldProvince: string | null;
    isHead: boolean;
    visitTeam: { id: string; code: string } | null;
  },
>(
  headMemberId: string | null,
  members: T[]
): T | undefined {
  if (headMemberId) {
    const byId = members.find((member) => member.id === headMemberId);
    if (byId) return byId;
  }
  return members.find((member) => member.isHead);
}

export async function getHouseholds(
  filters: HouseholdFilters = {}
): Promise<HouseholdsResult> {
  const user = await requireAuthUser();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = filters.search?.trim();

  const where: Prisma.HouseholdWhereInput = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      {
        members: {
          some: { isHead: true, fullName: { contains: search } },
        },
      },
    ];
  }

  const teamScope = buildHouseholdTeamScopeWhere(user);
  const scopedWhere: Prisma.HouseholdWhereInput = teamScope
    ? { AND: [where, teamScope] }
    : where;

  const [rows, total] = await prisma.$transaction([
    prisma.household.findMany({
      where: scopedWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        headMemberId: true,
        members: {
          select: {
            id: true,
            fullName: true,
            mobile1: true,
            oldFullAddress: true,
            houseNumber: true,
            street: true,
            oldWard: true,
            oldDistrict: true,
            oldProvince: true,
            isHead: true,
            status: true,
            visitTeam: { select: { id: true, code: true } },
          },
        },
        _count: { select: { members: true } },
      },
    }),
    prisma.household.count({ where: scopedWhere }),
  ]);

  const households: HouseholdListItem[] = rows.map((row) => {
    const head = resolveHeadMember(row.headMemberId, row.members);
    const activeMemberCount = row.members.filter(
      (member) => member.status === "active"
    ).length;

    return {
      id: row.id,
      code: row.code,
      headName: head?.fullName ?? null,
      headPhone: head?.mobile1 ?? null,
      headOldAddress:
        head?.oldFullAddress ||
        (head ? buildOldFullAddress(head) : null) ||
        null,
      visitTeamCode: head?.visitTeam?.code ?? null,
      visitTeamId: head?.visitTeam?.id ?? null,
      memberCount: row._count.members,
      activeMemberCount,
    };
  });

  return {
    households,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getHouseholdById(
  id: string
): Promise<HouseholdDetail | null> {
  await requireAuth();

  const household = await prisma.household.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      headMemberId: true,
      members: {
        orderBy: [{ isHead: "desc" }, { fullName: "asc" }],
        select: {
          id: true,
          code: true,
          fullName: true,
          status: true,
          mobile1: true,
          isHead: true,
          relationship: true,
          birthYear: true,
          gender: true,
          oldFullAddress: true,
          houseNumber: true,
          street: true,
          oldWard: true,
          oldDistrict: true,
          oldProvince: true,
          ageDepartment: { select: { name: true } },
          actualDepartment: { select: { name: true } },
        },
      },
    },
  });

  if (!household) return null;

  const headMember =
    household.members.find((member) => member.id === household.headMemberId) ??
    household.members.find((member) => member.isHead);
  const activeMemberCount = household.members.filter(
    (member) => member.status === "active"
  ).length;

  const members: HouseholdMemberItem[] = household.members.map((member) => ({
    id: member.id,
    code: member.code,
    fullName: member.fullName,
    status: member.status,
    mobile1: member.mobile1,
    isHead: member.isHead,
    relationship: member.relationship,
    birthYear: member.birthYear,
    gender: member.gender,
    oldFullAddress:
      member.oldFullAddress || buildOldFullAddress(member) || null,
    ageDepartmentName: member.ageDepartment?.name ?? null,
    actualDepartmentName: member.actualDepartment?.name ?? null,
  }));

  return {
    id: household.id,
    code: household.code,
    headName: headMember?.fullName ?? null,
    headMemberId: household.headMemberId,
    activeMemberCount,
    members,
  };
}

export async function createHousehold(
  input: HouseholdFormInput = { headMemberId: null }
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = householdFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { headMemberId } = parsed.data;

    if (headMemberId) {
      const member = await prisma.member.findUnique({
        where: { id: headMemberId },
        select: { householdId: true },
      });
      if (!member) {
        return { success: false, error: "Thành viên không tồn tại" };
      }
      if (member.householdId) {
        return {
          success: false,
          error: "Thành viên đã có hộ — chọn người chưa có hộ hoặc tạo hộ trống",
        };
      }
    }

    const code = await generateHouseholdCode();

    const household = await prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: {
          code,
          headMemberId: headMemberId ?? null,
        },
      });

      if (headMemberId) {
        await applyHouseholdHead(tx, created.id, headMemberId);
      }

      return created;
    });

    revalidatePath("/households");
    return { success: true, data: { id: household.id, code: household.code } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo hộ gia đình";
    return { success: false, error: message };
  }
}

export async function updateHousehold(
  id: string,
  input: HouseholdFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = householdFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const existing = await prisma.household.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Hộ gia đình không tồn tại" };
    }

    const { headMemberId } = parsed.data;

    if (!headMemberId) {
      return { success: false, error: "Chủ hộ là bắt buộc" };
    }

    const member = await prisma.member.findUnique({
      where: { id: headMemberId },
      select: { householdId: true },
    });
    if (!member) {
      return { success: false, error: "Thành viên không tồn tại" };
    }
    if (member.householdId && member.householdId !== id) {
      return {
        success: false,
        error: "Thành viên đã thuộc hộ khác",
      };
    }

    const household = await prisma.$transaction(async (tx) => {
      await applyHouseholdHead(tx, id, headMemberId);
      return tx.household.findUniqueOrThrow({
        where: { id },
        select: { id: true, code: true },
      });
    });

    revalidatePath("/households");
    revalidatePath(`/households/${id}`);
    return { success: true, data: household };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể cập nhật hộ gia đình";
    return { success: false, error: message };
  }
}

export async function splitHousehold(
  memberIds: string[],
  newHeadMemberId: string
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();

    if (memberIds.length === 0) {
      return { success: false, error: "Chọn ít nhất một thành viên" };
    }

    if (!memberIds.includes(newHeadMemberId)) {
      return {
        success: false,
        error: "Chủ hộ mới phải nằm trong danh sách tách",
      };
    }

    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, householdId: true },
    });

    if (members.length !== memberIds.length) {
      return { success: false, error: "Một số thành viên không tồn tại" };
    }

    const householdIds = [
      ...new Set(members.map((member) => member.householdId).filter(Boolean)),
    ];
    if (householdIds.length !== 1) {
      return { success: false, error: "Các thành viên phải cùng một hộ" };
    }

    const sourceHouseholdId = householdIds[0]!;

    const sourceCount = await prisma.member.count({
      where: { householdId: sourceHouseholdId },
    });
    if (memberIds.length >= sourceCount) {
      return {
        success: false,
        error: "Phải để lại ít nhất một thành viên trong hộ cũ",
      };
    }

    const code = await generateHouseholdCode();

    const household = await prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: { code },
      });

      await tx.member.updateMany({
        where: { id: { in: memberIds } },
        data: { householdId: created.id, isHead: false },
      });

      await applyHouseholdHead(tx, created.id, newHeadMemberId);

      const sourceHousehold = await tx.household.findUnique({
        where: { id: sourceHouseholdId },
        select: { headMemberId: true },
      });
      if (
        sourceHousehold?.headMemberId &&
        memberIds.includes(sourceHousehold.headMemberId)
      ) {
        await tx.household.update({
          where: { id: sourceHouseholdId },
          data: { headMemberId: null },
        });
      }

      return created;
    });

    revalidatePath("/households");
    revalidatePath(`/households/${sourceHouseholdId}`);
    revalidatePath(`/households/${household.id}`);
    revalidatePath("/members");

    return { success: true, data: { id: household.id, code: household.code } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể tách hộ";
    return { success: false, error: message };
  }
}

export async function deleteHousehold(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    const household = await prisma.household.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!household) {
      return { success: false, error: "Hộ gia đình không tồn tại" };
    }

    if (household._count.members > 0) {
      return {
        success: false,
        error: "Không thể xóa hộ còn thành viên",
      };
    }

    await prisma.household.delete({ where: { id } });
    revalidatePath("/households");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể xóa hộ gia đình" };
  }
}

export async function exportHouseholds(
  filters: HouseholdFilters = {}
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    const user = await requireAuthUser();

    const search = filters.search?.trim();
    const where: Prisma.HouseholdWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        {
          members: {
            some: {
              OR: [
                { fullName: { contains: search } },
                { code: { contains: search } },
              ],
            },
          },
        },
      ];
    }

    const teamScope = buildHouseholdTeamScopeWhere(user);
    const scopedWhere: Prisma.HouseholdWhereInput = teamScope
      ? { AND: [where, teamScope] }
      : where;

    const households = await prisma.household.findMany({
      where: scopedWhere,
      orderBy: { code: "asc" },
      select: {
        code: true,
        _count: { select: { members: true } },
        members: {
          where: { isHead: true },
          select: { code: true, fullName: true },
          take: 1,
        },
      },
    });

    const rows = households.map((household) =>
      householdToExportRow({
        code: household.code,
        headMember: household.members[0] ?? null,
        memberCount: household._count.members,
      })
    );

    const date = new Date().toISOString().slice(0, 10);
    const base64 = buildExcelBase64(HOUSEHOLD_EXPORT_HEADERS, rows, "Hộ gia đình");

    return {
      success: true,
      data: { base64, fileName: `ho-gia-dinh-${date}.xlsx` },
    };
  } catch {
    return { success: false, error: "Không thể xuất file Excel" };
  }
}
