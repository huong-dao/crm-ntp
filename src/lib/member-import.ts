import type { MemberStatus } from "@prisma/client";
import { MEMBER_STATUSES, STATUS_LABELS } from "@/lib/member-list";

const HEADER_ALIASES: Record<string, string> = {
  code: "code",
  "mã tín hữu": "code",
  "ma tin huu": "code",
  fullname: "fullName",
  "họ tên": "fullName",
  "ho ten": "fullName",
  firstname: "firstName",
  "họ và lót": "firstName",
  "ho va lot": "firstName",
  lastname: "lastName",
  tên: "lastName",
  ten: "lastName",
  household: "householdCode",
  "mã hộ": "householdCode",
  "ma ho": "householdCode",
  status: "status",
  "tình trạng": "status",
  "tinh trang": "status",
  mobile1: "mobile1",
  mobile: "mobile1",
  "di động": "mobile1",
  "di dong": "mobile1",
  actualdepartment: "actualDepartment",
  "ban ngành": "actualDepartment",
  "ban nganh": "actualDepartment",
  visitteamcode: "visitTeamCode",
  "mã tổ thăm viếng": "visitTeamCode",
  "ma to tham vieng": "visitTeamCode",
  "mã tổ": "visitTeamCode",
  "ma to": "visitTeamCode",
};

export type ParsedImportRow = {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  householdCode?: string;
  status?: string;
  mobile1?: string;
  actualDepartment?: string;
  visitTeamCode?: string;
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

export function mapCsvHeaders(headers: string[]): string[] {
  return headers.map(normalizeHeader);
}

export function rowToImportData(
  headers: string[],
  cells: string[],
  rowNumber: number
): ParsedImportRow {
  const data: ParsedImportRow = { rowNumber };

  headers.forEach((header, index) => {
    const value = cells[index]?.trim() ?? "";
    if (!value) return;

    switch (header) {
      case "firstName":
        data.firstName = value;
        break;
      case "lastName":
        data.lastName = value;
        break;
      case "fullName":
        data.fullName = value;
        break;
      case "householdCode":
        data.householdCode = value;
        break;
      case "status":
        data.status = value;
        break;
      case "mobile1":
        data.mobile1 = value;
        break;
      case "actualDepartment":
        data.actualDepartment = value;
        break;
      case "visitTeamCode":
        data.visitTeamCode = value;
        break;
      default:
        break;
    }
  });

  return data;
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

export function parseImportStatus(value?: string): MemberStatus | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase();

  if (MEMBER_STATUSES.includes(normalized as MemberStatus)) {
    return normalized as MemberStatus;
  }

  for (const status of MEMBER_STATUSES) {
    if (STATUS_LABELS[status].toLowerCase() === normalized) {
      return status;
    }
  }

  return undefined;
}

export function validateImportRow(
  row: ParsedImportRow,
  householdCodes: Set<string>,
  visitTeamCodes: Set<string>
): { ok: true; data: ImportRowValid } | { ok: false; error: string } {
  let firstName = row.firstName?.trim() ?? "";
  let lastName = row.lastName?.trim() ?? "";

  if (row.fullName && (!firstName || !lastName)) {
    const split = splitFullName(row.fullName);
    firstName = split.firstName;
    lastName = split.lastName;
  }

  if (!firstName) {
    return { ok: false, error: "Thiếu họ và lót hoặc họ tên" };
  }
  if (!lastName) {
    return { ok: false, error: "Thiếu tên hoặc họ tên" };
  }

  const householdCode = row.householdCode?.trim();
  if (!householdCode) {
    return { ok: false, error: "Thiếu mã hộ" };
  }
  if (!householdCodes.has(householdCode.toLowerCase())) {
    return { ok: false, error: `Mã hộ "${householdCode}" không tồn tại` };
  }

  const visitTeamCode = row.visitTeamCode?.trim();
  if (visitTeamCode && !visitTeamCodes.has(visitTeamCode.toLowerCase())) {
    return { ok: false, error: `Mã tổ "${visitTeamCode}" không tồn tại` };
  }

  const status = parseImportStatus(row.status) ?? "active";

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      householdCode,
      status,
      mobile1: row.mobile1?.trim() || null,
      actualDepartment: row.actualDepartment?.trim() || null,
      visitTeamCode: visitTeamCode || null,
    },
  };
}

export type ImportRowValid = {
  firstName: string;
  lastName: string;
  householdCode: string;
  status: MemberStatus;
  mobile1: string | null;
  actualDepartment: string | null;
  visitTeamCode: string | null;
};
