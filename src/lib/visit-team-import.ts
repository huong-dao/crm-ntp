import {
  extractSpreadsheetDataRows,
  normalizeSpreadsheetHeader,
  type SpreadsheetDataRow,
} from "@/lib/spreadsheet-import";

const HEADER_ALIASES: Record<string, string> = {
  "mã tổ thăm viếng": "teamCode",
  "ma to tham vieng": "teamCode",
  "mã tổ": "teamCode",
  "ma to": "teamCode",
  teamcode: "teamCode",
  code: "teamCode",
  "mã tín hữu": "leaderMemberCode",
  "ma tin huu": "leaderMemberCode",
  leadermembercode: "leaderMemberCode",
  membercode: "leaderMemberCode",
  "khu vực phụ trách": "area",
  "khu vuc phu trach": "area",
  area: "area",
  "khu vực": "area",
  "khu vuc": "area",
};

export const VISIT_TEAM_IMPORT_HEADERS = [
  "Mã tổ thăm viếng",
  "Mã tín hữu",
  "Khu vực phụ trách",
];

export const VISIT_TEAM_IMPORT_SAMPLE: string[][] = [
  ["TV01", "TV00001", "Phường A — Khu 1"],
];

function mapHeaders(headers: string[]): string[] {
  return headers.map(
    (h) => HEADER_ALIASES[normalizeSpreadsheetHeader(h)] ?? normalizeSpreadsheetHeader(h)
  );
}

export type ParsedVisitTeamImportRow = {
  rowNumber: number;
  teamCode?: string;
  leaderMemberCode?: string;
  area?: string;
};

function rowToData(
  headers: string[],
  cells: string[],
  rowNumber: number
): ParsedVisitTeamImportRow {
  const data: ParsedVisitTeamImportRow = { rowNumber };
  headers.forEach((header, index) => {
    const value = cells[index]?.trim() ?? "";
    if (!value) return;
    if (header === "teamCode") data.teamCode = value;
    if (header === "leaderMemberCode") data.leaderMemberCode = value;
    if (header === "area") data.area = value;
  });
  return data;
}

export function parseVisitTeamImportHeaders(
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
  if (!headers.includes("teamCode") || !headers.includes("area")) {
    return {
      ok: false,
      error:
        'File cần cột "Mã tổ thăm viếng" và "Khu vực phụ trách". Tải file mẫu để tham khảo.',
    };
  }

  return { ok: true, headers };
}

export function extractVisitTeamImportRows(
  parsed: string[][]
): SpreadsheetDataRow[] {
  return extractSpreadsheetDataRows(parsed);
}

export function validateVisitTeamImportRow(
  headers: string[],
  cells: string[],
  rowNumber: number
):
  | {
      ok: true;
      data: {
        teamCode: string;
        leaderMemberCode: string | null;
        area: string;
      };
    }
  | { ok: false; error: string } {
  const row = rowToData(headers, cells, rowNumber);

  const teamCode = row.teamCode?.trim();
  if (!teamCode) {
    return { ok: false, error: "Thiếu mã tổ thăm viếng" };
  }

  const area = row.area?.trim();
  if (!area) {
    return { ok: false, error: "Thiếu khu vực phụ trách" };
  }

  return {
    ok: true,
    data: {
      teamCode,
      leaderMemberCode: row.leaderMemberCode?.trim() || null,
      area,
    },
  };
}

export type VisitTeamImportDataRow = SpreadsheetDataRow;
