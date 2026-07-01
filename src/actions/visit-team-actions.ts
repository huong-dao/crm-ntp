"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus, Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { buildExcelBase64 } from "@/lib/member-excel";
import { prisma } from "@/lib/prisma";
import {
  VISIT_TEAM_IMPORT_HEADERS,
  visitTeamStaffToExportRow,
} from "@/lib/visit-team-import";
import {
  visitTeamCreateSchema,
  visitTeamUpdateSchema,
  type VisitTeamCreateInput,
  type VisitTeamUpdateInput,
} from "@/lib/validations/visit-team";

export type VisitTeamListItem = {
  id: string;
  code: string;
  area: string;
  leaderName: string | null;
  memberCount: number;
  householdCount: number;
};

export type VisitTeamsResult = {
  teams: VisitTeamListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type VisitTeamFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type LeaderMemberOption = {
  id: string;
  code: string;
  fullName: string;
};

export type VisitTeamMemberItem = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  mobile1: string | null;
  householdCode: string | null;
  isLeader: boolean;
};

export type VisitTeamDetail = {
  id: string;
  code: string;
  area: string;
  leaderMemberId: string | null;
  leaderName: string | null;
  memberCount: number;
  householdCount: number;
  visitRequestCount: number;
  members: VisitTeamMemberItem[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function buildHouseholdCountMap(
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

export async function getLeaderMemberOptions(): Promise<LeaderMemberOption[]> {
  await requireAuth();

  return prisma.member.findMany({
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
}

export async function getVisitTeams(
  filters: VisitTeamFilters = {}
): Promise<VisitTeamsResult> {
  await requireAuth();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = filters.search?.trim();

  const where: Prisma.VisitTeamWhereInput = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { area: { contains: search } },
    ];
  }

  const [rows, total, teamMembers] = await prisma.$transaction([
    prisma.visitTeam.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        area: true,
        leaderMemberId: true,
        _count: { select: { staffMembers: true } },
      },
    }),
    prisma.visitTeam.count({ where }),
    prisma.member.findMany({
      where: { visitTeamId: { not: null }, householdId: { not: null } },
      select: { visitTeamId: true, householdId: true },
    }),
  ]);

  const householdCountMap = buildHouseholdCountMap(teamMembers);

  const leaderIds = rows
    .map((row) => row.leaderMemberId)
    .filter((id): id is string => id !== null);

  const leaderById = new Map<string, string>();
  if (leaderIds.length > 0) {
    const leaders = await prisma.member.findMany({
      where: { id: { in: leaderIds } },
      select: { id: true, fullName: true },
    });
    for (const leader of leaders) {
      leaderById.set(leader.id, leader.fullName);
    }
  }

  const teams: VisitTeamListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    area: row.area,
    leaderName: row.leaderMemberId
      ? leaderById.get(row.leaderMemberId) ?? null
      : null,
    memberCount: row._count.staffMembers,
    householdCount: householdCountMap.get(row.id)?.size ?? 0,
  }));

  return {
    teams,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVisitTeamById(
  id: string
): Promise<VisitTeamDetail | null> {
  await requireAuth();

  const team = await prisma.visitTeam.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      area: true,
      leaderMemberId: true,
      staffMembers: {
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          code: true,
          fullName: true,
          status: true,
          mobile1: true,
          household: { select: { code: true } },
        },
      },
      _count: { select: { staffMembers: true, visitRequests: true } },
    },
  });

  if (!team) return null;

  const householdIds = new Set<string>();
  const memberRows = await prisma.member.findMany({
    where: { visitTeamId: id, householdId: { not: null } },
    select: { householdId: true },
  });
  for (const row of memberRows) {
    if (row.householdId) householdIds.add(row.householdId);
  }

  let leaderName: string | null = null;
  if (team.leaderMemberId) {
    const leader = team.staffMembers.find((m) => m.id === team.leaderMemberId);
    if (leader) {
      leaderName = leader.fullName;
    } else {
      const leaderRow = await prisma.member.findUnique({
        where: { id: team.leaderMemberId },
        select: { fullName: true },
      });
      leaderName = leaderRow?.fullName ?? null;
    }
  }

  const members: VisitTeamMemberItem[] = team.staffMembers.map((member) => ({
    id: member.id,
    code: member.code,
    fullName: member.fullName,
    status: member.status,
    mobile1: member.mobile1,
    householdCode: member.household?.code ?? null,
    isLeader: member.id === team.leaderMemberId,
  }));

  return {
    id: team.id,
    code: team.code,
    area: team.area,
    leaderMemberId: team.leaderMemberId,
    leaderName,
    memberCount: team._count.staffMembers,
    householdCount: householdIds.size,
    visitRequestCount: team._count.visitRequests,
    members,
  };
}

