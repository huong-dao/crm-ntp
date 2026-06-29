"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { prisma } from "@/lib/prisma";
import {
  departmentFormSchema,
  type DepartmentFormInput,
} from "@/lib/validations/department";

export type DepartmentListItem = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  memberCount: number;
  createdAt: string;
};

export type DepartmentsResult = {
  departments: DepartmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DepartmentFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type DepartmentOption = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
};

export type DepartmentDetail = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  createdAt: string;
  ageMemberCount: number;
  actualMemberCount: number;
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  await requireAuth();

  return prisma.department.findMany({
    select: { id: true, name: true, minAge: true, maxAge: true },
    orderBy: { name: "asc" },
  });
}

export async function getDepartments(
  filters: DepartmentFilters = {}
): Promise<DepartmentsResult> {
  await requireAuth();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = filters.search?.trim();

  const where: Prisma.DepartmentWhereInput = {};
  if (search) {
    where.name = { contains: search };
  }

  const [rows, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        minAge: true,
        maxAge: true,
        createdAt: true,
        _count: {
          select: {
            ageMembers: true,
            actualMembers: true,
          },
        },
      },
    }),
    prisma.department.count({ where }),
  ]);

  const departments: DepartmentListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    minAge: row.minAge,
    maxAge: row.maxAge,
    memberCount: row._count.ageMembers + row._count.actualMembers,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    departments,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getDepartmentById(
  id: string
): Promise<DepartmentDetail | null> {
  await requireAuth();

  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      minAge: true,
      maxAge: true,
      createdAt: true,
      _count: {
        select: {
          ageMembers: true,
          actualMembers: true,
        },
      },
    },
  });

  if (!department) return null;

  return {
    id: department.id,
    name: department.name,
    minAge: department.minAge,
    maxAge: department.maxAge,
    createdAt: department.createdAt.toISOString(),
    ageMemberCount: department._count.ageMembers,
    actualMemberCount: department._count.actualMembers,
  };
}

export async function resolveDepartmentIdByName(
  name: string | null | undefined
): Promise<string | null> {
  if (!name?.trim()) return null;

  const department = await prisma.department.findFirst({
    where: { name: name.trim() },
    select: { id: true },
  });

  return department?.id ?? null;
}

export async function createDepartment(
  input: DepartmentFormInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    await requireAuth();
    const parsed = departmentFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { name, minAge, maxAge } = parsed.data;

    const nameTaken = await prisma.department.findUnique({
      where: { name },
      select: { id: true },
    });
    if (nameTaken) {
      return { success: false, error: "Tên ban ngành đã tồn tại" };
    }

    const department = await prisma.department.create({
      data: {
        name,
        minAge: minAge ?? null,
        maxAge: maxAge ?? null,
      },
      select: { id: true, name: true },
    });

    revalidatePath("/departments");
    revalidatePath("/members");

    return { success: true, data: department };
  } catch {
    return { success: false, error: "Không thể tạo ban ngành" };
  }
}

export async function updateDepartment(
  id: string,
  input: DepartmentFormInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    await requireAuth();
    const parsed = departmentFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Ban ngành không tồn tại" };
    }

    const { name, minAge, maxAge } = parsed.data;

    if (name !== existing.name) {
      const nameTaken = await prisma.department.findUnique({
        where: { name },
        select: { id: true },
      });
      if (nameTaken) {
        return { success: false, error: "Tên ban ngành đã tồn tại" };
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        minAge: minAge ?? null,
        maxAge: maxAge ?? null,
      },
      select: { id: true, name: true },
    });

    revalidatePath("/departments");
    revalidatePath(`/departments/${id}`);
    revalidatePath("/members");

    return { success: true, data: department };
  } catch {
    return { success: false, error: "Không thể cập nhật ban ngành" };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ageMembers: true,
            actualMembers: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Ban ngành không tồn tại" };
    }

    const memberCount =
      department._count.ageMembers + department._count.actualMembers;
    if (memberCount > 0) {
      return {
        success: false,
        error: "Không thể xóa ban ngành đang được gán cho thành viên",
      };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath("/departments");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể xóa ban ngành" };
  }
}
