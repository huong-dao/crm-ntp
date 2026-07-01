import { z } from "zod";

/** Giá trị select khi user chọn tạo hộ gia đình mới cùng lúc tạo thành viên */
export const CREATE_NEW_HOUSEHOLD = "__new__";

const currentYear = new Date().getFullYear();

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (value) => !value || /^[\d\s+\-()]+$/.test(value),
    "Số điện thoại không hợp lệ"
  );

const optionalYear = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  },
  z
    .number({ message: "Năm không hợp lệ" })
    .int()
    .min(1900, "Năm phải từ 1900")
    .max(currentYear, `Năm không quá ${currentYear}`)
    .optional()
);

export const memberFormSchema = z.object({
  status: z.enum(["active", "inactive", "transferred", "deceased"]),
  firstName: z
    .string()
    .trim()
    .min(1, "Họ và lót không được trống")
    .max(100, "Họ và lót tối đa 100 ký tự"),
  lastName: z
    .string()
    .trim()
    .min(1, "Tên không được trống")
    .max(50, "Tên tối đa 50 ký tự"),
  gender: z.enum(["male", "female"]).optional().nullable(),
  birthYear: optionalYear,
  occupation: z.string().trim().max(200).optional().nullable(),

  houseNumber: z
    .string()
    .trim()
    .max(191, "Số nhà tối đa 191 ký tự")
    .optional()
    .nullable(),
  street: z.string().trim().max(200).optional().nullable(),
  oldWard: z.string().trim().max(100).optional().nullable(),
  oldDistrict: z.string().trim().max(100).optional().nullable(),
  oldProvince: z.string().trim().max(100).optional().nullable(),
  newWard: z.string().trim().max(100).optional().nullable(),
  newProvince: z.string().trim().max(100).optional().nullable(),

  mobile1: optionalPhone,
  mobile2: optionalPhone,
  landline: optionalPhone,

  householdId: z.string().optional().nullable(),
  createNewHousehold: z.boolean(),
  isHead: z.boolean(),
  relationship: z.string().trim().max(100).optional().nullable(),

  isBaptized: z.boolean(),
  baptismYear: optionalYear,
  ageDepartmentId: z.string().trim().optional().nullable(),
  actualDepartmentId: z.string().trim().optional().nullable(),
  boardServiceYear: optionalYear,
  visitDepartmentYear: optionalYear,

  visitTeamId: z.string().optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.createNewHousehold) {
    if (!data.isHead) {
      ctx.addIssue({
        code: "custom",
        message: "Thành viên tạo hộ mới phải là chủ hộ",
        path: ["isHead"],
      });
    }
    return;
  }

  if (!data.householdId?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Chọn mã hộ hoặc tạo hộ mới",
      path: ["householdId"],
    });
  }
});

export type MemberFormInput = z.infer<typeof memberFormSchema>;

export function parseMemberFormData(form: FormData): Record<string, unknown> {
  const emptyToNull = (key: string) => {
    const value = form.get(key);
    if (typeof value !== "string" || value.trim() === "") return null;
    return value.trim();
  };

  return {
    status: form.get("status"),
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    gender: emptyToNull("gender"),
    birthYear: emptyToNull("birthYear"),
    occupation: emptyToNull("occupation"),
    houseNumber: emptyToNull("houseNumber"),
    street: emptyToNull("street"),
    oldWard: emptyToNull("oldWard"),
    oldDistrict: emptyToNull("oldDistrict"),
    oldProvince: emptyToNull("oldProvince"),
    newWard: emptyToNull("newWard"),
    newProvince: emptyToNull("newProvince"),
    mobile1: emptyToNull("mobile1"),
    mobile2: emptyToNull("mobile2"),
    landline: emptyToNull("landline"),
    householdId: (() => {
      const value = form.get("householdId");
      if (typeof value !== "string" || value === CREATE_NEW_HOUSEHOLD) {
        return null;
      }
      return value.trim() || null;
    })(),
    createNewHousehold: (() => {
      return (
        form.get("createNewHousehold") === "on" ||
        form.get("householdId") === CREATE_NEW_HOUSEHOLD
      );
    })(),
    isHead: (() => {
      const createNewHousehold =
        form.get("createNewHousehold") === "on" ||
        form.get("householdId") === CREATE_NEW_HOUSEHOLD;
      // Checkbox disabled không gửi trong FormData — tạo hộ mới luôn là chủ hộ
      return createNewHousehold || form.get("isHead") === "on";
    })(),
    relationship: emptyToNull("relationship"),
    isBaptized: form.get("isBaptized") === "on",
    baptismYear: emptyToNull("baptismYear"),
    ageDepartmentId: emptyToNull("ageDepartmentId"),
    actualDepartmentId: emptyToNull("actualDepartmentId"),
    boardServiceYear: emptyToNull("boardServiceYear"),
    visitDepartmentYear: emptyToNull("visitDepartmentYear"),
    visitTeamId: emptyToNull("visitTeamId"),
    notes: emptyToNull("notes"),
  };
}
