import type { VisitRequestStaffOption } from "@/actions/visit-request-actions";
import { parseStaffCodeList } from "@/lib/validations/visit-request";

export function VisitRequestStaffDisplay({
  staffCodes,
  staffMembers,
}: {
  staffCodes: string | null;
  staffMembers: VisitRequestStaffOption[];
}) {
  if (!staffCodes) {
    return <p className="text-gray-600">Chưa gán nhân sự.</p>;
  }

  const codes = parseStaffCodeList(staffCodes);
  const memberByCode = new Map(
    staffMembers.map((member) => [member.code.toLowerCase(), member])
  );

  return (
    <ul className="space-y-1 text-sm">
      {codes.map((code) => {
        const member = memberByCode.get(code.toLowerCase());
        return (
          <li key={code} className="text-gray-900">
            <span className="font-medium">{code}</span>
            {member ? (
              <span className="text-gray-600"> — {member.fullName}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
