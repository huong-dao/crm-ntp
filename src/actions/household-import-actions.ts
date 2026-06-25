"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/user-actions";
import { applyHouseholdHead } from "@/actions/household-actions";
import { auth } from "@/lib/auth";
import { buildExcelBase64 } from "@/lib/member-excel";
import {
  HOUSEHOLD_IMPORT_HEADERS,
  HOUSEHOLD_IMPORT_SAMPLE,
  validateHouseholdImportRow,
  parseHouseholdImportHeaders,
  type HouseholdImportDataRow,
} from "@/lib/household-import";
import { prisma } from "@/lib/prisma";

export type ImportRowResult = {
  row: number;
  success: boolean;
  code?: string;
  error?: string;
};

export type ImportHouseholdsResult = {
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
  const [households, members] = await Promise.all([
    prisma.household.findMany({ select: { id: true, code: true } }),
    prisma.member.findMany({
      select: { id: true, code: true, householdId: true },
    }),
  ]);

  const householdCodeToId = new Map<string, string>();
  for (const h of households) {
    householdCodeToId.set(h.code.toLowerCase(), h.id);
  }

  const memberCodeToMember = new Map<
    string,
    { id: string; householdId: string | null }
  >();
  for (const m of members) {
    memberCodeToMember.set(m.code.toLowerCase(), {
      id: m.id,
      householdId: m.householdId,
    });
  }

  return { householdCodeToId, memberCodeToMember };
}

async function processHouseholdImportRow(
  headers: string[],
  rowNumber: number,
  cells: string[],
  ctx: Awaited<ReturnType<typeof loadImportContext>>
): Promise<ImportRowResult> {
  const validated = validateHouseholdImportRow(headers, cells, rowNumber);
  if (!validated.ok) {
    return { row: rowNumber, success: false, error: validated.error };
  }

  const { householdCode, headMemberCode } = validated.data;

  let householdId = ctx.householdCodeToId.get(householdCode.toLowerCase());

  try {
    if (!householdId) {
      const created = await prisma.household.create({
        data: { code: householdCode },
      });
      householdId = created.id;
      ctx.householdCodeToId.set(householdCode.toLowerCase(), householdId);
    }

    if (!headMemberCode) {
      return { row: rowNumber, success: true, code: householdCode };
    }

    const member = ctx.memberCodeToMember.get(headMemberCode.toLowerCase());
    if (!member) {
      return {
        row: rowNumber,
        success: false,
        error: `Mã tín hữu "${headMemberCode}" không tồn tại`,
      };
    }

    if (member.householdId && member.householdId !== householdId) {
      return {
        row: rowNumber,
        success: false,
        error: `Thành viên "${headMemberCode}" đã thuộc hộ khác`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await applyHouseholdHead(tx, householdId!, member.id);
    });

    member.householdId = householdId;

    return { row: rowNumber, success: true, code: householdCode };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể import hộ";
    return { row: rowNumber, success: false, error: message };
  }
}

export async function getHouseholdImportTemplate(): Promise<
  ActionResult<{ base64: string; fileName: string }>
> {
  try {
    await requireAuth();
    return {
      success: true,
      data: {
        base64: buildExcelBase64(
          HOUSEHOLD_IMPORT_HEADERS,
          HOUSEHOLD_IMPORT_SAMPLE,
          "Mẫu import hộ"
        ),
        fileName: "mau-import-ho-gia-dinh.xlsx",
      },
    };
  } catch {
    return { success: false, error: "Không thể tạo file mẫu" };
  }
}

export async function importHouseholdBatch(
  rows: HouseholdImportDataRow[],
  columnHeaders: string[],
  options?: { isLastBatch?: boolean }
): Promise<ActionResult<ImportHouseholdsResult>> {
  try {
    await requireAuth();

    if (rows.length === 0) {
      return {
        success: true,
        data: { successCount: 0, errorCount: 0, results: [] },
      };
    }

    const headerResult = parseHouseholdImportHeaders([
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
      const outcome = await processHouseholdImportRow(
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
      revalidatePath("/households");
      revalidatePath("/members");
    } else if (successCount > 0) {
      revalidatePath("/households");
      revalidatePath("/members");
    }

    return {
      success: true,
      data: { successCount, errorCount, results },
    };
  } catch {
    return { success: false, error: "Không thể import batch hộ gia đình" };
  }
}