export async function getAssignableMemberOptions(
  teamId: string
): Promise<LeaderMemberOption[]> {
  await requireAuth();

  return prisma.member.findMany({
    where: {
      OR: [{ visitStaffTeamId: null }, { visitStaffTeamId: { not: teamId } }],
    },
    select: { id: true, code: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
}

export async function syncLeaderToTeam(
  teamId: string,
  leaderMemberId: string | null
) {
  if (!leaderMemberId) return;

  await prisma.member.update({
    where: { id: leaderMemberId },
    data: { visitStaffTeamId: teamId },
  });
}

export async function assignMembersToVisitTeam(
  teamId: string,
  memberIds: string[]
): Promise<ActionResult<{ assigned: number }>> {
  try {
    await requireAuth();

    if (memberIds.length === 0) {
      return { success: false, error: "Chọn ít nhất một thành viên" };
    }

    const team = await prisma.visitTeam.findUnique({
      where: { id: teamId },
      select: { id: true },
    });
    if (!team) {
      return { success: false, error: "Tổ thăm viếng không tồn tại" };
    }

    const uniqueIds = [...new Set(memberIds)];
    const members = await prisma.member.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (members.length !== uniqueIds.length) {
      return { success: false, error: "Một hoặc nhiều thành viên không tồn tại" };
    }

    await prisma.member.updateMany({
      where: { id: { in: uniqueIds } },
      data: { visitStaffTeamId: teamId },
    });

    revalidatePath("/visit-teams");
    revalidatePath(`/visit-teams/${teamId}`);
    revalidatePath("/members");

    return { success: true, data: { assigned: uniqueIds.length } };
  } catch {
    return { success: false, error: "Không thể gán thành viên vào tổ" };
  }
}

export async function removeMemberFromVisitTeam(
  memberId: string
): Promise<ActionResult> {
  try {
    await requireAuth();

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, visitStaffTeamId: true },
    });

    if (!member) {
      return { success: false, error: "Thành viên không tồn tại" };
    }

    if (!member.visitStaffTeamId) {
      return { success: false, error: "Thành viên chưa được gán vào nhân sự tổ" };
    }

    const teamId = member.visitStaffTeamId;

    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: memberId },
        data: { visitStaffTeamId: null },
      });

      await tx.visitTeam.updateMany({
        where: { id: teamId, leaderMemberId: memberId },
        data: { leaderMemberId: null },
      });
    });

    revalidatePath("/visit-teams");
    revalidatePath(`/visit-teams/${teamId}`);
    revalidatePath("/members");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể bỏ gán thành viên" };
  }
}

export async function createVisitTeam(
  input: VisitTeamCreateInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = visitTeamCreateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const { code, area, leaderMemberId } = parsed.data;

    const codeTaken = await prisma.visitTeam.findUnique({
      where: { code },
      select: { id: true },
    });
    if (codeTaken) {
      return { success: false, error: "Mã tổ đã tồn tại" };
    }

    if (leaderMemberId) {
      const leader = await prisma.member.findUnique({
        where: { id: leaderMemberId },
        select: { id: true },
      });
      if (!leader) {
        return { success: false, error: "Trưởng tổ không tồn tại" };
      }
    }

    const team = await prisma.visitTeam.create({
      data: {
        code,
        area,
        leaderMemberId: leaderMemberId ?? null,
      },
      select: { id: true, code: true },
    });

    if (leaderMemberId) {
      await syncLeaderToTeam(team.id, leaderMemberId);
    }

    revalidatePath("/visit-teams");
    return { success: true, data: team };
  } catch {
    return { success: false, error: "Không thể tạo tổ thăm viếng" };
  }
}

