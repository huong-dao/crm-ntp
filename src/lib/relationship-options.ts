export const RELATIONSHIP_OPTIONS = [
  "Chủ hộ",
  "Vợ",
  "Chồng",
  "Con",
  "Cha",
  "Mẹ",
  "Anh",
  "Chị",
  "Em",
  "Ông",
  "Bà",
  "Cháu",
  "Khác",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

export function formatRelationship(value: string | null | undefined): string {
  return value?.trim() || "—";
}
