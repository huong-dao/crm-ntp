import type { HouseholdStatus, Prisma } from "@prisma/client";

export const HOUSEHOLD_STATUS_LABELS: Record<HouseholdStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngừng hoạt động",
};

export function householdStatusBadgeClass(status: HouseholdStatus): string {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-700";
}

/** Hộ còn ít nhất 1 thành viên "Hoạt động" -> status active, ngược lại -> inactive. */
export async function syncHouseholdStatus(
  tx: Prisma.TransactionClient,
  householdId: string
) {
  const activeCount = await tx.member.count({
    where: { householdId, status: "active" },
  });

  await tx.household.update({
    where: { id: householdId },
    data: { status: activeCount > 0 ? "active" : "inactive" },
  });
}
