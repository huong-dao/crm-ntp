// Shared types — mở rộng ở các bước sau (Prisma models, form types)

export type UserRole = "admin" | "user";

export type MemberStatus = "active" | "inactive" | "transferred" | "deceased";

export type Gender = "male" | "female";

export type VisitRequestStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "postponed";
