import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logVisitRequestHistory(
  tx: Prisma.TransactionClient,
  input: {
    visitRequestId: string;
    userId?: string | null;
    action: string;
    note?: string | null;
  }
) {
  await tx.visitRequestHistory.create({
    data: {
      visitRequestId: input.visitRequestId,
      userId: input.userId ?? null,
      action: input.action,
      note: input.note?.trim() || null,
    },
  });
}

export async function getVisitRequestHistories(visitRequestId: string) {
  return prisma.visitRequestHistory.findMany({
    where: { visitRequestId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      note: true,
      createdAt: true,
      user: { select: { username: true } },
    },
  });
}
