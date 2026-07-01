import type { Gender, MemberStatus } from "@prisma/client";
import { importFieldError } from "@/lib/import-error-format";
import { MEMBER_STATUSES, STATUS_LABELS } from "@/lib/member-list";

const CURRENT_YEAR = new Date().getFullYear();
const VALID_STATUS_LABELS = MEMBER_STATUSES.map((status) => STATUS_LABELS[status]).join(
  ", "
);
const PHONE_PATTERN = /^[\d\s+\-()]+$/;

const HEADER_ALIASES: Record<string, string> = {
  code: "code",
  "mã tín hữu": "code",
  "ma tin huu": "code",
  fullname: "fullName",
  "họ tên": "fullName",
  "ho ten": "fullName",
  "họ tên đầy đủ": "fullName",
  "ho ten day du": "fullName",
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
  housenumber: "houseNumber",
  "số nhà": "houseNumber",
  "so nha": "houseNumber",
  street: "street",
  "tên đường": "street",
  "ten duong": "street",
  oldward: "oldWard",
  "phường cũ": "oldWard",
  "phuong cu": "oldWard",
  olddistrict: "oldDistrict",
  "quận cũ": "oldDistrict",
  "quan cu": "oldDistrict",
  oldprovince: "oldProvince",
  "tỉnh cũ": "oldProvince",
  "tinh cu": "oldProvince",
  newward: "newWard",
  "phường mới": "newWard",
  "phuong moi": "newWard",
  newprovince: "newProvince",
  "tỉnh mới": "newProvince",
  "tinh moi": "newProvince",
  mobile1: "mobile1",
  mobile: "mobile1",
  "di động": "mobile1",
  "di dong": "mobile1",
  "di động 1": "mobile1",
  "di dong 1": "mobile1",
  mobile2: "mobile2",
  "di động 2": "mobile2",
  "di dong 2": "mobile2",
  landline: "landline",
  "đt bàn": "landline",
  "dt ban": "landline",
  birthyear: "birthYear",
  "năm sinh": "birthYear",
  "nam sinh": "birthYear",
  gender: "gender",
  "giới tính": "gender",
  "gioi tinh": "gender",
  occupation: "occupation",
  "nghề nghiệp": "occupation",
  "nghe nghiep": "occupation",
  ishead: "isHead",
  "chủ hộ": "isHead",
  "chu ho": "isHead",
  relationship: "relationship",
  "quan hệ": "relationship",
  "quan he": "relationship",
  isbaptized: "isBaptized",
  "báp têm": "isBaptized",
  "bap tem": "isBaptized",
  baptismyear: "baptismYear",
  "năm báp têm": "baptismYear",
  "nam bap tem": "baptismYear",
  agedepartment: "ageDepartment",
  "ban ngành theo tuổi": "ageDepartment",
  "ban nganh theo tuoi": "ageDepartment",
  actualdepartment: "actualDepartment",
  "ban ngành thực tế": "actualDepartment",
  "ban nganh thuc te": "actualDepartment",
  "ban ngành": "actualDepartment",
  "ban nganh": "actualDepartment",
  boardservicedate: "boardServiceDate",
  "ban chấp sự": "boardServiceDate",
  "ban chap su": "boardServiceDate",
  visitdepartment: "visitDepartment",
  "ban thăm viếng": "visitDepartment",
  "ban tham vieng": "visitDepartment",
  visitteamcode: "visitTeamCode",
  "mã tổ thăm viếng": "visitTeamCode",
  "ma to tham vieng": "visitTeamCode",
  "mã tổ": "visitTeamCode",
  "ma to": "visitTeamCode",
  notes: "notes",
  "ghi chú": "notes",
  "ghi chu": "notes",
};

