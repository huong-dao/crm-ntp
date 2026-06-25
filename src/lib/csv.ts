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
  "Mã tổ thăm viếng",
  "Mã hộ",
  "Mã tín hữu",
  "Tình trạng",
  "Họ và lót",
  "Tên",
  "Số nhà",
  "Tên đường",
  "Phường cũ",
  "Quận cũ",
  "Tỉnh cũ",
  "Phường mới",
  "Tỉnh mới",
  "Di động 1",
  "Di động 2",
  "ĐT bàn",
  "Năm sinh",
  "Giới tính",
  "Nghề nghiệp",
  "Chủ hộ",
  "Quan hệ",
  "Báp têm",
  "Năm báp têm",
  "Ban ngành theo tuổi",
  "Ban ngành thực tế",
  "Ban chấp sự",
  "Ban thăm viếng",
  "Ghi chú",
];

export const MEMBER_IMPORT_TEMPLATE_SAMPLE = [
  [
    "3B",
    "0057",
    "",
    "Hoạt động",
    "Nguyễn Văn",
    "An",
    "478/34",
    "Hoà Hảo",
    "15",
    "10",
    "Hồ Chí Minh",
    "",
    "",
    "0901234567",
    "",
    "",
    "1986",
    "Nam",
    "Kỹ sư",
    "Y",
    "",
    "Y",
    "2010",
    "Người lớn",
    "Thanh niên",
    "",
    "",
    "",
  ],
];

export function buildMemberImportTemplate(): string {
  return buildCsv(MEMBER_IMPORT_TEMPLATE_HEADERS, MEMBER_IMPORT_TEMPLATE_SAMPLE);
}
