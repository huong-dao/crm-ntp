import type { VisitRequestStatus, VisitRequestType } from "@prisma/client";
import {
  VISIT_REQUEST_STATUS_LABELS,
  VISIT_REQUEST_TYPE_LABELS,
} from "@/lib/visit-request-list";
import {
  extractSpreadsheetDataRows,
  normalizeSpreadsheetHeader,
  type SpreadsheetDataRow,
} from "@/lib/spreadsheet-import";

const HEADER_ALIASES: Record<string, string> = {
  "mã đơn": "code",
  "ma don": "code",
  code: "code",
  "mã hộ": "householdCode",
  "ma ho": "householdCode",
  householdcode: "householdCode",
  "mã tổ thăm viếng": "visitTeamCode",
  "ma to tham vieng": "visitTeamCode",
  visitteamcode: "visitTeamCode",
  "lịch thăm viếng": "scheduledDate",
  "lich tham vieng": "scheduledDate",
  scheduleddate: "scheduledDate",
  "ngày hẹn thăm": "scheduledDate",
  "ngay hen tham": "scheduledDate",
  "ngày thăm thực tế": "actualDate",
  "ngay tham thuc te": "actualDate",
  actualdate: "actualDate",
  "tình trạng": "status",
  "tinh trang": "status",
  status: "status",
  "loại hình": "visitType",
  "loai hinh": "visitType",
  visittype: "visitType",
  "loại hình thăm viếng": "visitType",
  "mã tín hữu đại diện": "representativeMemberCode",
  "ma tin huu dai dien": "representativeMemberCode",
  representativemembercode: "representativeMemberCode",
  "nhân sự": "staffCodes",
  "nhan su": "staffCodes",
  staffcodes: "staffCodes",
  "nội dung": "content",
  "noi dung": "content",
  content: "content",
};

export const VISIT_REQUEST_IMPORT_HEADERS = [
  "Mã đơn",
  "Mã hộ",
  "Mã tổ thăm viếng",
  "Lịch thăm viếng",
  "Ngày thăm thực tế",
  "Tình trạng",
  "Loại hình",
  "Mã tín hữu đại diện",
  "Nhân sự",
  "Nội dung",
];

export const VISIT_REQUEST_IMPORT_SAMPLE: string[][] = [
  [
    "",
    "HG00001",
    "TV01",
    "28/10/2026",
    "",
    "Lên lịch",
    "Tại nhà",
    "",
    "",
    "Thăm viếng định kỳ",
  ],
  [
    "",
    "HG00002",
    "TV01",
    "15/09/2026",
    "16/09/2026",
    "Hoàn thành",
    "Tại nhà",
    "TV00001",
    "TV00001, TV00002",
    "Đã thăm hỏi sức khỏe",
  ],
];

function mapHeaders(headers: string[]): string[] {
  return headers.map(
    (h) => HEADER_ALIASES[normalizeSpreadsheetHeader(h)] ?? normalizeSpreadsheetHeader(h)
  );
}

export type ParsedVisitRequestImportRow = {
  rowNumber: number;
  code?: string;
  householdCode?: string;
  visitTeamCode?: string;
  scheduledDate?: string;
  actualDate?: string;
  status?: string;
  visitType?: string;
  representativeMemberCode?: string;
  staffCodes?: string;
  content?: string;
};

function rowToData(
  headers: string[],
  cells: string[],
  rowNumber: number
): ParsedVisitRequestImportRow {
  const data: ParsedVisitRequestImportRow = { rowNumber };
  headers.forEach((header, index) => {
    const value = cells[index]?.trim() ?? "";
    if (!value) return;
    if (header === "code") data.code = value;
    if (header === "householdCode") data.householdCode = value;
    if (header === "visitTeamCode") data.visitTeamCode = value;
    if (header === "scheduledDate") data.scheduledDate = value;
    if (header === "actualDate") data.actualDate = value;
    if (header === "status") data.status = value;
    if (header === "visitType") data.visitType = value;
    if (header === "representativeMemberCode")
      data.representativeMemberCode = value;
    if (header === "staffCodes") data.staffCodes = value;
    if (header === "content") data.content = value;
  });
  return data;
}

