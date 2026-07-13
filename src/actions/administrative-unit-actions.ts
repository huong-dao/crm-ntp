"use server";

import { readFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import {
  chunkArray,
  parseAdministrativeUnitCsv,
  type ParsedAdministrativeUnits,
} from "@/lib/administrative-unit-import";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { prisma } from "@/lib/prisma";

const DEFAULT_CSV_RELATIVE_PATH =
  "docs/csv/Danh sách cấp tỉnh, quận huyện, phường xã ___30_06_2025__địa chỉ 3 cấp.xlsx - Sheet1.csv";

export type ProvinceListItem = {
  id: string;
  code: string;
  name: string;
  districtCount: number;
  wardCount: number;
};

export type ProvincesResult = {
  provinces: ProvinceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProvinceFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AdministrativeUnitStats = {
  provinceCount: number;
  districtCount: number;
  wardCount: number;
};

export type ProvinceOption = {
  id: string;
  code: string;
  name: string;
};

export type DistrictOption = {
  id: string;
  code: string;
  name: string;
};

export type WardOption = {
  id: string;
  code: string;
  name: string;
  level: string;
  districtName: string;
};

export type ProvinceDetail = {
  id: string;
  code: string;
  name: string;
  districts: {
    id: string;
    code: string;
    name: string;
    wardCount: number;
    wards: {
      id: string;
      code: string;
      name: string;
      level: string;
    }[];
  }[];
};

export type ImportAdministrativeUnitsResult = {
  provinceCount: number;
  districtCount: number;
  wardCount: number;
};

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

async function importAdministrativeUnitsData(
  data: ParsedAdministrativeUnits
): Promise<ImportAdministrativeUnitsResult> {
  await prisma.$transaction(async (tx) => {
    await tx.ward.deleteMany();
    await tx.district.deleteMany();
    await tx.province.deleteMany();

    for (const batch of chunkArray(data.provinces, 50)) {
      await tx.province.createMany({
        data: batch.map((province) => ({
          code: province.code,
          name: province.name,
        })),
      });
    }

    const provinceRows = await tx.province.findMany({
      select: { id: true, code: true },
    });
    const provinceIdByCode = new Map(
      provinceRows.map((row) => [row.code, row.id])
    );

    const districtPayload = data.districts
      .map((district) => {
        const provinceId = provinceIdByCode.get(district.provinceCode);
        if (!provinceId) return null;
        return {
          code: district.code,
          name: district.name,
          provinceId,
        };
      })
      .filter((item): item is { code: string; name: string; provinceId: string } =>
        Boolean(item)
      );

    for (const batch of chunkArray(districtPayload, 100)) {
      await tx.district.createMany({ data: batch });
    }

    const districtRows = await tx.district.findMany({
      select: { id: true, code: true },
    });
    const districtIdByCode = new Map(
      districtRows.map((row) => [row.code, row.id])
    );

    const wardPayload = data.wards
      .map((ward) => {
        const districtId = districtIdByCode.get(ward.districtCode);
        if (!districtId) return null;
        return {
          code: ward.code,
          name: ward.name,
          level: ward.level,
          districtId,
        };
      })
      .filter(
        (
          item
        ): item is {
          code: string;
          name: string;
          level: string;
          districtId: string;
        } => Boolean(item)
      );

    for (const batch of chunkArray(wardPayload, 500)) {
      await tx.ward.createMany({ data: batch });
    }
  });

  return {
    provinceCount: data.provinces.length,
    districtCount: data.districts.length,
    wardCount: data.wards.length,
  };
}

export async function getAdministrativeUnitStats(): Promise<AdministrativeUnitStats> {
  await requireAuth();

  const [provinceCount, districtCount, wardCount] = await prisma.$transaction([
    prisma.province.count(),
    prisma.district.count(),
    prisma.ward.count(),
  ]);

  return { provinceCount, districtCount, wardCount };
}

export async function getProvinces(
  filters: ProvinceFilters = {}
): Promise<ProvincesResult> {
  await requireAuth();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = filters.search?.trim();

  const where: Prisma.ProvinceWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.province.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: {
            districts: true,
          },
        },
        districts: {
          select: {
            _count: {
              select: { wards: true },
            },
          },
        },
      },
    }),
    prisma.province.count({ where }),
  ]);

  const provinces: ProvinceListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    districtCount: row._count.districts,
    wardCount: row.districts.reduce(
      (sum, district) => sum + district._count.wards,
      0
    ),
  }));

  return {
    provinces,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProvinceById(
  id: string
): Promise<ProvinceDetail | null> {
  await requireAuth();

  const province = await prisma.province.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      districts: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          wards: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
            },
          },
        },
      },
    },
  });

  if (!province) return null;

  return {
    id: province.id,
    code: province.code,
    name: province.name,
    districts: province.districts.map((district) => ({
      id: district.id,
      code: district.code,
      name: district.name,
      wardCount: district.wards.length,
      wards: district.wards,
    })),
  };
}

export async function getProvinceOptions(): Promise<ProvinceOption[]> {
  await requireAuth();

  return prisma.province.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getDistrictOptionsByProvince(
  provinceId: string
): Promise<DistrictOption[]> {
  await requireAuth();
  if (!provinceId) return [];

  return prisma.district.findMany({
    where: { provinceId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getWardOptionsByDistrict(
  districtId: string
): Promise<WardOption[]> {
  await requireAuth();
  if (!districtId) return [];

  const wards = await prisma.ward.findMany({
    where: { districtId },
    select: {
      id: true,
      code: true,
      name: true,
      level: true,
      district: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return wards.map((ward) => ({
    id: ward.id,
    code: ward.code,
    name: ward.name,
    level: ward.level,
    districtName: ward.district.name,
  }));
}

export async function getWardOptionsByProvince(
  provinceId: string
): Promise<WardOption[]> {
  await requireAuth();
  if (!provinceId) return [];

  const wards = await prisma.ward.findMany({
    where: { district: { provinceId } },
    select: {
      id: true,
      code: true,
      name: true,
      level: true,
      district: { select: { name: true } },
    },
    orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
  });

  return wards.map((ward) => ({
    id: ward.id,
    code: ward.code,
    name: ward.name,
    level: ward.level,
    districtName: ward.district.name,
  }));
}

export async function importAdministrativeUnitsFromDefaultCsv(): Promise<
  ActionResult<ImportAdministrativeUnitsResult>
> {
  try {
    await requireAdmin();

    const csvPath = path.join(process.cwd(), DEFAULT_CSV_RELATIVE_PATH);
    const content = await readFile(csvPath, "utf8");
    const parsed = parseAdministrativeUnitCsv(content);

    if (!parsed.ok) {
      return { success: false, error: parsed.error };
    }

    const result = await importAdministrativeUnitsData(parsed.data);

    revalidatePath("/administrative-units");
    revalidatePath("/members");

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return {
        success: false,
        error: "Không tìm thấy file CSV mặc định trong thư mục docs/csv",
      };
    }
    return { success: false, error: "Không thể import dữ liệu địa chỉ hành chính" };
  }
}

export async function importAdministrativeUnitsFromCsvContent(
  content: string
): Promise<ActionResult<ImportAdministrativeUnitsResult>> {
  try {
    await requireAdmin();

    const parsed = parseAdministrativeUnitCsv(content);
    if (!parsed.ok) {
      return { success: false, error: parsed.error };
    }

    const result = await importAdministrativeUnitsData(parsed.data);

    revalidatePath("/administrative-units");
    revalidatePath("/members");

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Không thể import dữ liệu địa chỉ hành chính" };
  }
}
