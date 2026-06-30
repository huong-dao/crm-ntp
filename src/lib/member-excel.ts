import * as XLSX from "xlsx";
import type { Gender, MemberStatus } from "@prisma/client";
import {
  MEMBER_IMPORT_TEMPLATE_HEADERS,
  MEMBER_IMPORT_TEMPLATE_SAMPLE,
  parseCsv,
} from "@/lib/csv";
import { STATUS_LABELS } from "@/lib/member-list";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export { EXCEL_MIME };

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Đọc file Excel (.xlsx/.xls) hoặc CSV thành mảng 2 chiều (dòng → ô). */
export function parseSpreadsheetToRows(
  data: ArrayBuffer | Uint8Array | Buffer,
  fileName: string
): string[][] {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv")) {
    const bytes =
      data instanceof Buffer
        ? data
        : Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
    const text = bytes.toString("utf-8").replace(/^\uFEFF/, "");
    return parseCsv(text);
  }

  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  return raw.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map(cellToString);
  });
}

export function buildExcelBuffer(
  headers: string[],
  rows: string[][],
  sheetName = "Thành viên"
): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildExcelBase64(
  headers: string[],
  rows: string[][],
  sheetName = "Thành viên"
): string {
  return buildExcelBuffer(headers, rows, sheetName).toString("base64");
}

export function buildMemberImportTemplateBase64(): string {
  return buildExcelBase64(
    MEMBER_IMPORT_TEMPLATE_HEADERS,
    MEMBER_IMPORT_TEMPLATE_SAMPLE,
    "Mẫu import"
  );
}

export type MemberImportExportRecord = {
  code: string;
  status: MemberStatus;
  firstName: string;
  lastName: string;
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
  birthYear: number | null;
  gender: Gender | null;
  occupation: string | null;
  isHead: boolean;
  relationship: string | null;
  isBaptized: boolean;
  baptismYear: number | null;
  boardServiceDate: Date | null;
  visitDepartment: string | null;
  notes: string | null;
  household: { code: string } | null;
  visitTeam: { code: string } | null;
  ageDepartment: { name: string } | null;
  actualDepartment: { name: string } | null;
};

function formatExportYear(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

function formatExportYesNo(value: boolean): string {
  return value ? "Y" : "";
}

function formatExportGender(gender: Gender | null): string {
  if (gender === "male") return "Nam";
  if (gender === "female") return "Nữ";
  return "";
}

function yearFromDate(date: Date | null): number | null {
  if (!date) return null;
  return date.getFullYear();
}

function parseVisitDepartmentYear(value: string | null): number | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 1900) return null;
  return year;
}

/** Chuyển bản ghi thành viên sang dòng Excel khớp mẫu import. */
export function memberToImportExportRow(
  member: MemberImportExportRecord
): string[] {
  return [
    member.visitTeam?.code ?? "",
    member.household?.code ?? "",
    member.code,
    STATUS_LABELS[member.status],
    member.firstName,
    member.lastName,
    member.houseNumber ?? "",
    member.street ?? "",
    member.oldWard ?? "",
    member.oldDistrict ?? "",
    member.oldProvince ?? "",
    member.newWard ?? "",
    member.newProvince ?? "",
    member.mobile1 ?? "",
    member.mobile2 ?? "",
    member.landline ?? "",
    formatExportYear(member.birthYear),
    formatExportGender(member.gender),
    member.occupation ?? "",
    formatExportYesNo(member.isHead),
    member.relationship ?? "",
    formatExportYesNo(member.isBaptized),
    member.isBaptized ? formatExportYear(member.baptismYear) : "",
    member.ageDepartment?.name ?? "",
    member.actualDepartment?.name ?? "",
    formatExportYear(yearFromDate(member.boardServiceDate)),
    formatExportYear(parseVisitDepartmentYear(member.visitDepartment)),
    member.notes ?? "",
  ];
}
