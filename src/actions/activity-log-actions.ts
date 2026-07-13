"use server";

import { auth } from "@/lib/auth";
import {
  getRecentActivityLogs,
  type ActivityLogItem,
} from "@/lib/activity-log";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function getActivityLogs(limit = 50): Promise<ActivityLogItem[]> {
  await requireAuth();
  return getRecentActivityLogs(limit);
}
