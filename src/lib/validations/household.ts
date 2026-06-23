import { z } from "zod";

export const householdFormSchema = z.object({
  headMemberId: z.string().optional().nullable(),
});

export type HouseholdFormInput = z.infer<typeof householdFormSchema>;
