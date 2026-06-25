export type SpreadsheetDataRow = {
  rowNumber: number;
  cells: string[];
};

/** Lấy các dòng dữ liệu (bỏ qua dòng trống), giữ số dòng Excel gốc. */
export function extractSpreadsheetDataRows(
  parsed: string[][]
): SpreadsheetDataRow[] {
  const rows: SpreadsheetDataRow[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const cells = parsed[i];
    if (cells.every((cell) => !cell.trim())) continue;
    rows.push({ rowNumber: i + 1, cells });
  }
  return rows;
}

export function normalizeSpreadsheetHeader(header: string): string {
  return header.trim().toLowerCase();
}
