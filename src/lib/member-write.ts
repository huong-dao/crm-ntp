import type { Prisma } from "@prisma/client";
import {
  buildFullName,
  buildNewFullAddress,
  buildOldFullAddress,
} from "@/lib/member-format";
import type { MemberFormInput } from "@/lib/validations/member";

function parseBoardServiceDate(
  value?: string | null
): { date: Date | null } | { error: string } {
  if (!value) return { date: null };
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "Ngày ban chấp sự không hợp lệ" };
  }
  return { date: parsedDate };
}

export function buildMemberWriteData(
  data: MemberFormInput,
  code?: string
):
  | { ok: true; data: Prisma.MemberUncheckedCreateInput }
  | { ok: false; error: string } {
  const fullName = buildFullName(data.firstName, data.lastName);
  const oldFullAddress = buildOldFullAddress(data);
  const newFullAddress = buildNewFullAddress(data);
  const boardParsed = parseBoardServiceDate(data.boardServiceDate);
  if ("error" in boardParsed) {
    return { ok: false, error: boardParsed.error };
  }

  const record = {
    status: data.status,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    houseNumber: data.houseNumber,
    street: data.street,
    oldWard: data.oldWard,
    oldDistrict: data.oldDistrict,
    oldProvince: data.oldProvince,
    oldFullAddress: oldFullAddress || null,
    newWard: data.newWard,
    newProvince: data.newProvince,
    newFullAddress: newFullAddress || null,
    mobile1: data.mobile1,
    mobile2: data.mobile2,
    landline: data.landline,
    birthYear: data.birthYear ?? null,
    gender: data.gender ?? null,
    occupation: data.occupation,
    householdId: data.householdId,
    isHead: data.isHead,
    relationship: data.relationship ?? null,
    isBaptized: data.isBaptized,
    baptismYear: data.isBaptized ? data.baptismYear ?? null : null,
    ageDepartmentId: data.ageDepartmentId ?? null,
    actualDepartmentId: data.actualDepartmentId ?? null,
    boardServiceDate: boardParsed.date,
    visitDepartment: data.visitDepartment,
    visitTeamId: data.visitTeamId ?? null,
    notes: data.notes,
  };

  if (code) {
    return {
      ok: true,
      data: { ...record, code } as Prisma.MemberUncheckedCreateInput,
    };
  }
  return { ok: true, data: record as Prisma.MemberUncheckedCreateInput };
}

export async function applyHeadOfHousehold(
  tx: Prisma.TransactionClient,
  householdId: string,
  memberId: string,
  isHead: boolean
) {
  if (isHead) {
    await tx.member.updateMany({
      where: { householdId, isHead: true, id: { not: memberId } },
      data: { isHead: false },
    });
    await tx.household.update({
      where: { id: householdId },
      data: { headMemberId: memberId },
    });
  } else {
    const household = await tx.household.findUnique({
      where: { id: householdId },
      select: { headMemberId: true },
    });
    if (household?.headMemberId === memberId) {
      await tx.household.update({
        where: { id: householdId },
        data: { headMemberId: null },
      });
    }
  }
}
