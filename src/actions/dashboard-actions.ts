"use server";

import type { VisitRequestStatus, VisitRequestType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildVisitRequestTeamScopeWhere,
  getAuthUserRecord,
} from "@/lib/user-scope";

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
  visitType: VisitRequestType;
  householdCode: string;
  householdId: string;
  householdHeadName: string | null;
  visitTeamCode: string;
  visitTeamId: string;
  staffNames: string[];
};

export type VisitTeamSuccessStat = {
  id: string;
  code: string;
  area: string;
  totalRequests: number;
  completedRequests: number;
  totalHouseholds: number;
  visitedHouseholdCount: number;
};

export type CalendarVisitEvent = {
  id: string;
  code: string;
  scheduledDate: Date;
  status: VisitRequestStatus;
  visitType: VisitRequestType;
  householdCode: string;
  householdId: string;
  householdHeadName: string | null;
  visitTeamCode: string;
  staffNames: string[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function resolveStaffNames(
  representativeName: string | null,
  staffCodes: string | null
): Promise<string[]> {
  const additionalCodes = staffCodes
    ? staffCodes.split(/[,;]/).map((code) => code.trim()).filter(Boolean)
    : [];

  let additionalStaffNames: string[] = [];
  if (additionalCodes.length > 0) {
    const members = await prisma.member.findMany({
      where: { code: { in: additionalCodes } },
      select: { code: true, fullName: true },
    });
    const nameByCode = new Map(
      members.map((member) => [member.code.toLowerCase(), member.fullName])
    );
    additionalStaffNames = additionalCodes.map(
      (code) => nameByCode.get(code.toLowerCase()) ?? code
    );
  }

  return [representativeName, ...additionalStaffNames].filter(
    (name): name is string => Boolean(name)
  );
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

  const user = await getAuthUserRecord();
  const teamScope = user ? buildVisitRequestTeamScopeWhere(user) : undefined;

  const where = {
    status: "scheduled" as const,
    ...(teamScope ? { visitTeamId: teamScope.visitTeamId } : {}),
  };

  const rows = await prisma.visitRequest.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    take: Math.min(20, Math.max(1, limit)),
    select: {
      id: true,
      code: true,
      scheduledDate: true,
      status: true,
      visitType: true,
      staffCodes: true,
      householdId: true,
      visitTeamId: true,
      household: {
        select: {
          code: true,
          members: {
            where: { isHead: true },
            select: { fullName: true },
            take: 1,
          },
        },
      },
      visitTeam: { select: { code: true } },
      representativeMember: { select: { fullName: true } },
    },
  });

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      code: row.code,
      scheduledDate: row.scheduledDate,
      status: row.status,
      visitType: row.visitType,
      householdCode: row.household.code,
      householdId: row.householdId,
      householdHeadName: row.household.members[0]?.fullName ?? null,
      visitTeamCode: row.visitTeam.code,
      visitTeamId: row.visitTeamId,
      staffNames: await resolveStaffNames(
        row.representativeMember?.fullName ?? null,
        row.staffCodes
      ),
    }))
  );
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

  const [teams, teamMembers, visitRequests] = await prisma.$transaction([
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
    prisma.member.findMany({
      where: { visitTeamId: { not: null }, householdId: { not: null } },
      select: { visitTeamId: true, householdId: true },
    }),
    prisma.visitRequest.findMany({
      select: { visitTeamId: true, status: true, householdId: true },
    }),
  ]);

  const householdCountMap = buildTeamHouseholdCountMap(teamMembers);

  const totalRequestsMap = new Map<string, number>();
  const completedRequestsMap = new Map<string, number>();
  const visitedHouseholdMap = new Map<string, Set<string>>();

  for (const visit of visitRequests) {
    totalRequestsMap.set(
      visit.visitTeamId,
      (totalRequestsMap.get(visit.visitTeamId) ?? 0) + 1
    );

    if (visit.status === "completed") {
      completedRequestsMap.set(
        visit.visitTeamId,
        (completedRequestsMap.get(visit.visitTeamId) ?? 0) + 1
      );

      const visited =
        visitedHouseholdMap.get(visit.visitTeamId) ?? new Set<string>();
      visited.add(visit.householdId);
      visitedHouseholdMap.set(visit.visitTeamId, visited);
    }
  }

  return teams.map((team) => ({
    id: team.id,
    code: team.code,
    area: team.area,
    totalRequests: totalRequestsMap.get(team.id) ?? 0,
    completedRequests: completedRequestsMap.get(team.id) ?? 0,
    totalHouseholds: householdCountMap.get(team.id)?.size ?? 0,
    visitedHouseholdCount: visitedHouseholdMap.get(team.id)?.size ?? 0,
  }));
}

export async function getCalendarVisitRequests(
  year: number,
  month: number
): Promise<CalendarVisitEvent[]> {
  await requireAuth();

  const user = await getAuthUserRecord();
  const teamScope = user ? buildVisitRequestTeamScopeWhere(user) : undefined;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const where = {
    scheduledDate: { gte: start, lte: end },
    ...(teamScope ? { visitTeamId: teamScope.visitTeamId } : {}),
  };

  const rows = await prisma.visitRequest.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    select: {
      id: true,
      code: true,
      scheduledDate: true,
      status: true,
      visitType: true,
      staffCodes: true,
      householdId: true,
      household: {
        select: {
          code: true,
          members: {
            where: { isHead: true },
            select: { fullName: true },
            take: 1,
          },
        },
      },
      visitTeam: { select: { code: true } },
      representativeMember: { select: { fullName: true } },
    },
  });

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      code: row.code,
      scheduledDate: row.scheduledDate,
      status: row.status,
      visitType: row.visitType,
      householdCode: row.household.code,
      householdId: row.householdId,
      householdHeadName: row.household.members[0]?.fullName ?? null,
      visitTeamCode: row.visitTeam.code,
      staffNames: await resolveStaffNames(
        row.representativeMember?.fullName ?? null,
        row.staffCodes
      ),
    }))
  );
}