export type ParsedImportRow = {
  rowNumber: number;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  householdCode?: string;
  status?: string;
  houseNumber?: string;
  street?: string;
  oldWard?: string;
  oldDistrict?: string;
  oldProvince?: string;
  newWard?: string;
  newProvince?: string;
  mobile1?: string;
  mobile2?: string;
  landline?: string;
  birthYear?: string;
  gender?: string;
  occupation?: string;
  isHead?: string;
  relationship?: string;
  isBaptized?: string;
  baptismYear?: string;
  ageDepartment?: string;
  actualDepartment?: string;
  boardServiceDate?: string;
  visitDepartment?: string;
  visitTeamCode?: string;
  notes?: string;
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
      case "code":
        data.code = value;
        break;
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
      case "houseNumber":
        data.houseNumber = value;
        break;
      case "street":
        data.street = value;
        break;
      case "oldWard":
        data.oldWard = value;
        break;
      case "oldDistrict":
        data.oldDistrict = value;
        break;
      case "oldProvince":
        data.oldProvince = value;
        break;
      case "newWard":
        data.newWard = value;
        break;
      case "newProvince":
        data.newProvince = value;
        break;
      case "mobile1":
        data.mobile1 = value;
        break;
      case "mobile2":
        data.mobile2 = value;
        break;
      case "landline":
        data.landline = value;
        break;
      case "birthYear":
        data.birthYear = value;
        break;
      case "gender":
        data.gender = value;
        break;
      case "occupation":
        data.occupation = value;
        break;
      case "isHead":
        data.isHead = value;
        break;
      case "relationship":
        data.relationship = value;
        break;
      case "isBaptized":
        data.isBaptized = value;
        break;
      case "baptismYear":
        data.baptismYear = value;
        break;
      case "ageDepartment":
        data.ageDepartment = value;
        break;
      case "actualDepartment":
        data.actualDepartment = value;
        break;
      case "boardServiceDate":
        data.boardServiceDate = value;
        break;
      case "visitDepartment":
        data.visitDepartment = value;
        break;
      case "visitTeamCode":
        data.visitTeamCode = value;
        break;
      case "notes":
        data.notes = value;
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

export function parseYesNo(value?: string): boolean {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return ["y", "yes", "có", "co", "true", "1", "x"].includes(normalized);
}

export function parseImportGender(value?: string): Gender | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (["nam", "male", "m"].includes(normalized)) return "male";
  if (["nữ", "nu", "female", "f"].includes(normalized)) return "female";
  return null;
}

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validateOptionalYear(
  value: string | undefined,
  column: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!value?.trim()) {
    return { ok: true, value: null };
  }

  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    if (year < 1900 || year > CURRENT_YEAR) {
      return {
        ok: false,
        error: importFieldError(
          column,
          `phải từ 1900 đến ${CURRENT_YEAR}`,
          trimmed
        ),
      };
    }
    return { ok: true, value: year };
  }

  const parsedDate = new Date(trimmed);
  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    if (year < 1900 || year > CURRENT_YEAR) {
      return {
        ok: false,
        error: importFieldError(
          column,
          `phải từ 1900 đến ${CURRENT_YEAR}`,
          trimmed
        ),
      };
    }
    return { ok: true, value: year };
  }

  return {
    ok: false,
    error: importFieldError(
      column,
      "phải là năm (4 chữ số) hoặc ngày hợp lệ",
      trimmed
    ),
  };
}

function validateOptionalInt(
  value: string | undefined,
  column: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!value?.trim()) {
    return { ok: true, value: null };
  }

  const trimmed = value.trim();
  const num = parseInt(trimmed, 10);
  if (!Number.isFinite(num)) {
    return {
      ok: false,
      error: importFieldError(column, "phải là số nguyên", trimmed),
    };
  }
  return { ok: true, value: num };
}

function validatePhone(
  value: string | undefined,
  column: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!value?.trim()) {
    return { ok: true, value: null };
  }

  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: importFieldError(
        column,
        "chỉ được chứa số, khoảng trắng và ký tự + - ( )",
        trimmed
      ),
    };
  }
  return { ok: true, value: trimmed };
}

export type ImportRowDisplay = {
  memberCode: string | null;
  memberName: string | null;
  householdCode: string | null;
};

export function extractImportRowDisplay(row: ParsedImportRow): ImportRowDisplay {
  const memberCode = row.code?.trim() || null;
  const householdCode = row.householdCode?.trim() || null;

  const first = row.firstName?.trim();
  const last = row.lastName?.trim();
  let memberName: string | null = null;

  if (first && last) {
    memberName = `${first} ${last}`;
  } else if (row.fullName?.trim()) {
    memberName = row.fullName.trim();
  } else if (first) {
    memberName = first;
  } else if (last) {
    memberName = last;
  }

  return { memberCode, memberName, householdCode };
}

export function extractImportRowDisplayFromCells(
  headers: string[],
  cells: string[],
  rowNumber: number
): ImportRowDisplay {
  return extractImportRowDisplay(rowToImportData(headers, cells, rowNumber));
}

