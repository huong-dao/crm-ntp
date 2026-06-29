import { z } from "zod";

const optionalAge = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  },
  z
    .number({ message: "Độ tuổi không hợp lệ" })
    .int("Độ tuổi phải là số nguyên")
    .min(0, "Độ tuổi tối thiểu là 0")
    .max(150, "Độ tuổi tối đa là 150")
    .nullable()
    .optional()
);

export const departmentFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Tên ban ngành không được trống")
      .max(100, "Tên ban ngành tối đa 100 ký tự"),
    minAge: optionalAge,
    maxAge: optionalAge,
  })
  .superRefine((data, ctx) => {
    if (
      data.minAge != null &&
      data.maxAge != null &&
      data.minAge > data.maxAge
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Độ tuổi tối thiểu không được lớn hơn độ tuổi tối đa",
        path: ["maxAge"],
      });
    }
  });

export type DepartmentFormInput = z.infer<typeof departmentFormSchema>;

export function parseDepartmentFormData(
  form: FormData
): Record<string, unknown> {
  const emptyToNull = (key: string) => {
    const value = form.get(key);
    if (typeof value !== "string" || value.trim() === "") return null;
    return value.trim();
  };

  return {
    name: form.get("name"),
    minAge: emptyToNull("minAge"),
    maxAge: emptyToNull("maxAge"),
  };
}

export function formatAgeRange(
  minAge: number | null,
  maxAge: number | null
): string {
  if (minAge == null && maxAge == null) return "—";
  if (minAge != null && maxAge != null) return `${minAge} – ${maxAge}`;
  if (minAge != null) return `≥ ${minAge}`;
  return `≤ ${maxAge}`;
}
