import type { VisitRequestStatus } from "@prisma/client";
import { VISIT_REQUEST_STATUS_LABELS } from "@/lib/visit-request-list";

export const VISIT_REQUEST_EXPORT_HEADERS = [
  "Mã đơn",
  "Lịch thăm viếng",
  "Ngày thăm thực tế",
  "Tình trạng",
  "Mã hộ",
  "Mã tổ thăm viếng",
  "Mã tín hữu đại diện",
  "Nhân sự",
  "Nội dung",
];

export type VisitRequestExportRecord = {
  code: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitRequestStatus;
  content: string | null;
  staffCodes: string | null;
  household: { code: string };
  visitTeam: { code: string };
  representativeMember: { code: string } | null;
};

function formatExportDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function visitRequestToExportRow(
  record: VisitRequestExportRecord
): string[] {
  return [
    record.code,
    formatExportDate(record.scheduledDate),
    formatExportDate(record.actualDate),
    VISIT_REQUEST_STATUS_LABELS[record.status],
    record.household.code,
    record.visitTeam.code,
    record.representativeMember?.code ?? "",
    record.staffCodes ?? "",
    record.content ?? "",
  ];
}
