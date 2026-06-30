import Link from "next/link";
import type { MemberImportLogListItem } from "@/actions/member-import-actions";
import { Button } from "@/components/ui/button";
import { NextIcon, PrevIcon, ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function MemberImportLogsTable({
  logs,
  page,
  totalPages,
}: {
  logs: MemberImportLogListItem[];
  page: number;
  totalPages: number;
}) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
        Chưa có lịch sử import.
      </div>
    );
  }

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Người import</th>
              <th className="px-4 py-3 font-medium">Tổng dòng</th>
              <th className="px-4 py-3 font-medium">Thành công</th>
              <th className="px-4 py-3 font-medium">Lỗi</th>
              <th className="px-4 py-3 font-medium">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{log.fileName}</td>
                <td className="px-4 py-3 text-gray-700">{log.uploadedByName}</td>
                <td className="px-4 py-3 text-gray-700">{log.totalRows}</td>
                <td className="px-4 py-3 text-green-700">{log.successCount}</td>
                <td className="px-4 py-3 text-red-700">{log.errorCount}</td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                    <Link href={`/members/imports/${log.id}`}>Xem</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {logs.map((log) => (
          <MobileDataCard
            key={log.id}
            actions={
              <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                <Link href={`/members/imports/${log.id}`}>Chi tiết</Link>
              </Button>
            }
          >
            <p className="font-semibold text-gray-900">{log.fileName}</p>
            <MobileDataRow label="Thời gian">{formatDate(log.createdAt)}</MobileDataRow>
            <MobileDataRow label="Người import">{log.uploadedByName}</MobileDataRow>
            <MobileDataRow label="Tổng dòng">{log.totalRows}</MobileDataRow>
            <MobileDataRow label="Thành công">{log.successCount}</MobileDataRow>
            <MobileDataRow label="Lỗi">{log.errorCount}</MobileDataRow>
          </MobileDataCard>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {prevPage ? (
            <Button variant="outline" size="sm" asChild icon={PrevIcon}>
              <Link href={`/members/imports?page=${prevPage}`}>Trước</Link>
            </Button>
          ) : null}
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          {nextPage ? (
            <Button variant="outline" size="sm" asChild icon={NextIcon} iconPosition="end">
              <Link href={`/members/imports?page=${nextPage}`}>Sau</Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
