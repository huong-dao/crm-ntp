"use server";

import { revalidatePath } from "next/cache";
import type { MemberImportRowStatus, Prisma } from "@prisma/client";
import { resolveDepartmentIdByAge, type DepartmentAgeRange } from "@/lib/department-age";
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

async function ensureVisitTeamByCode(
  code: string,
  teamCodeToId: Map<string, string>
): Promise<{ id: string; created: boolean }> {
  const key = code.toLowerCase();
  const existing = teamCodeToId.get(key);
  if (existing) return { id: existing, created: false };

  const created = await prisma.visitTeam.create({
    data: {
      code: code.trim(),
      area: "Chưa cập nhật khu vực",
    },
  });
  teamCodeToId.set(key, created.id);
  return { id: created.id, created: true };
}

async function ensureDepartmentByName(
  name: string,
  departmentNameToId: Map<string, string>
): Promise<{ id: string; created: boolean }> {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  const existing = departmentNameToId.get(key);
  if (existing) return { id: existing, created: false };

  const created = await prisma.department.create({
    data: { name: trimmed },
  });
  departmentNameToId.set(key, created.id);
  return { id: created.id, created: true };
}

async function buildImportFormInput(
  row: ImportRowValid,
  householdId: string,
  visitTeamId: string | null,
  departments: DepartmentAgeRange[],
  departmentNameToId: Map<string, string>
): Promise<ActionResult<MemberFormInput>> {
  let ageDepartmentId: string | null = null;
  if (row.birthYear != null) {
    ageDepartmentId = resolveDepartmentIdByAge(row.birthYear, departments);
  }
  if (!ageDepartmentId && row.ageDepartment) {
    const ensured = await ensureDepartmentByName(
      row.ageDepartment,
      departmentNameToId
    );
    ageDepartmentId = ensured.id;
  }

  const actualDepartmentId = row.actualDepartment
    ? (await ensureDepartmentByName(row.actualDepartment, departmentNameToId)).id
    : null;

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
    boardServiceYear: row.boardServiceYear ?? undefined,
    visitDepartmentYear: row.visitDepartmentYear ?? undefined,
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

  return { success: true, data: parsed.data };
}

async function upsertMemberFromImport(
  row: ImportRowValid,
  householdId: string,
  visitTeamId: string | null,
  memberCodeToId: Map<string, string>,
  departments: DepartmentAgeRange[],
  departmentNameToId: Map<string, string>
): Promise<ActionResult<{ id: string; code: string }>> {
  const formResult = await buildImportFormInput(
    row,
    householdId,
    visitTeamId,
    departments,
    departmentNameToId
  );
  if (!formResult.success) {
    return formResult;
  }

  const data = formResult.data;
  const memberCode = row.memberCode?.trim();
  const existingId = memberCode
    ? memberCodeToId.get(memberCode.toLowerCase())
    : undefined;

  if (existingId) {
    const built = buildMemberWriteData(data);
    if (!built.ok) {
      return { success: false, error: built.error };
    }

    try {
      const existing = await prisma.member.findUnique({
        where: { id: existingId },
        select: { householdId: true },
      });

      if (!existing) {
        return { success: false, error: "Thành viên không tồn tại" };
      }

      const oldHouseholdId = existing.householdId;

      const member = await prisma.$transaction(async (tx) => {
        const updated = await tx.member.update({
          where: { id: existingId },
          data: { ...built.data, householdId },
        });
        await applyHeadOfHousehold(tx, householdId, existingId, data.isHead);

        if (oldHouseholdId && oldHouseholdId !== householdId) {
          const oldHousehold = await tx.household.findUnique({
            where: { id: oldHouseholdId },
            select: { headMemberId: true },
          });
          if (oldHousehold?.headMemberId === existingId) {
            await tx.household.update({
              where: { id: oldHouseholdId },
              data: { headMemberId: null },
            });
          }
        }

        return updated;
      });

      return { success: true, data: { id: member.id, code: member.code } };
    } catch {
      return { success: false, error: "Không thể cập nhật thành viên" };
    }
  }

  const code = memberCode || (await generateMemberCode());
  const built = buildMemberWriteData(data, code);
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
        data.isHead
      );
      return created;
    });

    memberCodeToId.set(member.code.toLowerCase(), member.id);

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
  memberCodeToId: Map<string, string>;
  departments: DepartmentAgeRange[];
  departmentNameToId: Map<string, string>;
};

