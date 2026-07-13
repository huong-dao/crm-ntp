import type { Prisma } from "@prisma/client";

/** Đồng bộ visitTeamId của mọi thành viên trong hộ theo chủ hộ. */
export async function syncHouseholdVisitTeamFromHead(
  tx: Prisma.TransactionClient,
  householdId: string
) {
  const household = await tx.household.findUnique({
    where: { id: householdId },
    select: {
      headMemberId: true,
      members: {
        where: { isHead: true },
        select: { visitTeamId: true },
        take: 1,
      },
    },
  });

  if (!household) return;

  const headVisitTeamId =
    household.members[0]?.visitTeamId ??
    (household.headMemberId
      ? (
          await tx.member.findUnique({
            where: { id: household.headMemberId },
            select: { visitTeamId: true },
          })
        )?.visitTeamId ?? null
      : null);

  if (!headVisitTeamId) return;

  await tx.member.updateMany({
    where: { householdId },
    data: { visitTeamId: headVisitTeamId },
  });
}
