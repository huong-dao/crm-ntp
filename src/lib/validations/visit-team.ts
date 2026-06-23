import { z } from "zod";

const visitTeamCodeField = z
  .string()
  .trim()
  .min(1, "Mã tổ không được trống")
  .max(20, "Mã tổ tối đa 20 ký tự");

const visitTeamAreaField = z
  .string()
  .trim()
  .min(1, "Khu vực phụ trách không được trống")
  .max(200, "Khu vực tối đa 200 ký tự");

export const visitTeamCreateSchema = z.object({
  code: visitTeamCodeField,
  area: visitTeamAreaField,
  leaderMemberId: z.string().optional().nullable(),
});

export const visitTeamUpdateSchema = z.object({
  area: visitTeamAreaField,
  leaderMemberId: z.string().optional().nullable(),
});

export type VisitTeamCreateInput = z.infer<typeof visitTeamCreateSchema>;
export type VisitTeamUpdateInput = z.infer<typeof visitTeamUpdateSchema>;
