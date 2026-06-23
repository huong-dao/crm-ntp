"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  toggleUserActiveSchema,
} from "@/lib/validations/user";

export type UserListItem = {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
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

  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
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
        createdAt: true,
      },
    });

    revalidatePath("/users");
    return { success: true, data: user };
  } catch {
    return { success: false, error: "Không thể tạo tài khoản" };
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
        createdAt: true,
      },
    });

    revalidatePath("/users");
    return { success: true, data: user };
  } catch {
    return { success: false, error: "Không thể cập nhật trạng thái" };
  }
}
