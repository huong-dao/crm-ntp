import Link from "next/link";
import type { ActivityLogItem } from "@/lib/activity-log";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  formatActivityDescription,
} from "@/lib/activity-log";

function entityHref(item: ActivityLogItem): string | null {
  if (!item.entityId) return null;
  switch (item.entityType) {
    case "member":
      return `/members/${item.entityId}`;
    case "household":
      return `/households/${item.entityId}`;
    case "visit_request":
      return `/visit-requests/${item.entityId}`;
    case "visit_team":
      return `/visit-teams/${item.entityId}`;
    case "user":
      return `/users/${item.entityId}/edit`;
    default:
      return null;
  }
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLogTable({ logs }: { logs: ActivityLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        Chưa có hoạt động nào được ghi nhận.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Thời gian
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Người thực hiện
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Thao tác
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Ghi chú
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => {
            const href = entityHref(log);
            const description = formatActivityDescription(log);
            const actionLabel =
              ACTIVITY_ACTION_LABELS[log.action] ?? log.action;
            const entityLabel =
              ACTIVITY_ENTITY_LABELS[log.entityType] ?? log.entityType;

            return (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {log.username ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium text-[#1e3a5f] hover:underline"
                    >
                      {actionLabel} {entityLabel}
                    </Link>
                  ) : (
                    <span className="text-gray-900">{description}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {log.note ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
