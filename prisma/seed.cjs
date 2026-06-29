const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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
