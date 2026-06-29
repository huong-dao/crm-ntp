"use server";

import { revalidatePath } from "next/cache";
import type { MemberImportRowStatus, Prisma } from "@prisma/client";
import { resolveDepartmentIdByName } from "@/actions/department-actions";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { generateMemberCode } from "@/lib/generate-code";
import {
  buildExcelBase64,
  buildMemberImportTemplateBase64,
  parseSpreadsheetToRows,
} from "@/lib/member-excel";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import {
  extractImportDataRows,
  mapCsvHeaders,
  parseImportHeaders,
  rowToImportData,
  validateImportRow,
  type ImportRowValid,
  type ImportDataRow,
} from "@/lib/member-import";
import {
  buildMemberWriteData,
  applyHeadOfHousehold,
} from "@/lib/member-write";
import { prisma } from "@/lib/prisma";
import {
  memberFormSchema,
  type MemberFormInput,
} from "@/lib/validations/member";

export type ImportRowResult = {
  row: number;
  success: boolean;
  code?: string;
  error?: string;
};

export type ImportMembersResult = {
  logId: string;
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
};

export type ImportBatchResult = {
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
};

export type MemberImportLogListItem = {
  id: string;
  fileName: string;
  uploadedByName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
};

export type MemberImportLogRowItem = {
  id: string;
  rowNumber: number;
  status: MemberImportRowStatus;
  memberCode: string | null;
  error: string | null;
  retriedAt: string | null;
};

export type MemberImportLogDetail = {
  id: string;
  fileName: string;
  uploadedByName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  rows: MemberImportLogRowItem[];
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function ensureHouseholdByCode(
  code: string,
  householdCodeToId: Map<string, string>
): Promise<string> {
  const key = code.toLowerCase();
  const existing = householdCodeToId.get(key);
  if (existing) return existing;

  const created = await prisma.household.create({
    data: { code: code.trim() },
  });
  householdCodeToId.set(key, created.id);
  return created.id;
}

async function createMemberFromImport(
  row: ImportRowValid,
  householdId: string,
  visitTeamId: string | null
): Promise<ActionResult<{ id: string; code: string }>> {
  const code = row.memberCode?.trim() || (await generateMemberCode());

  const [ageDepartmentId, actualDepartmentId] = await Promise.all([
    resolveDepartmentIdByName(row.ageDepartment),
    resolveDepartmentIdByName(row.actualDepartment),
  ]);

  const formInput: MemberFormInput = {
    status: row.status,
    firstName: row.firstName,
    lastName: row.lastName,
    gender: row.gender,
    birthYear: row.birthYear ?? undefined,
    occupation: row.occupation,
    houseNumber: row.houseNumber,
    street: row.street,
    oldWard: row.oldWard,
    oldDistrict: row.oldDistrict,
    oldProvince: row.oldProvince,
    newWard: row.newWard,
    newProvince: row.newProvince,
    mobile1: row.mobile1,
    mobile2: row.mobile2,
    landline: row.landline,
    householdId,
    createNewHousehold: false,
    isHead: row.isHead,
    relationship: row.relationship,
    isBaptized: row.isBaptized,
    baptismYear: row.baptismYear ?? undefined,
    ageDepartmentId,
    actualDepartmentId,
    boardServiceDate: row.boardServiceDate,
    visitDepartment: row.visitDepartment,
    visitTeamId,
    notes: row.notes,
  };

  const parsed = memberFormSchema.safeParse(formInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const built = buildMemberWriteData(parsed.data, code);
  if (!built.ok) {
    return { success: false, error: built.error };
  }

  try {
    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.member.create({
        data: { ...built.data, householdId },
      });
      await applyHeadOfHousehold(
        tx,
        householdId,
        created.id,
        parsed.data.isHead
      );
      return created;
    });
    return { success: true, data: { id: member.id, code: member.code } };
  } catch {
    return { success: false, error: "Không thể tạo thành viên" };
  }
}

type ProcessRowInput = {
  rowNumber: number;
  cells: string[];
  headers: string[];
  householdCodeToId: Map<string, string>;
  teamCodeToId: Map<string, string>;
  visitTeamCodes: Set<string>;
  knownMemberCodes: Set<string>;
};

