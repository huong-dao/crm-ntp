"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VisitTeamMemberItem } from "@/actions/visit-team-actions";
import { removeMemberFromVisitTeam } from "@/actions/visit-team-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/member-list";

function statusBadgeClass(status: MemberStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "transferred":
      return "bg-amber-100 text-amber-800";
    case "deceased":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function VisitTeamMembersTable({
  members,
}: {
  members: VisitTeamMemberItem[];
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleRemove(memberId: string, memberName: string) {
    if (
      !window.confirm(
        `Bỏ gán "${memberName}" khỏi tổ thăm viếng? Thành viên sẽ không còn trong tổ này.`
      )
    ) {
      return;
    }

    setError("");
    setRemovingId(memberId);

    const result = await removeMemberFromVisitTeam(memberId);

    setRemovingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Tổ chưa có thành viên được gán.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã tín hữu
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Họ tên
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã hộ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Tình trạng
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Di động
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member, index) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/members/${member.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {member.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {member.fullName}
                  {member.isLeader && (
                    <span className="ml-2 text-xs text-[#1e3a5f]">(Trưởng tổ)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {member.householdCode ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusBadgeClass(member.status)
                    )}
                  >
                    {STATUS_LABELS[member.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {member.mobile1 ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/members/${member.id}/edit`}>Sửa</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removingId === member.id}
                      onClick={() => handleRemove(member.id, member.fullName)}
                    >
                      {removingId === member.id ? "Đang bỏ..." : "Bỏ gán"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
