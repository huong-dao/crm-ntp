"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus, Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { generateHouseholdCode } from "@/lib/generate-code";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { prisma } from "@/lib/prisma";
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
};

export type HouseholdDetail = {
  id: string;
  code: string;
  headName: string | null;
  headMemberId: string | null;
  memberCount: number;
  members: HouseholdMemberItem[];
};

export type HouseholdListItem = {
  id: string;
  code: string;
  headName: string | null;
  memberCount: number;
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

async function applyHouseholdHead(
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
      relationship: null,
    },
  });

  await tx.household.update({
    where: { id: householdId },
    data: { headMemberId },
  });
}

export async function getHeadMemberOptions(
  householdId?: string
): Promise<HeadMemberOption[]> {
  await requireAuth();

  const members = await prisma.member.findMany({
    where: householdId
      ? {
          OR: [{ householdId: null }, { householdId }],
        }
      : { householdId: null },
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  return members;
}

export async function getHouseholds(
  filters: HouseholdFilters = {}
): Promise<HouseholdsResult> {
  await requireAuth();

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

  const [rows, total] = await prisma.$transaction([
    prisma.household.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        headMemberId: true,
        members: {
          where: { isHead: true },
          select: { fullName: true },
          take: 1,
        },
        _count: { select: { members: true } },
      },
    }),
    prisma.household.count({ where }),
  ]);

  const missingHeadIds = rows
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

  const households: HouseholdListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    headName:
      row.members[0]?.fullName ??
      (row.headMemberId ? headById.get(row.headMemberId) : null) ??
      null,
    memberCount: row._count.members,
  }));

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
        },
      },
    },
  });

  if (!household) return null;

  const headMember =
    household.members.find((m) => m.id === household.headMemberId) ??
    household.members.find((m) => m.isHead);

  return {
    id: household.id,
    code: household.code,
    headName: headMember?.fullName ?? null,
    headMemberId: household.headMemberId,
    memberCount: household.members.length,
    members: household.members,
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

    if (headMemberId) {
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
    }

    const household = await prisma.$transaction(async (tx) => {
      await applyHouseholdHead(tx, id, headMemberId ?? null);
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
