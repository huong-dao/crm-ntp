import { parseStaffCodeList } from "@/lib/validations/visit-request";

export function VisitRequestStaffDisplay({
  representativeMemberId,
  representativeMemberCode,
  representativeMemberName,
  staffCodes,
}: {
  representativeMemberId: string | null;
  representativeMemberCode?: string | null;
  representativeMemberName?: string | null;
  staffCodes: string | null;
}) {
  const additionalCodes = staffCodes ? parseStaffCodeList(staffCodes) : [];

  if (!representativeMemberId && additionalCodes.length === 0) {
    return <p className="text-gray-600">Chưa gán nhân sự.</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {representativeMemberId && (
        <li className="text-gray-900">
          <span className="font-medium">
            {representativeMemberCode ?? "—"}
          </span>
          {representativeMemberName ? (
            <span className="text-gray-600"> — {representativeMemberName}</span>
          ) : null}
          <span className="ml-2 text-xs text-[#1e3a5f]">(Đại diện)</span>
        </li>
      )}
      {additionalCodes.map((code) => (
        <li key={code} className="text-gray-900">
          <span className="font-medium">{code}</span>
        </li>
      ))}
    </ul>
  );
}
