"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { VisitRequestMembersPrintData } from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, PrintIcon } from "@/lib/button-icons";
import { GENDER_LABELS, STATUS_LABELS } from "@/lib/member-list";
import { formatActualDepartmentName } from "@/lib/member-list";
import { formatVisitRequestDate } from "@/lib/visit-request-list";
import type { Gender, MemberStatus } from "@prisma/client";

export function VisitRequestMembersPrintView({
  data,
  requestId,
}: {
  data: VisitRequestMembersPrintData;
  requestId: string;
}) {
  useEffect(() => {
    document.body.classList.add("print-visit-request");
    const timer = window.setTimeout(() => window.print(), 400);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("print-visit-request");
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 text-gray-900 print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        <div className="mb-8 flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">Danh sách thành viên hộ</h1>
            <p className="mt-1 text-sm text-gray-600">
              Đơn {data.requestCode} — Hộ {data.householdCode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" icon={PrintIcon} onClick={() => window.print()}>
              In / Lưu PDF
            </Button>
            <Button type="button" variant="outline" asChild icon={CancelIcon}>
              <Link href={`/visit-requests/${requestId}`}>Đóng</Link>
            </Button>
          </div>
        </div>

        <div className="border border-gray-300 p-8 print:border-0 print:p-0">
          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Danh sách thành viên gia đình
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Đơn thăm viếng: <strong>{data.requestCode}</strong> — Lịch:{" "}
              {formatVisitRequestDate(data.scheduledDate)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Hộ: <strong>{data.householdCode}</strong>
              {data.householdHeadName && (
                <> — Chủ hộ: <strong>{data.householdHeadName}</strong></>
              )}
            </p>
          </div>

          <table className="mt-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="px-2 py-2 text-left font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Mã TV</th>
                <th className="px-2 py-2 text-left font-semibold">Họ tên</th>
                <th className="px-2 py-2 text-left font-semibold">Quan hệ</th>
                <th className="px-2 py-2 text-left font-semibold">Năm sinh</th>
                <th className="px-2 py-2 text-left font-semibold">Giới tính</th>
                <th className="px-2 py-2 text-left font-semibold">Tình trạng</th>
                <th className="px-2 py-2 text-left font-semibold">Ban ngành</th>
                <th className="px-2 py-2 text-left font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member, index) => (
                <tr key={member.code} className="border-b border-gray-200">
                  <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2">{member.code}</td>
                  <td className="px-2 py-2 font-medium">{member.fullName}</td>
                  <td className="px-2 py-2">{member.relationship ?? "—"}</td>
                  <td className="px-2 py-2">{member.birthYear ?? "—"}</td>
                  <td className="px-2 py-2">
                    {member.gender
                      ? GENDER_LABELS[member.gender as Gender]
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    {STATUS_LABELS[member.status as MemberStatus]}
                  </td>
                  <td className="px-2 py-2">
                    {formatActualDepartmentName(member.actualDepartmentName)}
                  </td>
                  <td className="px-2 py-2 max-w-[140px]">{member.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.members.length === 0 && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Hộ không có thành viên.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
