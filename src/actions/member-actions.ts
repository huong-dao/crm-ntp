"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus, Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import {
  buildFullName,
  buildNewFullAddress,
  buildOldFullAddress,
  generateHouseholdCode,
  generateMemberCode,
} from "@/lib/generate-code";
import {
  DEFAULT_PAGE_SIZE,
  STATUS_LABELS,
  type MemberFiltersInput,
} from "@/lib/member-list";
import {
  mapCsvHeaders,
  rowToImportData,
  validateImportRow,
  type ImportRowValid,
} from "@/lib/member-import";
import {
  buildExcelBase64,
  buildMemberImportTemplateBase64,
  parseSpreadsheetToRows,
} from "@/lib/member-excel";
import { prisma } from "@/lib/prisma";
import {
  memberFormSchema,
  type MemberFormInput,
} from "@/lib/validations/member";

export type MemberListItem = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  mobile1: string | null;
  actualDepartment: string | null;
  householdCode: string | null;
};

export type MembersResult = {
  members: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MemberFilterOptions = {
  visitTeams: { id: string; code: string; area: string }[];
  departments: string[];
};

export type MemberFormOptions = {
  households: { id: string; code: string }[];
  visitTeams: { id: string; code: string; area: string }[];
};

export type MemberFormDefaults = {
  id: string;
  code: string;
  fullName: string;
  status: MemberStatus;
  firstName: string;
  lastName: string;
  gender: "male" | "female" | null;
  birthYear: number | null;
  occupation: string | null;
  houseNumber: string | null;
  street: string | null;
  oldWard: string | null;
  oldDistrict: string | null;
  oldProvince: string | null;
  newWard: string | null;
  newProvince: string | null;
  mobile1: string | null;
  mobile2: string | null;
  landline: string | null;
  householdId: string;
  isHead: boolean;
  relationship: string | null;
  isBaptized: boolean;
  baptismYear: number | null;
  ageDepartment: string | null;
  actualDepartment: string | null;
  boardServiceDate: string;
  visitDepartment: string | null;
  visitTeamId: string | null;
  notes: string | null;
};

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function parseBoardServiceDate(
  value?: string | null
): { date: Date | null } | { error: string } {
  if (!value) return { date: null };
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "Ngày ban chấp sự không hợp lệ" };
  }
  return { date: parsedDate };
}

function buildMemberWriteData(
  data: MemberFormInput,
  code?: string
):
  | { ok: true; data: Prisma.MemberUncheckedCreateInput }
  | { ok: false; error: string } {
  const fullName = buildFullName(data.firstName, data.lastName);
  const oldFullAddress = buildOldFullAddress(data);
  const newFullAddress = buildNewFullAddress(data);
  const boardParsed = parseBoardServiceDate(data.boardServiceDate);
  if ("error" in boardParsed) {
    return { ok: false, error: boardParsed.error };
  }

  const record = {
    status: data.status,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    houseNumber: data.houseNumber,
    street: data.street,
    oldWard: data.oldWard,
    oldDistrict: data.oldDistrict,
    oldProvince: data.oldProvince,
    oldFullAddress: oldFullAddress || null,
    newWard: data.newWard,
    newProvince: data.newProvince,
    newFullAddress: newFullAddress || null,
    mobile1: data.mobile1,
    mobile2: data.mobile2,
    landline: data.landline,
    birthYear: data.birthYear ?? null,
    gender: data.gender ?? null,
    occupation: data.occupation,
    householdId: data.householdId,
    isHead: data.isHead,
    relationship: data.isHead ? null : data.relationship,
    isBaptized: data.isBaptized,
    baptismYear: data.isBaptized ? data.baptismYear ?? null : null,
    ageDepartment: data.ageDepartment,
    actualDepartment: data.actualDepartment,
    boardServiceDate: boardParsed.date,
    visitDepartment: data.visitDepartment,
    visitTeamId: data.visitTeamId ?? null,
    notes: data.notes,
  };

  if (code) {
    return { ok: true, data: { ...record, code } as Prisma.MemberUncheckedCreateInput };
  }
  return { ok: true, data: record as Prisma.MemberUncheckedCreateInput };
}

