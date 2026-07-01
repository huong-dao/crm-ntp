"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/user-actions";
import { syncLeaderToTeam } from "@/actions/visit-team-actions";
import { auth } from "@/lib/auth";
import { buildExcelBase64 } from "@/lib/member-excel";
import { prisma } from "@/lib/prisma";
import {
  VISIT_TEAM_IMPORT_HEADERS,
  VISIT_TEAM_IMPORT_SAMPLE,
  validateVisitTeamImportRow,
  parseVisitTeamImportHeaders,
  type VisitTeamImportDataRow,
} from "@/lib/visit-team-import";

export type ImportRowResult = {
  row: number;
  success: boolean;
  code?: string;
  error?: string;
};

export type ImportVisitTeamsResult = {
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function loadImportContext() {
  const [teams, members] = await Promise.all([
    prisma.visitTeam.findMany({ select: { id: true, code: true } }),
    prisma.member.findMany({ select: { id: true, code: true } }),
  ]);

  const teamCodeToId = new Map<string, string>();
  for (const t of teams) {
    teamCodeToId.set(t.code.toLowerCase(), t.id);
  }

  const memberCodeToId = new Map<string, string>();
  for (const m of members) {
    memberCodeToId.set(m.code.toLowerCase(), m.id);
  }

  return { teamCodeToId, memberCodeToId };
}

async function processVisitTeamImportRow(
  headers: string[],
  rowNumber: number,
  cells: string[],
  ctx: Awaited<ReturnType<typeof loadImportContext>>
): Promise<ImportRowResult> {
  const validated = validateVisitTeamImportRow(headers, cells, rowNumber);
  if (!validated.ok) {
    return { row: rowNumber, success: false, error: validated.error };
  }

  const { teamCode, staffMemberCode, leaderMemberCode, area } = validated.data;

  const staffMemberId =
    ctx.memberCodeToId.get(staffMemberCode.toLowerCase()) ?? null;
  if (!staffMemberId) {
    return {
      row: rowNumber,
      success: false,
      error: `Mã tín hữu "${staffMemberCode}" không tồn tại`,
    };
  }

  let leaderMemberId: string | null = null;
  if (leaderMemberCode) {
    leaderMemberId =
      ctx.memberCodeToId.get(leaderMemberCode.toLowerCase()) ?? null;
    if (!leaderMemberId) {
      return {
        row: rowNumber,
        success: false,
        error: `Mã tổ trưởng "${leaderMemberCode}" không tồn tại`,
      };
    }
  }

  try {
    const existingId = ctx.teamCodeToId.get(teamCode.toLowerCase());

    let teamId: string;
    if (existingId) {
      await prisma.visitTeam.update({
        where: { id: existingId },
        data: {
          area,
          ...(leaderMemberId ? { leaderMemberId } : {}),
        },
      });
      teamId = existingId;
    } else {
      const created = await prisma.visitTeam.create({
        data: {
          code: teamCode,
          area,
          leaderMemberId,
        },
      });
      teamId = created.id;
      ctx.teamCodeToId.set(teamCode.toLowerCase(), teamId);
    }

    await prisma.member.update({
      where: { id: staffMemberId },
      data: { visitStaffTeamId: teamId },
    });

    if (leaderMemberId) {
      await syncLeaderToTeam(teamId, leaderMemberId);
    }

    return { row: rowNumber, success: true, code: teamCode };
  } catch {
    return {
      row: rowNumber,
      success: false,
      error: "Không thể tạo/cập nhật tổ thăm viếng",
    };
  }
}

export async function getVisitTeamImportTemplate(): Promise<
  ActionResult<{ base64: string; fileName: string }>
> {
  try {
    await requireAuth();
    return {
      success: true,
      data: {
        base64: buildExcelBase64(
          VISIT_TEAM_IMPORT_HEADERS,
          VISIT_TEAM_IMPORT_SAMPLE,
          "Mẫu import tổ"
        ),
        fileName: "mau-import-to-tham-vieng.xlsx",
      },
    };
  } catch {
    return { success: false, error: "Không thể tạo file mẫu" };
  }
}

export async function importVisitTeamBatch(
  rows: VisitTeamImportDataRow[],
  columnHeaders: string[],
  options?: { isLastBatch?: boolean }
): Promise<ActionResult<ImportVisitTeamsResult>> {
  try {
    await requireAuth();

    if (rows.length === 0) {
      return {
        success: true,
        data: { successCount: 0, errorCount: 0, results: [] },
      };
    }

    const headerResult = parseVisitTeamImportHeaders([
      columnHeaders,
      rows[0].cells,
    ]);
    if (!headerResult.ok) {
      return { success: false, error: headerResult.error };
    }
    const headers = headerResult.headers;

    const ctx = await loadImportContext();
    const results: ImportRowResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const { rowNumber, cells } of rows) {
      const outcome = await processVisitTeamImportRow(
        headers,
        rowNumber,
        cells,
        ctx
      );
      results.push(outcome);
      if (outcome.success) successCount++;
      else errorCount++;
    }

    if (options?.isLastBatch && successCount > 0) {
      revalidatePath("/visit-teams");
      revalidatePath("/members");
    } else if (successCount > 0) {
      revalidatePath("/visit-teams");
      revalidatePath("/members");
    }

    return {
      success: true,
      data: { successCount, errorCount, results },
    };
  } catch {
    return { success: false, error: "Không thể import batch tổ thăm viếng" };
  }
}
