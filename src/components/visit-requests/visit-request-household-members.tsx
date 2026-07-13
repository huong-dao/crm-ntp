"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getVisitRequestHouseholdMembers,
  type VisitRequestHouseholdMember,
} from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { AddIcon } from "@/lib/button-icons";
import { STATUS_LABELS } from "@/lib/member-list";
import type { MemberStatus } from "@prisma/client";

export function VisitRequestHouseholdMembers({
  householdId,
  requestId,
}: {
  householdId: string;
  requestId?: string;
}) {
  const [members, setMembers] = useState<VisitRequestHouseholdMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!householdId) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getVisitRequestHouseholdMembers(householdId)
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [householdId]);

  if (!householdId) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Thành viên trong hộ
        </h3>
        <div className="flex flex-wrap gap-2">
          {requestId && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/visit-requests/${requestId}/print-members`}
                target="_blank"
              >
                PDF thành viên
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild icon={AddIcon}>
            <Link href={`/members/new?householdId=${householdId}`}>
              Thêm thành viên
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/households/${householdId}/split`}>Tách hộ</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Đang tải...</p>
      ) : members.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Hộ chưa có thành viên.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Họ tên</th>
                <th className="py-2 pr-3 font-medium">Quan hệ</th>
                <th className="py-2 pr-3 font-medium">Năm sinh</th>
                <th className="py-2 pr-3 font-medium">Tình trạng</th>
                <th className="py-2 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-200">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/members/${member.id}`}
                      className="font-medium text-[#1e3a5f] hover:underline"
                    >
                      {member.fullName}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-700">
                    {member.relationship ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">
                    {member.birthYear ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">
                    {STATUS_LABELS[member.status as MemberStatus]}
                  </td>
                  <td className="py-2 text-gray-700 max-w-[200px] truncate">
                    {member.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