async function applyHeadOfHousehold(
  tx: Prisma.TransactionClient,
  householdId: string,
  memberId: string,
  isHead: boolean
) {
  if (isHead) {
    await tx.member.updateMany({
      where: { householdId, isHead: true, id: { not: memberId } },
      data: { isHead: false },
    });
    await tx.household.update({
      where: { id: householdId },
      data: { headMemberId: memberId },
    });
  } else {
    const household = await tx.household.findUnique({
      where: { id: householdId },
      select: { headMemberId: true },
    });
    if (household?.headMemberId === memberId) {
      await tx.household.update({
        where: { id: householdId },
        data: { headMemberId: null },
      });
    }
  }
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function buildWhere(filters: MemberFiltersInput): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {};

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { code: { contains: search } },
      { household: { code: { contains: search } } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.visitTeamId) {
    where.visitTeamId = filters.visitTeamId;
  }

  if (filters.department) {
    where.actualDepartment = filters.department;
  }

  return where;
}

export async function getMembers(
  filters: MemberFiltersInput = {}
): Promise<MembersResult> {
  await requireAuth();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const sortBy = filters.sortBy ?? "fullName";
  const sortOrder = filters.sortOrder ?? "asc";
  const where = buildWhere(filters);

  const [rows, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        code: true,
        fullName: true,
        status: true,
        mobile1: true,
        actualDepartment: true,
        household: { select: { code: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  const members: MemberListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    status: row.status,
    mobile1: row.mobile1,
    actualDepartment: row.actualDepartment,
    householdCode: row.household?.code ?? null,
  }));

  return {
    members,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMemberFilterOptions(): Promise<MemberFilterOptions> {
  await requireAuth();

  const visitTeams = await prisma.visitTeam.findMany({
    select: { id: true, code: true, area: true },
    orderBy: { code: "asc" },
  });

  const departmentRows = await prisma.member.findMany({
    where: { actualDepartment: { not: null } },
    select: { actualDepartment: true },
    distinct: ["actualDepartment"],
    orderBy: { actualDepartment: "asc" },
  });

  const departments = departmentRows
    .map((row) => row.actualDepartment)
    .filter((value): value is string => value !== null);

  return { visitTeams, departments };
}

export async function getMemberFormOptions(): Promise<MemberFormOptions> {
  await requireAuth();

  const [households, visitTeams] = await Promise.all([
    prisma.household.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
    prisma.visitTeam.findMany({
      select: { id: true, code: true, area: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return { households, visitTeams };
}

export async function getMemberById(
  id: string
): Promise<MemberFormDefaults | null> {
  await requireAuth();

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member || !member.householdId) return null;

  return {
    id: member.id,
    code: member.code,
    fullName: member.fullName,
    status: member.status,
    firstName: member.firstName,
    lastName: member.lastName,
    gender: member.gender,
    birthYear: member.birthYear,
    occupation: member.occupation,
    houseNumber: member.houseNumber,
    street: member.street,
    oldWard: member.oldWard,
    oldDistrict: member.oldDistrict,
    oldProvince: member.oldProvince,
    newWard: member.newWard,
    newProvince: member.newProvince,
    mobile1: member.mobile1,
    mobile2: member.mobile2,
    landline: member.landline,
    householdId: member.householdId,
    isHead: member.isHead,
    relationship: member.relationship,
    isBaptized: member.isBaptized,
    baptismYear: member.baptismYear,
    ageDepartment: member.ageDepartment,
    actualDepartment: member.actualDepartment,
    boardServiceDate: formatDateForInput(member.boardServiceDate),
    visitDepartment: member.visitDepartment,
    visitTeamId: member.visitTeamId,
    notes: member.notes,
  };
}

export async function createMember(
  input: MemberFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = memberFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const data = parsed.data;

    if (!data.createNewHousehold) {
      const household = await prisma.household.findUnique({
        where: { id: data.householdId! },
      });
      if (!household) {
        return { success: false, error: "Mã hộ không tồn tại" };
      }
    }

    if (data.visitTeamId) {
      const team = await prisma.visitTeam.findUnique({
        where: { id: data.visitTeamId },
      });
      if (!team) {
        return { success: false, error: "Tổ thăm viếng không tồn tại" };
      }
    }

    const code = await generateMemberCode();
    const built = buildMemberWriteData(
      {
        ...data,
        householdId: data.createNewHousehold ? null : data.householdId,
      },
      code
    );
    if (!built.ok) {
      return { success: false, error: built.error };
    }

    const member = await prisma.$transaction(async (tx) => {
      let householdId = data.householdId!;

      if (data.createNewHousehold) {
        const householdCode = await generateHouseholdCode();
        const household = await tx.household.create({
          data: { code: householdCode },
        });
        householdId = household.id;
      }

      const created = await tx.member.create({
        data: { ...built.data, householdId },
      });

      await applyHeadOfHousehold(tx, householdId, created.id, data.isHead);

      return created;
    });

    revalidatePath("/members");
    revalidatePath("/households");
    revalidatePath(`/households/${member.householdId}`);

    return { success: true, data: { id: member.id, code: member.code } };
  } catch {
    return { success: false, error: "Không thể tạo thành viên" };
  }
}

export async function updateMember(
  id: string,
  input: MemberFormInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    await requireAuth();
    const parsed = memberFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const data = parsed.data;
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Thành viên không tồn tại" };
    }

    if (data.createNewHousehold || !data.householdId) {
      return { success: false, error: "Mã hộ không được trống" };
    }

    const householdId = data.householdId;

    const household = await prisma.household.findUnique({
      where: { id: householdId },
    });
    if (!household) {
      return { success: false, error: "Mã hộ không tồn tại" };
    }

    if (data.visitTeamId) {
      const team = await prisma.visitTeam.findUnique({
        where: { id: data.visitTeamId },
      });
      if (!team) {
        return { success: false, error: "Tổ thăm viếng không tồn tại" };
      }
    }

    const built = buildMemberWriteData(data);
    if (!built.ok) {
      return { success: false, error: built.error };
    }

    const oldHouseholdId = existing.householdId;

    const member = await prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id },
        data: built.data,
      });

      await applyHeadOfHousehold(tx, householdId, id, data.isHead);

      if (oldHouseholdId && oldHouseholdId !== householdId) {
        const oldHousehold = await tx.household.findUnique({
          where: { id: oldHouseholdId },
          select: { headMemberId: true },
        });
        if (oldHousehold?.headMemberId === id) {
          await tx.household.update({
            where: { id: oldHouseholdId },
            data: { headMemberId: null },
          });
        }
      }

      return updated;
    });

    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    revalidatePath(`/households/${householdId}`);
    if (oldHouseholdId && oldHouseholdId !== householdId) {
      revalidatePath(`/households/${oldHouseholdId}`);
    }

    return { success: true, data: { id: member.id, code: member.code } };
  } catch {
    return { success: false, error: "Không thể cập nhật thành viên" };
  }
}

