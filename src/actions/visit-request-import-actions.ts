"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/user-actions";
import { generateVisitRequestCode } from "@/lib/generate-code";
import { buildExcelBase64 } from "@/lib/member-excel";
import { prisma } from "@/lib/prisma";
import { assertVisitTeamWriteAccess, requireAuthUser } from "@/lib/user-scope";
import {
  VISIT_REQUEST_IMPORT_HEADERS,
  VISIT_REQUEST_IMPORT_SAMPLE,
  validateVisitRequestImportRow,
  parseVisitRequestImportHeaders,
  type VisitRequestImportDataRow,
} from "@/lib/visit-request-import";

export type ImportRowResult = {
  row: number;
  success: boolean;
  code?: string;
  error?: string;
};

export type ImportVisitRequestsResult = {
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
};

async function loadImportContext() {
  const [households, visitTeams, members, visitRequests] = await Promise.all([
    prisma.household.findMany({ select: { id: true, code: true } }),
    prisma.visitTeam.findMany({ select: { id: true, code: true } }),
    prisma.member.findMany({ select: { id: true, code: true } }),
    prisma.visitRequest.findMany({ select: { id: true, code: true } }),
  ]);

  const householdCodeToId = new Map(
    households.map((h) => [h.code.toLowerCase(), h.id])
  );
  const visitTeamCodeToId = new Map(
    visitTeams.map((t) => [t.code.toLowerCase(), t.id])
  );
  const memberCodeToId = new Map(members.map((m) => [m.code.toLowerCase(), m.id]));
  const visitRequestCodeToId = new Map(
    visitRequests.map((v) => [v.code.toLowerCase(), v.id])
  );

  return {
    householdCodeToId,
    visitTeamCodeToId,
    memberCodeToId,
    visitRequestCodeToId,
  };
}

async function processVisitRequestImportRow(
  headers: string[],
  rowNumber: number,
  cells: string[],
  ctx: Awaited<ReturnType<typeof loadImportContext>>
): Promise<ImportRowResult> {
  const validated = validateVisitRequestImportRow(headers, cells, rowNumber);
  if (!validated.ok) {
    return { row: rowNumber, success: false, error: validated.error };
  }

  const {
    code,
    householdCode,
    visitTeamCode,
    scheduledDate,
    actualDate,
    status,
    visitType,
    representativeMemberCode,
    staffCodes,
    content,
  } = validated.data;

  const householdId = ctx.householdCodeToId.get(householdCode.toLowerCase());
  if (!householdId) {
    return {
      row: rowNumber,
      success: false,
      error: `Mã hộ "${householdCode}" không tồn tại`,
    };
  }

  const visitTeamId = ctx.visitTeamCodeToId.get(visitTeamCode.toLowerCase());
  if (!visitTeamId) {
    return {
      row: rowNumber,
      success: false,
      error: `Mã tổ thăm viếng "${visitTeamCode}" không tồn tại`,
    };
  }

  let representativeMemberId: string | null = null;
  if (representativeMemberCode) {
    representativeMemberId =
      ctx.memberCodeToId.get(representativeMemberCode.toLowerCase()) ?? null;
    if (!representativeMemberId) {
      return {
        row: rowNumber,
        success: false,
        error: `Mã tín hữu đại diện "${representativeMemberCode}" không tồn tại`,
      };
    }
  }

  let userId: string | null = null;
  try {
    const user = await assertVisitTeamWriteAccess(visitTeamId);
    userId = user.id;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không có quyền thao tác tổ thăm viếng này";
    return { row: rowNumber, success: false, error: message };
  }

  try {
    const existingId = code
      ? ctx.visitRequestCodeToId.get(code.toLowerCase())
      : undefined;

    const data = {
      householdId,
      visitTeamId,
      scheduledDate,
      actualDate,
      status,
      visitType,
      representativeMemberId,
      staffCodes,
      content,
    };

    let requestId: string;
    let requestCode: string;

    if (existingId) {
      await prisma.visitRequest.update({ where: { id: existingId }, data });
      requestId = existingId;
      requestCode = code as string;
    } else {
      requestCode = code ?? (await generateVisitRequestCode());
      const created = await prisma.visitRequest.create({
        data: { ...data, code: requestCode },
      });
      requestId = created.id;
      ctx.visitRequestCodeToId.set(requestCode.toLowerCase(), requestId);
    }

    await prisma.visitRequestHistory.create({
      data: {
        visitRequestId: requestId,
        userId,
        action: "import",
        note: "Import từ file Excel",
      },
    });

    return { row: rowNumber, success: true, code: requestCode };
  } catch {
    return {
      row: rowNumber,
      success: false,
      error: "Không thể tạo/cập nhật đơn thăm viếng",
    };
  }
}

export async function getVisitRequestImportTemplate(): Promise<
  ActionResult<{ base64: string; fileName: string }>
> {
  try {
    await requireAuthUser();
    return {
      success: true,
      data: {
        base64: buildExcelBase64(
          VISIT_REQUEST_IMPORT_HEADERS,
          VISIT_REQUEST_IMPORT_SAMPLE,
          "Mẫu import đơn thăm viếng"
        ),
        fileName: "mau-import-don-tham-vieng.xlsx",
      },
    };
  } catch {
    return { success: false, error: "Không thể tạo file mẫu" };
  }
}

export async function importVisitRequestBatch(
  rows: VisitRequestImportDataRow[],
  columnHeaders: string[],
  options?: { isLastBatch?: boolean }
): Promise<ActionResult<ImportVisitRequestsResult>> {
  try {
    await requireAuthUser();

    if (rows.length === 0) {
      return {
        success: true,
        data: { successCount: 0, errorCount: 0, results: [] },
      };
    }

    const headerResult = parseVisitRequestImportHeaders([
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
      const outcome = await processVisitRequestImportRow(
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
      revalidatePath("/visit-requests");
    } else if (successCount > 0) {
      revalidatePath("/visit-requests");
    }

    return {
      success: true,
      data: { successCount, errorCount, results },
    };
  } catch {
    return { success: false, error: "Không thể import batch đơn thăm viếng" };
  }
}