async function processImportRow(
  input: ProcessRowInput
): Promise<{
  success: boolean;
  code?: string;
  memberId?: string;
  error?: string;
  householdsCreated: number;
  visitTeamsCreated: number;
  departmentsCreated: number;
}> {
  const {
    rowNumber,
    cells,
    headers,
    householdCodeToId,
    teamCodeToId,
    memberCodeToId,
    departments,
    departmentNameToId,
  } = input;

  const importRow = rowToImportData(headers, cells, rowNumber);
  const validated = validateImportRow(importRow);

  if (!validated.ok) {
    return {
      success: false,
      error: validated.error,
      householdsCreated: 0,
      visitTeamsCreated: 0,
      departmentsCreated: 0,
    };
  }

  const row = validated.data;
  const householdKey = row.householdCode.toLowerCase();
  const hadHousehold = householdCodeToId.has(householdKey);
  let householdsCreated = 0;
  let visitTeamsCreated = 0;
  let departmentsCreated = 0;

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
      visitTeamsCreated: 0,
      departmentsCreated: 0,
    };
  }

  if (!hadHousehold) {
    householdsCreated = 1;
  }

  let visitTeamId: string | null = null;
  if (row.visitTeamCode) {
    try {
      const ensured = await ensureVisitTeamByCode(row.visitTeamCode, teamCodeToId);
      visitTeamId = ensured.id;
      if (ensured.created) visitTeamsCreated = 1;
    } catch {
      return {
        success: false,
        error: `Không thể tạo tổ "${row.visitTeamCode}"`,
        householdsCreated,
        visitTeamsCreated: 0,
        departmentsCreated: 0,
      };
    }
  }

  if (row.ageDepartment) {
    const before = departmentNameToId.has(row.ageDepartment.trim().toLowerCase());
    if (!before) {
      await ensureDepartmentByName(row.ageDepartment, departmentNameToId);
      departmentsCreated++;
    }
  }
  if (row.actualDepartment) {
    const key = row.actualDepartment.trim().toLowerCase();
    if (!departmentNameToId.has(key)) {
      await ensureDepartmentByName(row.actualDepartment, departmentNameToId);
      departmentsCreated++;
    }
  }

  const upsertResult = await upsertMemberFromImport(
    row,
    householdId,
    visitTeamId,
    memberCodeToId,
    departments,
    departmentNameToId
  );

  if (!upsertResult.success) {
    return {
      success: false,
      error: upsertResult.error,
      householdsCreated,
      visitTeamsCreated,
      departmentsCreated,
    };
  }

  return {
    success: true,
    code: upsertResult.data.code,
    memberId: upsertResult.data.id,
    householdsCreated,
    visitTeamsCreated,
    departmentsCreated,
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

  const existingMembers = await prisma.member.findMany({
    select: { id: true, code: true },
  });
  const memberCodeToId = new Map(
    existingMembers.map((member) => [member.code.toLowerCase(), member.id])
  );

  const departments = await prisma.department.findMany({
    select: { id: true, name: true, minAge: true, maxAge: true },
    orderBy: { name: "asc" },
  });
  const departmentNameToId = new Map(
    departments.map((department) => [department.name.toLowerCase(), department.id])
  );

  return {
    householdCodeToId,
    teamCodeToId,
    memberCodeToId,
    departments,
    departmentNameToId,
  };
}

async function processBatchRows(
  logId: string,
  headers: string[],
  rows: ImportDataRow[],
  ctx: Awaited<ReturnType<typeof loadImportContext>>
): Promise<{ results: ImportRowResult[]; successCount: number; errorCount: number; householdsCreated: number; visitTeamsCreated: number; departmentsCreated: number }> {
  const results: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount = 0;
  let householdsCreated = 0;
  let visitTeamsCreated = 0;
  let departmentsCreated = 0;

  for (const { rowNumber, cells } of rows) {
    const outcome = await processImportRow({
      rowNumber,
      cells,
      headers,
      ...ctx,
    });

    householdsCreated += outcome.householdsCreated;
    visitTeamsCreated += outcome.visitTeamsCreated;
    departmentsCreated += outcome.departmentsCreated;

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

  return { results, successCount, errorCount, householdsCreated, visitTeamsCreated, departmentsCreated };
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
      if (batch.visitTeamsCreated > 0) {
        revalidatePath("/visit-teams");
      }
      if (batch.departmentsCreated > 0) {
        revalidatePath("/departments");
      }
      revalidatePath("/members/imports");
      revalidatePath(`/members/imports/${logId}`);
    } else if (batch.successCount > 0) {
      revalidatePath("/members");
      if (batch.householdsCreated > 0) {
        revalidatePath("/households");
      }
      if (batch.visitTeamsCreated > 0) {
        revalidatePath("/visit-teams");
      }
      if (batch.departmentsCreated > 0) {
        revalidatePath("/departments");
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
    let visitTeamsCreated = 0;
    let departmentsCreated = 0;

    for (const logRow of log.rows) {
      const cells = logRow.rowData as string[];
      const outcome = await processImportRow({
        rowNumber: logRow.rowNumber,
        cells,
        headers,
        ...ctx,
      });

      householdsCreated += outcome.householdsCreated;
      visitTeamsCreated += outcome.visitTeamsCreated;
      departmentsCreated += outcome.departmentsCreated;

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
      if (visitTeamsCreated > 0) {
        revalidatePath("/visit-teams");
      }
      if (departmentsCreated > 0) {
        revalidatePath("/departments");
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
