import { z } from "zod";

export const visitRequestFormSchema = z.object({
  householdId: z.string().min(1, "Chọn hộ gia đình"),
  visitTeamId: z.string().min(1, "Chọn tổ thăm viếng"),
  scheduledDate: z
    .string()
    .min(1, "Chọn ngày thăm viếng")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Ngày không hợp lệ"),
  staffCodes: z
    .string()
    .max(500, "Nhân sự tối đa 500 ký tự")
    .optional()
    .nullable(),
  content: z
    .string()
    .max(2000, "Nội dung tối đa 2000 ký tự")
    .optional()
    .nullable(),
  staffMemberIds: z.array(z.string()).optional(),
});

export type VisitRequestFormInput = z.infer<typeof visitRequestFormSchema>;

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

export const visitRequestStaffSchema = z.object({
  staffCodes: z
    .string()
    .max(500, "Nhân sự tối đa 500 ký tự")
    .optional()
    .nullable(),
  staffMemberIds: z.array(z.string()).optional(),
});

export type VisitRequestStaffInput = z.infer<typeof visitRequestStaffSchema>;

export function parseStaffCodeList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}