export function parseVisitRequestImportHeaders(
  parsed: string[][]
): { ok: true; headers: string[] } | { ok: false; error: string } {
  if (parsed.length < 2) {
    return {
      ok: false,
      error: "File trống hoặc thiếu dữ liệu (cần dòng tiêu đề và ít nhất 1 dòng)",
    };
  }

  const headers = mapHeaders(parsed[0]);
  if (!headers.includes("householdCode") || !headers.includes("visitTeamCode")) {
    return {
      ok: false,
      error:
        'File cần cột "Mã hộ" và "Mã tổ thăm viếng". Tải file mẫu để tham khảo.',
    };
  }

  if (!headers.includes("scheduledDate")) {
    return {
      ok: false,
      error: 'File cần cột "Lịch thăm viếng". Tải file mẫu để tham khảo.',
    };
  }

  return { ok: true, headers };
}

export function extractVisitRequestImportRows(
  parsed: string[][]
): SpreadsheetDataRow[] {
  return extractSpreadsheetDataRows(parsed);
}

export type VisitRequestImportDataRow = SpreadsheetDataRow;

const STATUS_LABEL_TO_VALUE = new Map<string, VisitRequestStatus>(
  (Object.entries(VISIT_REQUEST_STATUS_LABELS) as [VisitRequestStatus, string][]).map(
    ([value, label]) => [label.toLowerCase(), value]
  )
);

const TYPE_LABEL_TO_VALUE = new Map<string, VisitRequestType>(
  (Object.entries(VISIT_REQUEST_TYPE_LABELS) as [VisitRequestType, string][]).map(
    ([value, label]) => [label.toLowerCase(), value]
  )
);

export function parseImportDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function parseImportStatus(value: string): VisitRequestStatus | null {
  return STATUS_LABEL_TO_VALUE.get(value.trim().toLowerCase()) ?? null;
}

export function parseImportVisitType(value: string): VisitRequestType | null {
  return TYPE_LABEL_TO_VALUE.get(value.trim().toLowerCase()) ?? null;
}

export type ValidatedVisitRequestImportRow = {
  code: string | null;
  householdCode: string;
  visitTeamCode: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  visitType: VisitRequestType;
  representativeMemberCode: string | null;
  staffCodes: string | null;
  content: string | null;
};

export function validateVisitRequestImportRow(
  headers: string[],
  cells: string[],
  rowNumber: number
): { ok: true; data: ValidatedVisitRequestImportRow } | { ok: false; error: string } {
  const row = rowToData(headers, cells, rowNumber);

  const householdCode = row.householdCode?.trim();
  if (!householdCode) {
    return { ok: false, error: "Thiếu mã hộ" };
  }

  const visitTeamCode = row.visitTeamCode?.trim();
  if (!visitTeamCode) {
    return { ok: false, error: "Thiếu mã tổ thăm viếng" };
  }

  const scheduledDateRaw = row.scheduledDate?.trim();
  if (!scheduledDateRaw) {
    return { ok: false, error: "Thiếu lịch thăm viếng" };
  }
  const scheduledDate = parseImportDate(scheduledDateRaw);
  if (!scheduledDate) {
    return {
      ok: false,
      error: `Lịch thăm viếng "${scheduledDateRaw}" không hợp lệ (dùng dd/mm/yyyy)`,
    };
  }

  let actualDate: Date | null = null;
  if (row.actualDate?.trim()) {
    actualDate = parseImportDate(row.actualDate.trim());
    if (!actualDate) {
      return {
        ok: false,
        error: `Ngày thăm thực tế "${row.actualDate}" không hợp lệ (dùng dd/mm/yyyy)`,
      };
    }
  }

  let status: VisitRequestStatus = "scheduled";
  if (row.status?.trim()) {
    const parsedStatus = parseImportStatus(row.status);
    if (!parsedStatus) {
      return {
        ok: false,
        error: `Tình trạng "${row.status}" không hợp lệ (Lên lịch/Hoàn thành/Hủy lịch)`,
      };
    }
    status = parsedStatus;
  }

  if (status === "completed" && !actualDate) {
    actualDate = scheduledDate;
  }

  let visitType: VisitRequestType = "at_home";
  if (row.visitType?.trim()) {
    const parsedType = parseImportVisitType(row.visitType);
    if (!parsedType) {
      return {
        ok: false,
        error: `Loại hình "${row.visitType}" không hợp lệ (Tại nhà/Tại nhà thờ/Qua điện thoại/Khác)`,
      };
    }
    visitType = parsedType;
  }

  return {
    ok: true,
    data: {
      code: row.code?.trim() || null,
      householdCode,
      visitTeamCode,
      scheduledDate,
      actualDate,
      status,
      visitType,
      representativeMemberCode: row.representativeMemberCode?.trim() || null,
      staffCodes: row.staffCodes?.trim() || null,
      content: row.content?.trim() || null,
    },
  };
}
