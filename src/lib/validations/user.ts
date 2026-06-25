import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(50, "Username tối đa 50 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và _"),
  password: z
    .string()
    .min(6, "Password tối thiểu 6 ký tự")
    .max(100, "Password tối đa 100 ký tự"),
  role: z.enum(["admin", "user"], {
    message: "Role không hợp lệ",
  }),
});

export const toggleUserActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export const updateUserSchema = z
  .object({
    id: z.string().min(1),
    password: z
      .string()
      .max(100, "Password tối đa 100 ký tự")
      .optional()
      .nullable(),
    role: z.enum(["admin", "user"], {
      message: "Role không hợp lệ",
    }),
    isActive: z.boolean(),
    memberId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const password = data.password?.trim();
    if (password && password.length > 0 && password.length < 6) {
      ctx.addIssue({
        code: "custom",
        message: "Password tối thiểu 6 ký tự",
        path: ["password"],
      });
    }
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
