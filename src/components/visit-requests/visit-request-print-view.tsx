"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { VisitRequestPrintData } from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, PrintIcon } from "@/lib/button-icons";
import {
  formatVisitRequestDate,
  VISIT_REQUEST_STATUS_LABELS,
} from "@/lib/visit-request-list";

export function VisitRequestPrintView({
  request,
  qrDataUrl,
  editUrl,
}: {
  request: VisitRequestPrintData;
  qrDataUrl: string;
  editUrl: string;
}) {
  useEffect(() => {
    document.body.classList.add("print-visit-request");
    const timer = window.setTimeout(() => window.print(), 400);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("print-visit-request");
    };
  }, []);

  const staffDisplay =
    request.staffNames.length > 0 ? request.staffNames.join(", ") : "—";

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:p-0">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-8 flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Đơn thăm viếng</h1>
            <p className="mt-1 text-sm text-gray-600">
              Dùng Ctrl+P hoặc nút bên dưới để lưu PDF / in.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" icon={PrintIcon} onClick={() => window.print()}>
              In / Lưu PDF
            </Button>
            <Button type="button" variant="outline" asChild icon={CancelIcon}>
              <Link href={`/visit-requests/${request.id}`}>Đóng</Link>
            </Button>
          </div>
        </div>

        <div className="border border-gray-300 p-8 print:border-0 print:p-0">
          <div className="flex items-start gap-6">
            <div className="shrink-0 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR mở trang sửa đơn ${request.code}`}
                width={96}
                height={96}
                className="h-24 w-24"
              />
              <p className="mt-1 max-w-[6.5rem] text-[10px] leading-tight text-gray-500 print:text-gray-600">
                Quét để sửa đơn
              </p>
            </div>

            <div className="min-w-0 flex-1 text-center">
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Đơn thăm viếng
              </h2>
              <p className="mt-2 text-lg font-semibold text-[#1e3a5f]">
                {request.code}
              </p>
            </div>
          </div>

          <p className="mt-2 hidden text-center text-[10px] text-gray-400 print:block">
            {editUrl}
          </p>

          <table className="mt-8 w-full border-collapse text-sm">
            <tbody>
              <PrintRow
                label="Tình trạng"
                value={VISIT_REQUEST_STATUS_LABELS[request.status]}
              />
              <PrintRow
                label="Lịch thăm viếng"
                value={formatVisitRequestDate(request.scheduledDate)}
              />
              <PrintRow
                label="Ngày thăm thực tế"
                value={formatVisitRequestDate(request.actualDate)}
              />
              <PrintRow label="Mã hộ" value={request.householdCode} />
              <PrintRow
                label="Tên chủ hộ"
                value={request.householdHeadName ?? "—"}
              />
              <PrintRow label="Mã tổ thăm viếng" value={request.visitTeamCode} />
              <PrintRow label="Nhân sự thăm viếng" value={staffDisplay} />
            </tbody>
          </table>

          <div className="mt-8">
            <p className="text-sm font-semibold text-gray-700">Nội dung</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {request.content?.trim() || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="w-44 py-3 pr-4 align-top font-medium text-gray-600">
        {label}
      </td>
      <td className="py-3 text-gray-900">{value}</td>
    </tr>
  );
}
