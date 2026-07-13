import Link from "next/link";
import { getActivityLogs } from "@/actions/activity-log-actions";
import { ActivityLogTable } from "@/components/activity-logs/activity-log-table";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function ActivityLogsPage() {
  const logs = await getActivityLogs(100);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hoạt động</h1>
          <p className="mt-1 text-sm text-gray-600">
            Lịch sử thao tác trên hệ thống — thành viên, hộ, đơn thăm viếng, ...
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>

      <div className="mt-6">
        <ActivityLogTable logs={logs} />
      </div>
    </div>
  );
}
