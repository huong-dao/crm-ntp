"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthUserRecord = {
  id: string;
  username: string;
  role: "admin" | "user";
  memberId: string | null;
  visitStaffTeamId: string | null;
  memberVisitTeamId: string | null;
  isVisitTeamLeader: boolean;
};

export async function getAuthUserRecord(): Promise<AuthUserRecord | null> {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      role: true,
      memberId: true,
      member: {
        select: {
          visitStaffTeamId: true,
          visitTeamId: true,
        },
      },
    },
  });

  if (!user) return null;

  let isVisitTeamLeader = false;
  if (user.memberId) {
    const leaderTeam = await prisma.visitTeam.findFirst({
      where: { leaderMemberId: user.memberId },
      select: { id: true },
    });
    isVisitTeamLeader = Boolean(leaderTeam);
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    memberId: user.memberId,
    visitStaffTeamId: user.member?.visitStaffTeamId ?? null,
    memberVisitTeamId: user.member?.visitTeamId ?? null,
    isVisitTeamLeader,
  };
}

export async function requireAuthUser(): Promise<AuthUserRecord> {
  const user = await getAuthUserRecord();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export function isAdmin(user: AuthUserRecord): boolean {
  return user.role === "admin";
}

/** Team used for visit-request write access and household scoping. */
export function getUserVisitStaffTeamId(user: AuthUserRecord): string | null {
  return user.visitStaffTeamId;
}

/** Team used to scope assigned households/members for non-admin users. */
export function getUserDataTeamId(user: AuthUserRecord): string | null {
  return user.visitStaffTeamId ?? user.memberVisitTeamId;
}

export function canCreateVisitRequest(user: AuthUserRecord): boolean {
  if (isAdmin(user)) return true;
  return Boolean(user.visitStaffTeamId);
}

export async function assertVisitTeamWriteAccess(
  visitTeamId: string
): Promise<AuthUserRecord> {
  const user = await requireAuthUser();

  if (isAdmin(user)) return user;

  const lockedTeamId = user.visitStaffTeamId;
  if (!lockedTeamId || lockedTeamId !== visitTeamId) {
    throw new Error("Không có quyền thao tác tổ thăm viếng này");
  }

  return user;
}

export async function assertVisitTeamEditAccess(
  visitTeamId: string
): Promise<AuthUserRecord> {
  const user = await requireAuthUser();

  if (isAdmin(user)) return user;

  const team = await prisma.visitTeam.findUnique({
    where: { id: visitTeamId },
    select: { leaderMemberId: true },
  });

  if (!team?.leaderMemberId || team.leaderMemberId !== user.memberId) {
    throw new Error("Chỉ tổ trưởng hoặc admin mới được sửa tổ thăm viếng");
  }

  return user;
}

export function buildVisitTeamScopeWhere(
  user: AuthUserRecord
): { visitTeamId: string } | undefined {
  if (isAdmin(user)) return undefined;
  const teamId = getUserDataTeamId(user);
  if (!teamId) return { visitTeamId: "__none__" };
  return { visitTeamId: teamId };
}

export function buildVisitRequestTeamScopeWhere(
  user: AuthUserRecord
): { visitTeamId: string } | undefined {
  if (isAdmin(user)) return undefined;
  const teamId = user.visitStaffTeamId;
  if (!teamId) return { visitTeamId: "__none__" };
  return { visitTeamId: teamId };
}

export function buildHouseholdTeamScopeWhere(
  user: AuthUserRecord
): { members: { some: { visitTeamId: string } } } | undefined {
  if (isAdmin(user)) return undefined;
  const teamId = getUserDataTeamId(user);
  if (!teamId) {
    return { members: { some: { visitTeamId: "__none__" } } };
  }
  return { members: { some: { visitTeamId: teamId } } };
}
