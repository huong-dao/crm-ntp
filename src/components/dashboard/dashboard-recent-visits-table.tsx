import Link from "next/link";
import type { RecentVisitRequest } from "@/actions/dashboard-actions";
import { Button } from "@/components/ui/button";
import { AddIcon, EditIcon, ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { cn } from "@/lib/utils";
import {
  formatVisitRequestDate,
  VISIT_REQUEST_STATUS_LABELS,
  visitRequestStatusBadgeClass,
} from "@/lib/visit-request-list";

export function DashboardRecentVisitsTable({
  visits,
}: {
  visits: RecentVisitRequest[];
}) {
  if (visits.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không có đơn thăm viếng đang lên lịch.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild icon={AddIcon}>
          <Link href="/visit-requests/new">Tạo đơn thăm viếng</Link>
        </Button>
      </div>
    );
  }

  return (
  <div>
    <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Mã đơn
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Lịch
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
          {visits.map((visit) => (
            <tr key={visit.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                <Link
                  href={`/visit-requests/${visit.id}`}
                  className="hover:text-[#1e3a5f] hover:underline"
                >
                  {visit.code}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatVisitRequestDate(visit.scheduledDate)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    visitRequestStatusBadgeClass(visit.status)
                  )}
                >
                  {VISIT_REQUEST_STATUS_LABELS[visit.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-900">
                <Link
                  href={`/households/${visit.householdId}`}
                  className="hover:text-[#1e3a5f] hover:underline"
                >
                  {visit.householdCode}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">
                <Link
                  href={`/visit-teams/${visit.visitTeamId}`}
                  className="hover:text-[#1e3a5f] hover:underline"
                >
                  {visit.visitTeamCode}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                {visit.staffCodes ?? "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="outline" size="sm" asChild icon={EditIcon}>
                  <Link href={`/visit-requests/${visit.id}`}>Cập nhật</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-3 md:hidden">
      {visits.map((visit) => (
        <MobileDataCard
          key={visit.id}
          actions={
            <Button variant="outline" size="sm" asChild icon={EditIcon}>
              <Link href={`/visit-requests/${visit.id}`}>Cập nhật</Link>
            </Button>
          }
        >
          <Link
            href={`/visit-requests/${visit.id}`}
            className="font-semibold text-[#1e3a5f] hover:underline"
          >
            {visit.code}
          </Link>
          <div className="mt-2">
            <MobileDataRow label="Lịch">
              {formatVisitRequestDate(visit.scheduledDate)}
            </MobileDataRow>
            <MobileDataRow label="Tình trạng">
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  visitRequestStatusBadgeClass(visit.status)
                )}
              >
                {VISIT_REQUEST_STATUS_LABELS[visit.status]}
              </span>
            </MobileDataRow>
            <MobileDataRow label="Mã hộ">{visit.householdCode}</MobileDataRow>
            <MobileDataRow label="Tổ">{visit.visitTeamCode}</MobileDataRow>
            <MobileDataRow label="Nhân sự">
              {visit.staffCodes ?? "—"}
            </MobileDataRow>
          </div>
        </MobileDataCard>
      ))}
    </div>
  </div>
  );
}