async function processImportRow(
  input: ProcessRowInput
): Promise<{
  success: boolean;
  code?: string;
  memberId?: string;
  error?: string;
  householdsCreated: number;
}> {
  const {
    rowNumber,
    cells,
    headers,
    householdCodeToId,
    teamCodeToId,
    visitTeamCodes,
    knownMemberCodes,
  } = input;

  const importRow = rowToImportData(headers, cells, rowNumber);
  const validated = validateImportRow(
    importRow,
    visitTeamCodes,
    knownMemberCodes
  );

  if (!validated.ok) {
    return { success: false, error: validated.error, householdsCreated: 0 };
  }

  const row = validated.data;
  const householdKey = row.householdCode.toLowerCase();
  const hadHousehold = householdCodeToId.has(householdKey);
  let householdsCreated = 0;

  let householdId: string;
  try {
    householdId = await ensureHouseholdByCode(
      row.householdCode,
      householdCodeToId
    );
  } catch {
    return {
      success: false,
      error: `Không thể tạo hộ "${row.householdCode}"`,
      householdsCreated: 0,
    };
  }

  if (!hadHousehold) {
    householdsCreated = 1;
  }

  const visitTeamId = row.visitTeamCode
    ? teamCodeToId.get(row.visitTeamCode.toLowerCase()) ?? null
    : null;

  const createResult = await createMemberFromImport(
    row,
    householdId,
    visitTeamId
  );

  if (!createResult.success) {
    return {
      success: false,
      error: createResult.error,
      householdsCreated,
    };
  }

  knownMemberCodes.add(createResult.data.code.toLowerCase());

  return {
    success: true,
    code: createResult.data.code,
    memberId: createResult.data.id,
    householdsCreated,
  };
}

async function loadImportContext() {
  const households = await prisma.household.findMany({
    select: { id: true, code: true },
  });
  const householdCodeToId = new Map(
    households.map((h) => [h.code.toLowerCase(), h.id])
  );

  const teams = await prisma.visitTeam.findMany({
    select: { id: true, code: true },
  });
  const teamCodeToId = new Map(
    teams.map((t) => [t.code.toLowerCase(), t.id])
  );
  const visitTeamCodes = new Set(teams.map((t) => t.code.toLowerCase()));

  const existingMembers = await prisma.member.findMany({
    select: { code: true },
  });
  const knownMemberCodes = new Set(
    existingMembers.map((member) => member.code.toLowerCase())
  );

  return {
    householdCodeToId,
    teamCodeToId,
    visitTeamCodes,
    knownMemberCodes,
  };
}

async function processBatchRows(
  logId: string,
  headers: string[],
  rows: ImportDataRow[],
  ctx: Awaited<ReturnType<typeof loadImportContext>>
): Promise<{ results: ImportRowResult[]; successCount: number; errorCount: number; householdsCreated: number }> {
  const results: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount = 0;
  let householdsCreated = 0;

  for (const { rowNumber, cells } of rows) {
    const outcome = await processImportRow({
      rowNumber,
      cells,
      headers,
      ...ctx,
    });

    householdsCreated += outcome.householdsCreated;

    if (outcome.success) {
      successCount++;
      results.push({ row: rowNumber, success: true, code: outcome.code });
      await prisma.memberImportLogRow.create({
        data: {
          logId,
          rowNumber,
          status: "success",
          memberCode: outcome.code ?? null,
          memberId: outcome.memberId ?? null,
          rowData: cells as Prisma.InputJsonValue,
        },
      });
    } else {
      errorCount++;
      results.push({ row: rowNumber, success: false, error: outcome.error });
      await prisma.memberImportLogRow.create({
        data: {
          logId,
          rowNumber,
          status: "failed",
          error: outcome.error ?? "Lỗi không xác định",
          rowData: cells as Prisma.InputJsonValue,
        },
      });
    }
  }

  return { results, successCount, errorCount, householdsCreated };
}

export async function startMemberImport(input: {
  fileName: string;
  columnHeaders: string[];
  totalRows: number;
}): Promise<ActionResult<{ logId: string }>> {
  try {
    const user = await requireAuth();

    if (input.totalRows < 1) {
      return { success: false, error: "Không có dòng dữ liệu hợp lệ để import" };
    }

    const log = await prisma.memberImportLog.create({
      data: {
        fileName: input.fileName,
        uploadedById: user.id,
        uploadedByName: user.username,
        columnHeaders: input.columnHeaders as Prisma.InputJsonValue,
        totalRows: input.totalRows,
        successCount: 0,
        errorCount: 0,
      },
    });

    return { success: true, data: { logId: log.id } };
  } catch {
    return { success: false, error: "Không thể bắt đầu import" };
  }
}

