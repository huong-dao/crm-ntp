import * as XLSX from "xlsx";
import {
  MEMBER_IMPORT_TEMPLATE_HEADERS,
  MEMBER_IMPORT_TEMPLATE_SAMPLE,
  parseCsv,
} from "@/lib/csv";

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
