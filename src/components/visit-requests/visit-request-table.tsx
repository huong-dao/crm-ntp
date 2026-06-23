import Link from "next/link";
import type { VisitRequestListItem } from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { cn } from "@/lib/utils";
import {
  buildVisitRequestListUrl,
  formatVisitRequestDate,
  VISIT_REQUEST_STATUS_LABELS,
  visitRequestStatusBadgeClass,
  type VisitRequestFilterValues,
} from "@/lib/visit-request-list";

export function VisitRequestTable({
  requests,
  total,
  page,
  pageSize,
  totalPages,
  filters,
}: {
  requests: VisitRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: VisitRequestFilterValues;
}) {
  if (requests.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không tìm thấy đơn thăm viếng.</p>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-6 space-y-4">
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã đơn
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Lịch
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Ngày thực tế
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Tình trạng
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã hộ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Tổ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Nhân sự
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request, index) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/visit-requests/${request.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {request.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatVisitRequestDate(request.scheduledDate)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatVisitRequestDate(request.actualDate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      visitRequestStatusBadgeClass(request.status)
                    )}
                  >
                    {VISIT_REQUEST_STATUS_LABELS[request.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  <Link
                    href={`/households/${request.householdId}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {request.householdCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <Link
                    href={`/visit-teams/${request.visitTeamId}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {request.visitTeamCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                  {request.staffCodes ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/visit-requests/${request.id}`}>
                      Cập nhật
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {requests.map((request) => (
          <MobileDataCard
            key={request.id}
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link href={`/visit-requests/${request.id}`}>Cập nhật</Link>
              </Button>
            }
          >
            <Link
              href={`/visit-requests/${request.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {request.code}
            </Link>
            <div className="mt-2">
              <MobileDataRow label="Lịch">
                {formatVisitRequestDate(request.scheduledDate)}
              </MobileDataRow>
              <MobileDataRow label="Ngày thực tế">
                {formatVisitRequestDate(request.actualDate)}
              </MobileDataRow>
              <MobileDataRow label="Tình trạng">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    visitRequestStatusBadgeClass(request.status)
                  )}
                >
                  {VISIT_REQUEST_STATUS_LABELS[request.status]}
                </span>
              </MobileDataRow>
              <MobileDataRow label="Mã hộ">
                <Link
                  href={`/households/${request.householdId}`}
                  className="hover:text-[#1e3a5f] hover:underline"
                >
                  {request.householdCode}
                </Link>
              </MobileDataRow>
              <MobileDataRow label="Tổ">{request.visitTeamCode}</MobileDataRow>
              <MobileDataRow label="Nhân sự">
                {request.staffCodes ?? "—"}
              </MobileDataRow>
            </div>
          </MobileDataCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
        <p>
          Hiển thị {start}–{end} / {total} đơn
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link
              href={page <= 1 ? "#" : buildVisitRequestListUrl(filters, page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              Trước
            </Link>
          </Button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page >= totalPages}
          >
            <Link
              href={
                page >= totalPages
                  ? "#"
                  : buildVisitRequestListUrl(filters, page + 1)
              }
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              Sau
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
