import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStaffMemberOptions,
  getVisitRequestById,
} from "@/actions/visit-request-actions";
import { VisitRequestStaffDisplay } from "@/components/visit-requests/visit-request-staff-display";
import { VisitRequestStaffForm } from "@/components/visit-requests/visit-request-staff-form";
import { VisitRequestStatusForm } from "@/components/visit-requests/visit-request-status-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatVisitRequestDate,
  VISIT_REQUEST_STATUS_LABELS,
  visitRequestStatusBadgeClass,
} from "@/lib/visit-request-list";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VisitRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, staffMembers] = await Promise.all([
    getVisitRequestById(id),
    getStaffMemberOptions(),
  ]);

  if (!request) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Đơn thăm viếng: {request.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Chi tiết và cập nhật tình trạng thăm viếng
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/visit-requests">← Danh sách đơn</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Mã đơn</p>
          <p className="mt-1 text-lg font-semibold text-[#1e3a5f]">
            {request.code}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Lịch thăm viếng</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatVisitRequestDate(request.scheduledDate)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Ngày thăm thực tế</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatVisitRequestDate(request.actualDate)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tình trạng</p>
          <p className="mt-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                visitRequestStatusBadgeClass(request.status)
              )}
            >
              {VISIT_REQUEST_STATUS_LABELS[request.status]}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Hộ gia đình</p>
          <p className="mt-1 font-semibold text-gray-900">
            <Link
              href={`/households/${request.householdId}`}
              className="hover:text-[#1e3a5f] hover:underline"
            >
              {request.householdCode}
            </Link>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổ thăm viếng</p>
          <p className="mt-1 font-semibold text-gray-900">
            <Link
              href={`/visit-teams/${request.visitTeamId}`}
              className="hover:text-[#1e3a5f] hover:underline"
            >
              {request.visitTeamCode}
            </Link>
          </p>
          <p className="mt-1 text-sm text-gray-600">{request.visitTeamArea}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Nhân sự thăm viếng</p>
          <div className="mt-2">
            <VisitRequestStaffDisplay
              staffCodes={request.staffCodes}
              staffMembers={staffMembers}
            />
          </div>
        </div>
      </div>

      {request.content && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Nội dung / ghi chú</p>
          <p className="mt-2 text-gray-900 whitespace-pre-wrap">
            {request.content}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Gán nhân sự thăm viếng
          </h2>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <VisitRequestStaffForm
              requestId={request.id}
              staffCodes={request.staffCodes}
              staffMembers={staffMembers}
            />
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Cập nhật tình trạng
          </h2>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <VisitRequestStatusForm
              requestId={request.id}
              currentStatus={request.status}
              currentActualDate={request.actualDate}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">
          Lịch sử cập nhật
        </h2>
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600 space-y-2">
          <p>
            Tạo đơn:{" "}
            <span className="text-gray-900">
              {formatDateTime(request.createdAt)}
            </span>
          </p>
          <p>
            Cập nhật lần cuối:{" "}
            <span className="text-gray-900">
              {formatDateTime(request.updatedAt)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
