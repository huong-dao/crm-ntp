export const HOUSEHOLD_EXPORT_HEADERS = [
  "Mã hộ",
  "Mã tín hữu chủ hộ",
  "Tên chủ hộ",
  "Số thành viên",
];

export type HouseholdExportRecord = {
  code: string;
  headMember: { code: string; fullName: string } | null;
  memberCount: number;
};

export function householdToExportRow(record: HouseholdExportRecord): string[] {
  return [
    record.code,
    record.headMember?.code ?? "",
    record.headMember?.fullName ?? "",
    String(record.memberCount),
  ];
}
