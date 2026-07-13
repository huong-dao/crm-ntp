const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const ADMINISTRATIVE_UNIT_CSV = path.join(
  process.cwd(),
  "docs/csv/Danh sách cấp tỉnh, quận huyện, phường xã ___30_06_2025__địa chỉ 3 cấp.xlsx - Sheet1.csv"
);

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function parseCsvLine(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

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
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

async function seedAdministrativeUnits() {
  if (typeof prisma.province?.count !== "function") {
    console.log("Skip địa chỉ HC — chưa migrate model Province");
    return;
  }

  const existing = await prisma.province.count();
  if (existing > 0) {
    console.log(`Địa chỉ HC đã có ${existing} tỉnh/thành — bỏ qua seed`);
    return;
  }

  if (!fs.existsSync(ADMINISTRATIVE_UNIT_CSV)) {
    console.log("Không tìm thấy file CSV địa chỉ HC — bỏ qua seed");
    return;
  }

  const content = fs.readFileSync(ADMINISTRATIVE_UNIT_CSV, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsvLine(content);
  const provinceMap = new Map();
  const districtMap = new Map();
  const wardMap = new Map();

  for (const row of rows.slice(1)) {
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

  await prisma.$transaction(async (tx) => {
    const provinces = [...provinceMap.entries()].map(([code, name]) => ({
      code,
      name,
    }));

    for (const batch of chunkArray(provinces, 50)) {
      await tx.province.createMany({ data: batch });
    }

    const provinceRows = await tx.province.findMany({
      select: { id: true, code: true },
    });
    const provinceIdByCode = new Map(
      provinceRows.map((row) => [row.code, row.id])
    );

    const districts = [...districtMap.entries()]
      .map(([code, value]) => {
        const provinceId = provinceIdByCode.get(value.provinceCode);
        if (!provinceId) return null;
        return { code, name: value.name, provinceId };
      })
      .filter(Boolean);

    for (const batch of chunkArray(districts, 100)) {
      await tx.district.createMany({ data: batch });
    }

    const districtRows = await tx.district.findMany({
      select: { id: true, code: true },
    });
    const districtIdByCode = new Map(
      districtRows.map((row) => [row.code, row.id])
    );

    const wards = [...wardMap.entries()]
      .map(([code, value]) => {
        const districtId = districtIdByCode.get(value.districtCode);
        if (!districtId) return null;
        return {
          code,
          name: value.name,
          level: value.level,
          districtId,
        };
      })
      .filter(Boolean);

    for (const batch of chunkArray(wards, 500)) {
      await tx.ward.createMany({ data: batch });
    }
  });

  console.log(
    `Seeded địa chỉ HC: ${provinceMap.size} tỉnh, ${districtMap.size} quận, ${wardMap.size} phường/xã`
  );
}

function assertDepartmentModel() {
  if (typeof prisma.department?.upsert === "function") {
    return;
  }

  console.error(
    [
      "",
      "Lỗi: Prisma Client chưa có model Department.",
      "",
      "Trên server, chạy lần lượt từ thư mục app (có package.json):",
      "  npx prisma migrate deploy",
      "  npx prisma generate",
      "  node prisma/seed.cjs",
      "",
      "Hoặc: npm run db:migrate && npm run db:generate && npm run db:seed",
      "",
    ].join("\n")
  );
  process.exit(1);
}

/** Danh mục ban ngành chuẩn — khớp giá trị cột actual_department trên server */
const STANDARD_DEPARTMENTS = [
  "Tráng Niên",
  "Trung Niên",
  "Cao Niên",
  "Thanh Tráng",
  "Thiếu Nhi",
  "Thiếu Niên",
  "Thanh Niên",
];

async function seedDepartments() {
  const byName = {};

  for (const name of STANDARD_DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    byName[name] = department;
  }

  return byName;
}

async function main() {
  assertDepartmentModel();

  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: passwordHash,
      role: "admin",
    },
  });

  console.log("Seed OK — admin / admin123 (đổi password sau khi go-live)");

  const departments = await seedDepartments();
  console.log(`Seeded ${STANDARD_DEPARTMENTS.length} ban ngành chuẩn`);

  await seedAdministrativeUnits();

  const household = await prisma.household.upsert({
    where: { code: "0001" },
    update: {},
    create: { code: "0001" },
  });

  const visitTeam = await prisma.visitTeam.upsert({
    where: { code: "3A" },
    update: {},
    create: { code: "3A", area: "Khu vực 1" },
  });

  await prisma.member.upsert({
    where: { code: "00001" },
    update: {
      actualDepartmentId: departments["Thanh Niên"].id,
    },
    create: {
      code: "00001",
      firstName: "Nguyễn Văn",
      lastName: "An",
      fullName: "Nguyễn Văn An",
      status: "active",
      mobile1: "0901234567",
      actualDepartmentId: departments["Thanh Niên"].id,
      householdId: household.id,
      visitTeamId: visitTeam.id,
      gender: "male",
      birthYear: 1990,
    },
  });

  await prisma.member.upsert({
    where: { code: "00002" },
    update: {
      actualDepartmentId: departments["Trung Niên"].id,
    },
    create: {
      code: "00002",
      firstName: "Trần Thị",
      lastName: "Bình",
      fullName: "Trần Thị Bình",
      status: "active",
      mobile1: "0912345678",
      actualDepartmentId: departments["Trung Niên"].id,
      householdId: household.id,
      visitTeamId: visitTeam.id,
      gender: "female",
      birthYear: 1985,
    },
  });

  console.log(
    "Sample household 0001, team 3A, members 00001/00002 seeded"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
