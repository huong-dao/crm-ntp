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

export type VisitTeamSuccessStat = {
  id: string;
  code: string;
  area: string;
  totalHouseholds: number;
  completedVisitCount: number;
  visitedHouseholdCount: number;
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

function buildTeamHouseholdCountMap(
  members: { visitTeamId: string | null; householdId: string | null }[]
) {
  const map = new Map<string, Set<string>>();

  for (const member of members) {
    if (!member.visitTeamId || !member.householdId) continue;
    const set = map.get(member.visitTeamId) ?? new Set<string>();
    set.add(member.householdId);
    map.set(member.visitTeamId, set);
  }

  return map;
}

export async function getVisitTeamSuccessStats(): Promise<
  VisitTeamSuccessStat[]
> {
  await requireAuth();

  const [teams, teamMembers, completedVisits] = await prisma.$transaction([
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
    prisma.member.findMany({
      where: { visitTeamId: { not: null }, householdId: { not: null } },
      select: { visitTeamId: true, householdId: true },
    }),
    prisma.visitRequest.findMany({
      where: { status: "completed" },
      select: { visitTeamId: true, householdId: true },
    }),
  ]);

  const householdCountMap = buildTeamHouseholdCountMap(teamMembers);

  const completedCountMap = new Map<string, number>();
  const visitedHouseholdMap = new Map<string, Set<string>>();

  for (const visit of completedVisits) {
    completedCountMap.set(
      visit.visitTeamId,
      (completedCountMap.get(visit.visitTeamId) ?? 0) + 1
    );

    const visited = visitedHouseholdMap.get(visit.visitTeamId) ?? new Set<string>();
    visited.add(visit.householdId);
    visitedHouseholdMap.set(visit.visitTeamId, visited);
  }

  return teams.map((team) => ({
    id: team.id,
    code: team.code,
    area: team.area,
    totalHouseholds: householdCountMap.get(team.id)?.size ?? 0,
    completedVisitCount: completedCountMap.get(team.id) ?? 0,
    visitedHouseholdCount: visitedHouseholdMap.get(team.id)?.size ?? 0,
  }));
}
