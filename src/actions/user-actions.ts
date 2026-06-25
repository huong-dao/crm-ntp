"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  toggleUserActiveSchema,
  updateUserSchema,
  type UpdateUserInput,
} from "@/lib/validations/user";

export type UserListItem = {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  memberId: string | null;
  memberCode: string | null;
  memberName: string | null;
  createdAt: Date;
};

export type UserDetail = UserListItem;

export type MemberLinkOption = {
  id: string;
  code: string;
  fullName: string;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getUsers(): Promise<UserListItem[]> {
  await requireAdmin();

  const rows = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      memberId: true,
      createdAt: true,
      member: { select: { code: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    isActive: row.isActive,
    memberId: row.memberId,
    memberCode: row.member?.code ?? null,
    memberName: row.member?.fullName ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getUserById(id: string): Promise<UserDetail | null> {
  await requireAdmin();

  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      memberId: true,
      createdAt: true,
      member: { select: { code: true, fullName: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isActive: row.isActive,
    memberId: row.memberId,
    memberCode: row.member?.code ?? null,
    memberName: row.member?.fullName ?? null,
    createdAt: row.createdAt,
  };
}

export async function getMemberLinkOptions(): Promise<MemberLinkOption[]> {
  await requireAdmin();

  return prisma.member.findMany({
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 1000,
  });
}

export async function createUser(
  input: { username: string; password: string; role: UserRole }
): Promise<ActionResult<UserListItem>> {
  try {
    const admin = await requireAdmin();
    const parsed = createUserSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { username, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return { success: false, error: "Username đã tồn tại" };
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        createdBy: admin.id,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        memberId: true,
        createdAt: true,
        member: { select: { code: true, fullName: true } },
      },
    });

    revalidatePath("/users");
    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        memberId: user.memberId,
        memberCode: user.member?.code ?? null,
        memberName: user.member?.fullName ?? null,
        createdAt: user.createdAt,
      },
    };
  } catch {
    return { success: false, error: "Không thể tạo tài khoản" };
  }
}

export async function updateUser(
  input: UpdateUserInput
): Promise<ActionResult<UserListItem>> {
  try {
    const admin = await requireAdmin();
    const parsed = updateUserSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { id, password, role, isActive, memberId } = parsed.data;

    if (id === admin.id && !isActive) {
      return {
        success: false,
        error: "Không thể vô hiệu hóa tài khoản của chính bạn",
      };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Tài khoản không tồn tại" };
    }

    const trimmedMemberId = memberId?.trim() || null;

    if (trimmedMemberId) {
      const member = await prisma.member.findUnique({
        where: { id: trimmedMemberId },
        select: { id: true },
      });
      if (!member) {
        return { success: false, error: "Thành viên liên kết không tồn tại" };
      }

      const linked = await prisma.user.findFirst({
        where: { memberId: trimmedMemberId, id: { not: id } },
        select: { username: true },
      });
      if (linked) {
        return {
          success: false,
          error: `Thành viên đã liên kết với tài khoản "${linked.username}"`,
        };
      }
    }

    const passwordTrimmed = password?.trim();
    const data: {
      role: UserRole;
      isActive: boolean;
      memberId: string | null;
      password?: string;
    } = {
      role,
      isActive,
      memberId: trimmedMemberId,
    };

    if (passwordTrimmed) {
      data.password = await bcrypt.hash(passwordTrimmed, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        memberId: true,
        createdAt: true,
        member: { select: { code: true, fullName: true } },
      },
    });

    revalidatePath("/users");
    revalidatePath(`/users/${id}/edit`);

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        memberId: user.memberId,
        memberCode: user.member?.code ?? null,
        memberName: user.member?.fullName ?? null,
        createdAt: user.createdAt,
      },
    };
  } catch {
    return { success: false, error: "Không thể cập nhật tài khoản" };
  }
}

export async function toggleUserActive(
  input: { id: string; isActive: boolean }
): Promise<ActionResult<UserListItem>> {
  try {
    const admin = await requireAdmin();
    const parsed = toggleUserActiveSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { id, isActive } = parsed.data;

    if (id === admin.id && !isActive) {
      return {
        success: false,
        error: "Không thể vô hiệu hóa tài khoản của chính bạn",
      };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Tài khoản không tồn tại" };
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        memberId: true,
        createdAt: true,
        member: { select: { code: true, fullName: true } },
      },
    });

    revalidatePath("/users");
    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        memberId: user.memberId,
        memberCode: user.member?.code ?? null,
        memberName: user.member?.fullName ?? null,
        createdAt: user.createdAt,
      },
    };
  } catch {
    return { success: false, error: "Không thể cập nhật trạng thái" };
  }
}
