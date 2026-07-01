import type { MemberImportLogDetail } from "@/actions/member-import-actions";
import { MemberImportLogActions } from "@/components/members/member-import-log-actions";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export function MemberImportLogDetailView({ log }: { log: MemberImportLogDetail }) {
  const failedRows = log.rows.filter((row) => row.status === "failed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">File</p>
          <p className="mt-1 font-medium text-gray-900">{log.fileName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Người import</p>
          <p className="mt-1 text-gray-900">{log.uploadedByName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Thời gian</p>
          <p className="mt-1 text-gray-900">{formatDate(log.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Kết quả</p>
          <p className="mt-1 text-gray-900">
            <span className="text-green-700">{log.successCount} OK</span>
            {" · "}
            <span className="text-red-700">{log.errorCount} lỗi</span>
            {" / "}
            {log.totalRows} dòng
          </p>
        </div>
      </div>

      <MemberImportLogActions logId={log.id} failedCount={failedRows.length} />

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Dòng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Mã tín hữu</th>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Mã hộ</th>
              <th className="px-4 py-3 font-medium">Lỗi / Ghi chú</th>
              <th className="px-4 py-3 font-medium">Import lại</th>
            </tr>
          </thead>
          <tbody>
            {log.rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{row.rowNumber}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      row.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {row.status === "success" ? "Thành công" : "Lỗi"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">{displayValue(row.memberCode)}</td>
                <td className="px-4 py-3 text-gray-900">{displayValue(row.memberName)}</td>
                <td className="px-4 py-3 text-gray-900">{displayValue(row.householdCode)}</td>
                <td className="max-w-md px-4 py-3 text-gray-700 whitespace-pre-wrap break-words">
                  {row.error ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {row.retriedAt ? formatDate(row.retriedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {log.rows.map((row) => (
          <MobileDataCard key={row.id}>
            <p className="font-semibold text-gray-900">Dòng {row.rowNumber}</p>
            <div className="mt-2">
              <MobileDataRow label="Trạng thái">
                {row.status === "success" ? "Thành công" : "Lỗi"}
              </MobileDataRow>
              <MobileDataRow label="Mã tín hữu">{displayValue(row.memberCode)}</MobileDataRow>
              <MobileDataRow label="Họ tên">{displayValue(row.memberName)}</MobileDataRow>
              <MobileDataRow label="Mã hộ">{displayValue(row.householdCode)}</MobileDataRow>
              <MobileDataRow label="Lỗi">{row.error ?? "—"}</MobileDataRow>
              {row.retriedAt && (
                <MobileDataRow label="Import lại lúc">
                  {formatDate(row.retriedAt)}
                </MobileDataRow>
              )}
            </div>
          </MobileDataCard>
        ))}
      </div>
    </div>
  );
}
