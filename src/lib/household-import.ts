import {
  extractSpreadsheetDataRows,
  normalizeSpreadsheetHeader,
  type SpreadsheetDataRow,
} from "@/lib/spreadsheet-import";

const HEADER_ALIASES: Record<string, string> = {
  "mã hộ": "householdCode",
  "ma ho": "householdCode",
  householdcode: "householdCode",
  code: "householdCode",
  "chủ hộ": "headMemberCode",
  "chu ho": "headMemberCode",
  headmembercode: "headMemberCode",
  "mã tín hữu": "headMemberCode",
  "ma tin huu": "headMemberCode",
  membercode: "headMemberCode",
};

export const HOUSEHOLD_IMPORT_HEADERS = ["Mã hộ", "Chủ hộ"];

export const HOUSEHOLD_IMPORT_SAMPLE: string[][] = [
  ["HO001", "TV00001"],
  ["HO002", ""],
];

function mapHeaders(headers: string[]): string[] {
  return headers.map(
    (h) => HEADER_ALIASES[normalizeSpreadsheetHeader(h)] ?? normalizeSpreadsheetHeader(h)
  );
}

export type ParsedHouseholdImportRow = {
  rowNumber: number;
  householdCode?: string;
  headMemberCode?: string;
};

function rowToData(
  headers: string[],
  cells: string[],
  rowNumber: number
): ParsedHouseholdImportRow {
  const data: ParsedHouseholdImportRow = { rowNumber };
  headers.forEach((header, index) => {
    const value = cells[index]?.trim() ?? "";
    if (!value) return;
    if (header === "householdCode") data.householdCode = value;
    if (header === "headMemberCode") data.headMemberCode = value;
  });
  return data;
}

export function parseHouseholdImportHeaders(
  parsed: string[][]
):
  | { ok: true; headers: string[] }
  | { ok: false; error: string } {
  if (parsed.length < 2) {
    return {
      ok: false,
      error: "File trống hoặc thiếu dữ liệu (cần dòng tiêu đề và ít nhất 1 dòng)",
    };
  }

  const headers = mapHeaders(parsed[0]);
  if (!headers.includes("householdCode")) {
    return {
      ok: false,
      error: 'File cần cột "Mã hộ". Tải file mẫu để tham khảo.',
    };
  }

  return { ok: true, headers };
}

export function extractHouseholdImportRows(
  parsed: string[][]
): SpreadsheetDataRow[] {
  return extractSpreadsheetDataRows(parsed);
}

export function validateHouseholdImportRow(
  headers: string[],
  cells: string[],
  rowNumber: number
):
  | { ok: true; data: { householdCode: string; headMemberCode: string | null } }
  | { ok: false; error: string } {
  const row = rowToData(headers, cells, rowNumber);

  const householdCode = row.householdCode?.trim();
  if (!householdCode) {
    return { ok: false, error: "Thiếu mã hộ" };
  }

  const headMemberCode = row.headMemberCode?.trim() || null;

  return {
    ok: true,
    data: { householdCode, headMemberCode },
  };
}

export type HouseholdImportDataRow = SpreadsheetDataRow;
