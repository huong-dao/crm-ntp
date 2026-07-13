import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityEntityType =
  | "member"
  | "household"
  | "visit_request"
  | "visit_team"
  | "user"
  | "department"
  | "system";

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  created: "Tạo mới",
  updated: "Cập nhật",
  deleted: "Xóa",
  completed: "Hoàn thành",
  cancelled: "Hủy lịch",
  status_changed: "Đổi tình trạng",
  split: "Tách hộ",
  assigned: "Gán nhân sự",
  removed: "Gỡ nhân sự",
  imported: "Import",
};

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  member: "Thành viên",
  household: "Hộ gia đình",
  visit_request: "Đơn thăm viếng",
  visit_team: "Tổ thăm viếng",
  user: "Tài khoản",
  department: "Ban ngành",
  system: "Hệ thống",
};

export async function logActivity(
  input: {
    userId?: string | null;
    entityType: ActivityEntityType;
    entityId?: string | null;
    action: string;
    note?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  await client.activityLog.create({
    data: {
      userId: input.userId ?? null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      note: input.note?.trim() || null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export type ActivityLogItem = {
  id: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  action: string;
  note: string | null;
  createdAt: Date;
  username: string | null;
};

export async function getRecentActivityLogs(
  limit = 20
): Promise<ActivityLogItem[]> {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
    select: {
      id: true,
      entityType: true,
      entityId: true,
      action: true,
      note: true,
      createdAt: true,
      user: { select: { username: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType as ActivityEntityType,
    entityId: row.entityId,
    action: row.action,
    note: row.note,
    createdAt: row.createdAt,
    username: row.user?.username ?? null,
  }));
}

export function formatActivityDescription(item: ActivityLogItem): string {
  const entity = ACTIVITY_ENTITY_LABELS[item.entityType] ?? item.entityType;
  const action = ACTIVITY_ACTION_LABELS[item.action] ?? item.action;
  return `${action} ${entity}`;
}
