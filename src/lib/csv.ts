export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

export const CSV_UTF8_BOM = "\uFEFF";

/** Parse CSV content (supports quoted fields and UTF-8 BOM). */
export function parseCsv(content: string): string[][] {
  const text = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export const MEMBER_IMPORT_TEMPLATE_HEADERS = [
  "Họ và lót",
  "Tên",
  "Mã hộ",
  "Tình trạng",
  "Di động",
  "Ban ngành",
  "Mã tổ thăm viếng",
];

export const MEMBER_IMPORT_TEMPLATE_SAMPLE = [
  ["Nguyễn Văn", "An", "0001", "Hoạt động", "0901234567", "Thanh niên", "3A"],
];

export function buildMemberImportTemplate(): string {
  return buildCsv(MEMBER_IMPORT_TEMPLATE_HEADERS, MEMBER_IMPORT_TEMPLATE_SAMPLE);
}