export async function deleteMember(
  id: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Thành viên không tồn tại" };
    }

    const householdId = existing.householdId;

    await prisma.$transaction(async (tx) => {
      if (householdId) {
        const household = await tx.household.findUnique({
          where: { id: householdId },
          select: { headMemberId: true },
        });
        if (household?.headMemberId === id) {
          await tx.household.update({
            where: { id: householdId },
            data: { headMemberId: null },
          });
        }
      }

      await tx.visitTeam.updateMany({
        where: { leaderMemberId: id },
        data: { leaderMemberId: null },
      });

      await tx.member.delete({ where: { id } });
    });

    revalidatePath("/members");
    if (householdId) {
      revalidatePath(`/households/${householdId}`);
    }

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Không thể xóa thành viên" };
  }
}

export async function exportMembers(
  filters: MemberFiltersInput = {}
): Promise<ActionResult<{ base64: string; fileName: string }>> {
  try {
    await requireAuth();

    const sortBy = filters.sortBy ?? "fullName";
    const sortOrder = filters.sortOrder ?? "asc";
    const where = buildWhere(filters);

    const members = await prisma.member.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      select: {
        code: true,
        fullName: true,
        status: true,
        mobile1: true,
        actualDepartment: true,
        household: { select: { code: true } },
        visitTeam: { select: { code: true } },
      },
    });

    const headers = [
      "Mã tín hữu",
      "Họ tên",
      "Mã hộ",
      "Tình trạng",
      "Di động",
      "Ban ngành",
      "Mã tổ thăm viếng",
    ];

    const rows = members.map((member) => [
      member.code,
      member.fullName,
      member.household?.code ?? "",
      STATUS_LABELS[member.status],
      member.mobile1 ?? "",
      member.actualDepartment ?? "",
      member.visitTeam?.code ?? "",
    ]);

    const date = new Date().toISOString().slice(0, 10);
    const base64 = buildExcelBase64(headers, rows);
    return {
      success: true,
      data: { base64, fileName: `thanh-vien-${date}.xlsx` },
    };
  } catch {
    return { success: false, error: "Không thể xuất file Excel" };
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

export type ImportRowResult = {
  row: number;
  success: boolean;
  code?: string;
  error?: string;
};

export type ImportMembersResult = {
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
};

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
    ageDepartment: row.ageDepartment,
    actualDepartment: row.actualDepartment,
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

export async function importMembersFile(
  fileBase64: string,
  fileName: string
): Promise<ActionResult<ImportMembersResult>> {
  try {
    await requireAuth();

    const buffer = Buffer.from(fileBase64, "base64");
    const parsed = parseSpreadsheetToRows(buffer, fileName);

    return importMembersFromRows(parsed);
  } catch {
    return { success: false, error: "Không thể đọc file Excel" };
  }
}

async function importMembersFromRows(
  parsed: string[][]
): Promise<ActionResult<ImportMembersResult>> {
  try {
    if (parsed.length < 2) {
      return {
        success: false,
        error: "File trống hoặc thiếu dữ liệu (cần dòng tiêu đề và ít nhất 1 dòng)",
      };
    }

    const headers = mapCsvHeaders(parsed[0]);
    const hasNameColumn =
      headers.includes("firstName") ||
      headers.includes("lastName") ||
      headers.includes("fullName");
    const hasHousehold = headers.includes("householdCode");

    if (!hasNameColumn || !hasHousehold) {
      return {
        success: false,
        error:
          "File cần cột Họ và lót/Tên (hoặc Họ tên) và Mã hộ. Tải file mẫu để tham khảo.",
      };
    }

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

    const results: ImportRowResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let householdsCreated = 0;

    for (let i = 1; i < parsed.length; i++) {
      const rowNumber = i + 1;
      const cells = parsed[i];
      if (cells.every((cell) => !cell.trim())) continue;

      const importRow = rowToImportData(headers, cells, rowNumber);
      const validated = validateImportRow(
        importRow,
        visitTeamCodes,
        knownMemberCodes
      );

      if (!validated.ok) {
        errorCount++;
        results.push({ row: rowNumber, success: false, error: validated.error });
        continue;
      }

      const row = validated.data;
      const householdKey = row.householdCode.toLowerCase();
      const hadHousehold = householdCodeToId.has(householdKey);

      let householdId: string;
      try {
        householdId = await ensureHouseholdByCode(
          row.householdCode,
          householdCodeToId
        );
      } catch {
        errorCount++;
        results.push({
          row: rowNumber,
          success: false,
          error: `Không thể tạo hộ "${row.householdCode}"`,
        });
        continue;
      }

      if (!hadHousehold) {
        householdsCreated++;
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
        errorCount++;
        results.push({
          row: rowNumber,
          success: false,
          error: createResult.error,
        });
      } else {
        successCount++;
        knownMemberCodes.add(createResult.data.code.toLowerCase());
        results.push({
          row: rowNumber,
          success: true,
          code: createResult.data.code,
        });
      }
    }

    if (results.length === 0) {
      return { success: false, error: "Không có dòng dữ liệu hợp lệ để import" };
    }

    if (successCount > 0) {
      revalidatePath("/members");
      if (householdsCreated > 0) {
        revalidatePath("/households");
      }
    }

    return {
      success: true,
      data: { successCount, errorCount, results },
    };
  } catch {
    return { success: false, error: "Không thể import file Excel" };
  }
}
