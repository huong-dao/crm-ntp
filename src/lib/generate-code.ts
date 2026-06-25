import { prisma } from "@/lib/prisma";

export {
  buildFullName,
  buildNewFullAddress,
  buildOldFullAddress,
} from "@/lib/member-format";

type CodeModel = {
  findMany: (args: { select: { code: true } }) => Promise<{ code: string }[]>;
  findUnique: (args: {
    where: { code: string };
    select: { id: true };
  }) => Promise<{ id: string } | null>;
};

const models: Record<string, CodeModel> = {
  member: prisma.member,
  household: prisma.household,
  visitRequest: prisma.visitRequest,
};

async function generateNumericCode(
  table: "member" | "household",
  padLength: number
): Promise<string> {
  const model = models[table];
  const rows = await model.findMany({ select: { code: true } });

  let maxNum = 0;
  for (const row of rows) {
    if (/^\d+$/.test(row.code)) {
      const num = parseInt(row.code, 10);
      if (Number.isFinite(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return String(maxNum + 1).padStart(padLength, "0");
}

const VISIT_REQUEST_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomVisitRequestCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    const index = Math.floor(Math.random() * VISIT_REQUEST_CODE_CHARS.length);
    code += VISIT_REQUEST_CODE_CHARS[index];
  }
  return code;
}

export async function generateMemberCode(): Promise<string> {
  return generateNumericCode("member", 5);
}

export async function generateHouseholdCode(): Promise<string> {
  return generateNumericCode("household", 4);
}

export async function generateVisitRequestCode(): Promise<string> {
  const model = models.visitRequest;

  for (let attempt = 0; attempt < 30; attempt++) {
    const code = randomVisitRequestCode();
    const exists = await model.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!exists) {
      return code;
    }
  }

  throw new Error("Không thể sinh mã đơn thăm viếng");
}