export async function updateVisitTeam(
  id: string,
  input: VisitTeamUpdateInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = visitTeamUpdateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const existing = await prisma.visitTeam.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Tổ thăm viếng không tồn tại" };
    }

    const { area, leaderMemberId } = parsed.data;

    if (leaderMemberId) {
      const leader = await prisma.member.findUnique({
        where: { id: leaderMemberId },
        select: { id: true },
      });
      if (!leader) {
        return { success: false, error: "Trưởng tổ không tồn tại" };
      }
    }

    const team = await prisma.visitTeam.update({
      where: { id },
      data: {
        area,
        leaderMemberId: leaderMemberId ?? null,
      },
      select: { id: true, code: true },
    });

    if (leaderMemberId) {
      await syncLeaderToTeam(id, leaderMemberId);
    }

    revalidatePath("/visit-teams");
    revalidatePath(`/visit-teams/${id}`);
    return { success: true, data: team };
  } catch {
    return { success: false, error: "Không thể cập nhật tổ thăm viếng" };
  }
}

export async function deleteVisitTeam(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    const team = await prisma.visitTeam.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staffMembers: true,
            assignedMembers: true,
            visitRequests: true,
          },
        },
      },
    });

    if (!team) {
      return { success: false, error: "Tổ thăm viếng không tồn tại" };
    }

    if (team._count.staffMembers > 0) {
      return {
        success: false,
        error: "Không thể xóa tổ còn nhân sự thăm viếng",
      };
    }

    if (team._count.assignedMembers > 0) {
      return {
        success: false,
        error: "Không thể xóa tổ còn tín hữu được phụ trách",
      };
    }

    if (team._count.visitRequests > 0) {
      return {
        success: false,
        error: "Không thể xóa tổ còn đơn thăm viếng",
      };
    }

    await prisma.visitTeam.delete({ where: { id } });
    revalidatePath("/visit-teams");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể xóa tổ thăm viếng" };
  }
}

export async function exportVisitTeams(
  filters: VisitTeamFilters = {}
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    await requireAuth();

    const search = filters.search?.trim();
    const where: Prisma.VisitTeamWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { area: { contains: search } },
      ];
    }

    const teams = await prisma.visitTeam.findMany({
      where,
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        area: true,
        leaderMemberId: true,
      },
    });

    const teamIds = teams.map((team) => team.id);
    const staffRows =
      teamIds.length > 0
        ? await prisma.member.findMany({
            where: { visitStaffTeamId: { in: teamIds } },
            select: {
              code: true,
              visitStaffTeamId: true,
            },
            orderBy: [{ visitStaffTeamId: "asc" }, { code: "asc" }],
          })
        : [];

    const leaderIds = teams
      .map((team) => team.leaderMemberId)
      .filter((id): id is string => id != null);

    const leaders =
      leaderIds.length > 0
        ? await prisma.member.findMany({
            where: { id: { in: leaderIds } },
            select: { id: true, code: true },
          })
        : [];

    const leaderCodeById = new Map(
      leaders.map((leader) => [leader.id, leader.code])
    );

    const areaByTeamId = new Map(teams.map((team) => [team.id, team.area]));
    const codeByTeamId = new Map(teams.map((team) => [team.id, team.code]));
    const leaderIdByTeamId = new Map(
      teams.map((team) => [team.id, team.leaderMemberId])
    );

    const rows = staffRows.map((staff) => {
      const teamId = staff.visitStaffTeamId!;
      const leaderId = leaderIdByTeamId.get(teamId) ?? null;
      return visitTeamStaffToExportRow({
        teamCode: codeByTeamId.get(teamId) ?? "",
        staffMemberCode: staff.code,
        leaderMemberCode:
          leaderId && leaderCodeById.get(leaderId) === staff.code
            ? staff.code
            : null,
        area: areaByTeamId.get(teamId) ?? "",
      });
    });

    const date = new Date().toISOString().slice(0, 10);
    const base64 = buildExcelBase64(
      VISIT_TEAM_IMPORT_HEADERS,
      rows,
      "Tổ thăm viếng"
    );

    return {
      success: true,
      data: { base64, fileName: `to-tham-vieng-${date}.xlsx` },
    };
  } catch {
    return { success: false, error: "Không thể xuất file Excel" };
  }
}
