import { parseCsv } from "@/lib/csv";

export const ADMINISTRATIVE_UNIT_CSV_HEADERS = [
  "Tỉnh Thành Phố",
  "Mã TP",
  "Quận Huyện",
  "Mã QH",
  "Phường Xã",
  "Mã PX",
  "Cấp",
] as const;

export type ParsedAdministrativeUnitRow = {
  provinceName: string;
  provinceCode: string;
  districtName: string;
  districtCode: string;
  wardName: string;
  wardCode: string;
  level: string;
};

export type ParsedAdministrativeUnits = {
  provinces: { code: string; name: string }[];
  districts: {
    code: string;
    name: string;
    provinceCode: string;
  }[];
  wards: {
    code: string;
    name: string;
    level: string;
    districtCode: string;
  }[];
};

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

export function validateAdministrativeUnitHeaders(headers: string[]): string | null {
  if (headers.length < ADMINISTRATIVE_UNIT_CSV_HEADERS.length) {
    return "File thiếu cột — cần đủ 7 cột: Tỉnh, Mã TP, Quận/Huyện, Mã QH, Phường/Xã, Mã PX, Cấp";
  }

  for (let i = 0; i < ADMINISTRATIVE_UNIT_CSV_HEADERS.length; i++) {
    if (normalizeHeader(headers[i]) !== ADMINISTRATIVE_UNIT_CSV_HEADERS[i]) {
      return `Cột ${i + 1} phải là "${ADMINISTRATIVE_UNIT_CSV_HEADERS[i]}"`;
    }
  }

  return null;
}

export function parseAdministrativeUnitRows(rows: string[][]): ParsedAdministrativeUnits {
  const provinceMap = new Map<string, string>();
  const districtMap = new Map<
    string,
    { name: string; provinceCode: string }
  >();
  const wardMap = new Map<
    string,
    { name: string; level: string; districtCode: string }
  >();

  for (const row of rows) {
    if (row.length < 7) continue;

    const [
      provinceName,
      provinceCode,
      districtName,
      districtCode,
      wardName,
      wardCode,
      level,
    ] = row.map((cell) => cell.trim());

    if (!provinceCode || !districtCode || !wardCode) continue;

    provinceMap.set(provinceCode, provinceName);
    districtMap.set(districtCode, { name: districtName, provinceCode });
    wardMap.set(wardCode, { name: wardName, level, districtCode });
  }

  return {
    provinces: [...provinceMap.entries()].map(([code, name]) => ({ code, name })),
    districts: [...districtMap.entries()].map(([code, value]) => ({
      code,
      name: value.name,
      provinceCode: value.provinceCode,
    })),
    wards: [...wardMap.entries()].map(([code, value]) => ({
      code,
      name: value.name,
      level: value.level,
      districtCode: value.districtCode,
    })),
  };
}

export function parseAdministrativeUnitCsv(content: string): {
  ok: true;
  data: ParsedAdministrativeUnits;
} | {
  ok: false;
  error: string;
} {
  const rows = parseCsv(content);
  if (rows.length < 2) {
    return { ok: false, error: "File không có dữ liệu" };
  }

  const headerError = validateAdministrativeUnitHeaders(rows[0]);
  if (headerError) {
    return { ok: false, error: headerError };
  }

  const data = parseAdministrativeUnitRows(rows.slice(1));
  if (data.provinces.length === 0) {
    return { ok: false, error: "Không tìm thấy tỉnh/thành phố hợp lệ" };
  }

  return { ok: true, data };
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