export async function importMemberBatch(
  logId: string,
  rows: ImportDataRow[],
  options?: { isLastBatch?: boolean }
): Promise<ActionResult<ImportBatchResult>> {
  try {
    const user = await requireAuth();

    const log = await prisma.memberImportLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return { success: false, error: "Không tìm thấy log import" };
    }

    if (log.uploadedById !== user.id) {
      return { success: false, error: "Không có quyền import vào log này" };
    }

    if (rows.length === 0) {
      return { success: true, data: { successCount: 0, errorCount: 0, results: [] } };
    }

    const rawHeaders = log.columnHeaders as string[];
    const headerResult = parseImportHeaders([rawHeaders, rows[0].cells]);
    if (!headerResult.ok) {
      return { success: false, error: headerResult.error };
    }
    const headers = headerResult.headers;

    const ctx = await loadImportContext();
    const batch = await processBatchRows(logId, headers, rows, ctx);

    await prisma.memberImportLog.update({
      where: { id: logId },
      data: {
        successCount: { increment: batch.successCount },
        errorCount: { increment: batch.errorCount },
      },
    });

    if (options?.isLastBatch) {
      if (batch.successCount > 0) {
        revalidatePath("/members");
      }
      if (batch.householdsCreated > 0) {
        revalidatePath("/households");
      }
      revalidatePath("/members/imports");
      revalidatePath(`/members/imports/${logId}`);
    } else if (batch.successCount > 0) {
      revalidatePath("/members");
      if (batch.householdsCreated > 0) {
        revalidatePath("/households");
      }
    }

    return {
      success: true,
      data: {
        successCount: batch.successCount,
        errorCount: batch.errorCount,
        results: batch.results,
      },
    };
  } catch {
    return { success: false, error: "Không thể import batch" };
  }
}

export async function cancelMemberImportLog(
  logId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const log = await prisma.memberImportLog.findUnique({ where: { id: logId } });
    if (!log || log.uploadedById !== user.id) {
      return { success: false, error: "Không tìm thấy log import" };
    }
    await prisma.memberImportLog.delete({ where: { id: logId } });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể hủy import" };
  }
}

export async function getMemberImportTemplate(): Promise<
  ActionResult<{ base64: string; fileName: string }>
> {
  try {
    await requireAuth();
    return {
      success: true,
      data: {
        base64: buildMemberImportTemplateBase64(),
        fileName: "mau-import-thanh-vien.xlsx",
      },
    };
  } catch {
    return { success: false, error: "Không thể tạo file mẫu" };
  }
}

export async function importMembersFile(
  fileBase64: string,
  fileName: string
): Promise<ActionResult<ImportMembersResult>> {
  try {
    await requireAuth();
    const buffer = Buffer.from(fileBase64, "base64");
    const parsed = parseSpreadsheetToRows(buffer, fileName);

    const headerResult = parseImportHeaders(parsed);
    if (!headerResult.ok) {
      return { success: false, error: headerResult.error };
    }

    const dataRows = extractImportDataRows(parsed);
    const start = await startMemberImport({
      fileName,
      columnHeaders: parsed[0],
      totalRows: dataRows.length,
    });
    if (!start.success) {
      return { success: false, error: start.error };
    }

    const logId = start.data.logId;
    const BATCH = 25;
    const allResults: ImportRowResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dataRows.length; i += BATCH) {
      const batch = dataRows.slice(i, i + BATCH);
      const isLastBatch = i + BATCH >= dataRows.length;
      const batchResult = await importMemberBatch(logId, batch, { isLastBatch });
      if (!batchResult.success) {
        return { success: false, error: batchResult.error };
      }
      successCount += batchResult.data.successCount;
      errorCount += batchResult.data.errorCount;
      allResults.push(...batchResult.data.results);
    }

    return {
      success: true,
      data: { logId, successCount, errorCount, results: allResults },
    };
  } catch {
    return { success: false, error: "Không thể import file Excel" };
  }
}

export async function getMemberImportLogs(
  page = 1
): Promise<
  ActionResult<{
    logs: MemberImportLogListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    await requireAuth();
    const pageSize = DEFAULT_PAGE_SIZE;
    const safePage = Math.max(1, page);

    const [rows, total] = await prisma.$transaction([
      prisma.memberImportLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fileName: true,
          uploadedByName: true,
          totalRows: true,
          successCount: true,
          errorCount: true,
          createdAt: true,
        },
      }),
      prisma.memberImportLog.count(),
    ]);

    return {
      success: true,
      data: {
        logs: rows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        })),
        total,
        page: safePage,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  } catch {
    return { success: false, error: "Không thể tải lịch sử import" };
  }
}