export function validateImportRow(
  row: ParsedImportRow
): { ok: true; data: ImportRowValid } | { ok: false; error: string } {
  let firstName = row.firstName?.trim() ?? "";
  let lastName = row.lastName?.trim() ?? "";

  if (row.fullName && (!firstName || !lastName)) {
    const split = splitFullName(row.fullName);
    firstName = split.firstName;
    lastName = split.lastName;
  }

  if (!firstName) {
    return { ok: false, error: importFieldError("Họ và lót", "không được trống") };
  }
  if (!lastName) {
    return { ok: false, error: importFieldError("Tên", "không được trống") };
  }

  const householdCode = row.householdCode?.trim();
  if (!householdCode) {
    return { ok: false, error: importFieldError("Mã hộ", "không được trống") };
  }

  const memberCode = row.code?.trim();
  const visitTeamCode = row.visitTeamCode?.trim();

  let status: MemberStatus = "active";
  if (row.status?.trim()) {
    const parsedStatus = parseImportStatus(row.status);
    if (!parsedStatus) {
      return {
        ok: false,
        error: importFieldError(
          "Tình trạng",
          `không hợp lệ. Chấp nhận: ${VALID_STATUS_LABELS}`,
          row.status
        ),
      };
    }
    status = parsedStatus;
  }

  let gender: Gender | null = null;
  if (row.gender?.trim()) {
    const parsedGender = parseImportGender(row.gender);
    if (!parsedGender) {
      return {
        ok: false,
        error: importFieldError(
          "Giới tính",
          "không hợp lệ. Chấp nhận: Nam, Nữ",
          row.gender
        ),
      };
    }
    gender = parsedGender;
  }

  const birthYearResult = validateOptionalYear(row.birthYear, "Năm sinh");
  if (!birthYearResult.ok) {
    return { ok: false, error: birthYearResult.error };
  }

  const isHead = parseYesNo(row.isHead);
  const isBaptized = parseYesNo(row.isBaptized);

  let baptismYear: number | null = null;
  if (isBaptized && row.baptismYear?.trim()) {
    const baptismResult = validateOptionalInt(row.baptismYear, "Năm báp têm");
    if (!baptismResult.ok) {
      return { ok: false, error: baptismResult.error };
    }
    baptismYear = baptismResult.value;
  }

  const boardResult = validateOptionalYear(row.boardServiceDate, "Ban chấp sự");
  if (!boardResult.ok) {
    return { ok: false, error: boardResult.error };
  }

  const visitDeptResult = validateOptionalYear(row.visitDepartment, "Ban thăm viếng");
  if (!visitDeptResult.ok) {
    return { ok: false, error: visitDeptResult.error };
  }

  const mobile1Result = validatePhone(row.mobile1, "Di động 1");
  if (!mobile1Result.ok) {
    return { ok: false, error: mobile1Result.error };
  }

  const mobile2Result = validatePhone(row.mobile2, "Di động 2");
  if (!mobile2Result.ok) {
    return { ok: false, error: mobile2Result.error };
  }

  const landlineResult = validatePhone(row.landline, "ĐT bàn");
  if (!landlineResult.ok) {
    return { ok: false, error: landlineResult.error };
  }

  const houseNumber = row.houseNumber?.trim();
  if (houseNumber && houseNumber.length > 191) {
    return {
      ok: false,
      error: importFieldError("Số nhà", "tối đa 191 ký tự", houseNumber),
    };
  }

  const occupation = row.occupation?.trim();
  if (occupation && occupation.length > 200) {
    return {
      ok: false,
      error: importFieldError("Nghề nghiệp", "tối đa 200 ký tự", occupation),
    };
  }

  const relationship = row.relationship?.trim();
  if (relationship && relationship.length > 100) {
    return {
      ok: false,
      error: importFieldError("Quan hệ", "tối đa 100 ký tự", relationship),
    };
  }

  const notes = row.notes?.trim();
  if (notes && notes.length > 5000) {
    return {
      ok: false,
      error: importFieldError("Ghi chú", "tối đa 5000 ký tự"),
    };
  }

  return {
    ok: true,
    data: {
      memberCode: memberCode || null,
      firstName,
      lastName,
      householdCode,
      status,
      houseNumber: emptyToNull(row.houseNumber),
      street: emptyToNull(row.street),
      oldWard: emptyToNull(row.oldWard),
      oldDistrict: emptyToNull(row.oldDistrict),
      oldProvince: emptyToNull(row.oldProvince),
      newWard: emptyToNull(row.newWard),
      newProvince: emptyToNull(row.newProvince),
      mobile1: mobile1Result.value,
      mobile2: mobile2Result.value,
      landline: landlineResult.value,
      birthYear: birthYearResult.value,
      gender,
      occupation: emptyToNull(row.occupation),
      isHead,
      relationship: emptyToNull(row.relationship),
      isBaptized,
      baptismYear,
      ageDepartment: emptyToNull(row.ageDepartment),
      actualDepartment: emptyToNull(row.actualDepartment),
      boardServiceYear: boardResult.value,
      visitDepartmentYear: visitDeptResult.value,
      visitTeamCode: visitTeamCode || null,
      notes: emptyToNull(row.notes),
    },
  };
}

export type ImportRowValid = {
  memberCode: string | null;
  firstName: string;
  lastName: string;
  householdCode: string;
  status: MemberStatus;
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
  ageDepartment: string | null;
  actualDepartment: string | null;
  boardServiceYear: number | null;
  visitDepartmentYear: number | null;
  visitTeamCode: string | null;
  notes: string | null;
};

export type ImportDataRow = {
  rowNumber: number;
  cells: string[];
};

export function parseImportHeaders(
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

  const headers = mapCsvHeaders(parsed[0]);
  const hasNameColumn =
    headers.includes("firstName") ||
    headers.includes("lastName") ||
    headers.includes("fullName");
  const hasHousehold = headers.includes("householdCode");

  if (!hasNameColumn || !hasHousehold) {
    return {
      ok: false,
      error:
        "File cần cột Họ và lót/Tên (hoặc Họ tên) và Mã hộ. Tải file mẫu để tham khảo.",
    };
  }

  return { ok: true, headers };
}

/** Lấy các dòng dữ liệu (bỏ qua dòng trống), giữ số dòng Excel gốc. */
export function extractImportDataRows(parsed: string[][]): ImportDataRow[] {
  const rows: ImportDataRow[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const cells = parsed[i];
    if (cells.every((cell) => !cell.trim())) continue;
    rows.push({ rowNumber: i + 1, cells });
  }
  return rows;
}
