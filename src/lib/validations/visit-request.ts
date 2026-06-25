import { z } from "zod";

const dateField = z
  .string()
  .optional()
  .nullable()
  .refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    "Ngày không hợp lệ"
  );

export const visitRequestFormSchema = z
  .object({
    householdId: z.string().min(1, "Chọn hộ gia đình cần thăm viếng"),
    visitTeamId: z.string().min(1, "Chọn tổ thăm viếng"),
    scheduledDate: z
      .string()
      .min(1, "Chọn lịch thăm viếng")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Ngày không hợp lệ"),
    actualDate: dateField,
    representativeMemberId: z.string().optional().nullable(),
    additionalStaffMemberIds: z.array(z.string()).optional(),
    content: z
      .string()
      .max(2000, "Nội dung tối đa 2000 ký tự")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.actualDate?.trim()) {
      const scheduled = Date.parse(data.scheduledDate);
      const actual = Date.parse(data.actualDate.trim());
      if (!Number.isNaN(scheduled) && !Number.isNaN(actual) && actual < scheduled) {
        ctx.addIssue({
          code: "custom",
          message: "Ngày thăm thực tế không được trước lịch thăm viếng",
          path: ["actualDate"],
        });
      }
    }
  });

export type VisitRequestFormInput = z.infer<typeof visitRequestFormSchema>;

export const visitRequestUpdateSchema = visitRequestFormSchema
  .extend({
    status: z.enum(["scheduled", "completed", "cancelled"]),
  })
  .superRefine((data, ctx) => {
    if (data.status === "completed") {
      const value = data.actualDate?.trim();
      if (!value || Number.isNaN(Date.parse(value))) {
        ctx.addIssue({
          code: "custom",
          message: "Ngày thăm thực tế bắt buộc khi hoàn thành",
          path: ["actualDate"],
        });
      }
    }
  });

export type VisitRequestUpdateInput = z.infer<typeof visitRequestUpdateSchema>;

export function parseScheduledDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const visitRequestStatusSchema = z
  .object({
    status: z.enum(["scheduled", "completed", "cancelled"]),
    actualDate: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "completed") {
      const value = data.actualDate?.trim();
      if (!value || Number.isNaN(Date.parse(value))) {
        ctx.addIssue({
          code: "custom",
          message: "Ngày thăm thực tế bắt buộc khi hoàn thành",
          path: ["actualDate"],
        });
      }
    }
  });

export type VisitRequestStatusInput = z.infer<typeof visitRequestStatusSchema>;

export function parseStaffCodeList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

export function codesFromMemberIds(
  members: { id: string; code: string }[],
  ids: string[]
): string {
  const idToCode = new Map(members.map((member) => [member.id, member.code]));
  return ids
    .map((id) => idToCode.get(id))
    .filter((code): code is string => Boolean(code))
    .join(", ");
}
