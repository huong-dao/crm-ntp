import * as XLSX from "xlsx";
import { parseCsv } from "@/lib/csv";

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Đọc file Excel/CSV trên trình duyệt (Client Component). */
export async function parseSpreadsheetFile(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8")
      .decode(buffer)
      .replace(/^\uFEFF/, "");
    return parseCsv(text);
  }

  const workbook = XLSX.read(buffer, { type: "array" });
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
