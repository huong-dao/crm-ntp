"use server";

import type { VisitRequestStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  totalMembers: number;
  totalHouseholds: number;
  scheduledVisitsThisWeek: number;
  totalTeams: number;
};

export type RecentVisitRequest = {
  id: string;
  code: string;
  scheduledDate: Date;
  status: VisitRequestStatus;
  householdCode: string;
  householdId: string;
  visitTeamCode: string;
  visitTeamId: string;
  staffCodes: string | null;
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function getWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuth();

  const { start, end } = getWeekRange();

  const [totalMembers, totalHouseholds, scheduledVisitsThisWeek, totalTeams] =
    await prisma.$transaction([
      prisma.member.count({ where: { status: "active" } }),
      prisma.household.count(),
      prisma.visitRequest.count({
        where: {
          status: "scheduled",
          scheduledDate: { gte: start, lte: end },
        },
      }),
      prisma.visitTeam.count(),
    ]);

  return {
    totalMembers,
    totalHouseholds,
    scheduledVisitsThisWeek,
    totalTeams,
  };
}

export async function getRecentVisitRequests(
  limit = 5
): Promise<RecentVisitRequest[]> {
  await requireAuth();

  const rows = await prisma.visitRequest.findMany({
    where: { status: "scheduled" },
    orderBy: { scheduledDate: "asc" },
    take: Math.min(20, Math.max(1, limit)),
    select: {
      id: true,
      code: true,
      scheduledDate: true,
      status: true,
      staffCodes: true,
      householdId: true,
      visitTeamId: true,
      household: { select: { code: true } },
      visitTeam: { select: { code: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    scheduledDate: row.scheduledDate,
    status: row.status,
    householdCode: row.household.code,
    householdId: row.householdId,
    visitTeamCode: row.visitTeam.code,
    visitTeamId: row.visitTeamId,
    staffCodes: row.staffCodes,
  }));
}