export async function getMemberImportLogById(
  id: string
): Promise<ActionResult<MemberImportLogDetail>> {
  try {
    await requireAuth();

    const log = await prisma.memberImportLog.findUnique({
      where: { id },
      include: {
        rows: {
          orderBy: { rowNumber: "asc" },
          select: {
            id: true,
            rowNumber: true,
            status: true,
            memberCode: true,
            error: true,
            retriedAt: true,
          },
        },
      },
    });

    if (!log) {
      return { success: false, error: "Không tìm thấy log import" };
    }

    return {
      success: true,
      data: {
        id: log.id,
        fileName: log.fileName,
        uploadedByName: log.uploadedByName,
        totalRows: log.totalRows,
        successCount: log.successCount,
        errorCount: log.errorCount,
        createdAt: log.createdAt.toISOString(),
        rows: log.rows.map((row) => ({
          id: row.id,
          rowNumber: row.rowNumber,
          status: row.status,
          memberCode: row.memberCode,
          error: row.error,
          retriedAt: row.retriedAt?.toISOString() ?? null,
        })),
      },
    };
  } catch {
    return { success: false, error: "Không thể tải chi tiết log import" };
  }
}

export async function retryFailedImportRows(
  logId: string
): Promise<ActionResult<ImportMembersResult>> {
  try {
    await requireAuth();

    const log = await prisma.memberImportLog.findUnique({
      where: { id: logId },
      include: {
        rows: {
          where: { status: "failed" },
          orderBy: { rowNumber: "asc" },
        },
      },
    });

    if (!log) {
      return { success: false, error: "Không tìm thấy log import" };
    }

    if (log.rows.length === 0) {
      return { success: false, error: "Không còn dòng lỗi để import lại" };
    }

    const rawHeaders = log.columnHeaders as string[];
    const headers = mapCsvHeaders(rawHeaders);
    const ctx = await loadImportContext();

    const results: ImportRowResult[] = [];
    let newSuccess = 0;
    let newFailed = 0;
    let householdsCreated = 0;

    for (const logRow of log.rows) {
      const cells = logRow.rowData as string[];
      const outcome = await processImportRow({
        rowNumber: logRow.rowNumber,
        cells,
        headers,
        ...ctx,
      });

      householdsCreated += outcome.householdsCreated;

      if (outcome.success) {
        newSuccess++;
        await prisma.memberImportLogRow.update({
          where: { id: logRow.id },
          data: {
            status: "success",
            memberCode: outcome.code ?? null,
            memberId: outcome.memberId ?? null,
            error: null,
            retriedAt: new Date(),
          },
        });
        results.push({
          row: logRow.rowNumber,
          success: true,
          code: outcome.code,
        });
      } else {
        newFailed++;
        await prisma.memberImportLogRow.update({
          where: { id: logRow.id },
          data: {
            error: outcome.error ?? "Lỗi không xác định",
            retriedAt: new Date(),
          },
        });
        results.push({
          row: logRow.rowNumber,
          success: false,
          error: outcome.error,
        });
      }
    }

    await prisma.memberImportLog.update({
      where: { id: logId },
      data: {
        successCount: { increment: newSuccess },
        errorCount: { decrement: newSuccess },
      },
    });

    if (newSuccess > 0) {
      revalidatePath("/members");
      if (householdsCreated > 0) {
        revalidatePath("/households");
      }
    }
    revalidatePath("/members/imports");
    revalidatePath(`/members/imports/${logId}`);

    return {
      success: true,
      data: {
        logId,
        successCount: newSuccess,
        errorCount: newFailed,
        results,
      },
    };
  } catch {
    return { success: false, error: "Không thể import lại các dòng lỗi" };
  }
}

export async function exportFailedImportRowsExcel(
  logId: string
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    await requireAuth();

    const log = await prisma.memberImportLog.findUnique({
      where: { id: logId },
      include: {
        rows: {
          where: { status: "failed" },
          orderBy: { rowNumber: "asc" },
        },
      },
    });

    if (!log) {
      return { success: false, error: "Không tìm thấy log import" };
    }

    if (log.rows.length === 0) {
      return { success: false, error: "Không còn dòng lỗi" };
    }

    const headers = log.columnHeaders as string[];
    const rows = log.rows.map((row) => row.rowData as string[]);
    const base64 = buildExcelBase64(headers, rows, "Dòng lỗi");

    return {
      success: true,
      data: {
        base64,
        fileName: `import-loi-${log.fileName}`,
      },
    };
  } catch {
    return { success: false, error: "Không thể xuất file dòng lỗi" };
  }
}
