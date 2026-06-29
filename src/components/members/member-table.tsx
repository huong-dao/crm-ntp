import Link from "next/link";
import type { MemberListItem } from "@/actions/member-actions";
import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { Button } from "@/components/ui/button";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  type MemberFiltersInput,
} from "@/lib/member-list";

type SortableColumn = NonNullable<MemberFiltersInput["sortBy"]>;

function buildPageUrl(
  baseParams: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  const merged = { ...baseParams, ...updates };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `/members?${query}` : "/members";
}

function SortHeader({
  label,
  column,
  currentSort,
  currentOrder,
  baseParams,
}: {
  label: string;
  column: SortableColumn;
  currentSort: SortableColumn;
  currentOrder: "asc" | "desc";
  baseParams: Record<string, string | undefined>;
}) {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  return (
    <Link
      href={buildPageUrl(baseParams, {
        sortBy: column,
        sortOrder: nextOrder,
        page: "1",
      })}
      className={cn(
        "inline-flex items-center gap-1 hover:text-[#1e3a5f]",
        isActive && "font-semibold text-[#1e3a5f]"
      )}
    >
      {label}
      {isActive && (
        <span className="text-xs text-gray-400">
          {currentOrder === "asc" ? "↑" : "↓"}
        </span>
      )}
    </Link>
  );
}

function statusBadgeClass(status: MemberListItem["status"]) {
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

export function MemberTable({
  members,
  total,
  page,
  pageSize,
  totalPages,
  isAdmin,
  filters,
}: {
  members: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isAdmin: boolean;
  filters: MemberFiltersInput;
}) {
  const sortBy = filters.sortBy ?? "fullName";
  const sortOrder = filters.sortOrder ?? "asc";

  const baseParams: Record<string, string | undefined> = {
    search: filters.search,
    status: filters.status,
    visitTeamId: filters.visitTeamId,
    department: filters.department,
    sortBy,
    sortOrder,
  };

  if (members.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không tìm thấy thành viên.</p>
        <p className="mt-1 text-sm text-gray-500">
          Thử đổi bộ lọc hoặc thêm thành viên mới.
        </p>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-6 space-y-4">
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                <SortHeader
                  label="Mã tín hữu"
                  column="code"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  baseParams={baseParams}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                <SortHeader
                  label="Họ tên"
                  column="fullName"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  baseParams={baseParams}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã hộ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                <SortHeader
                  label="Tình trạng"
                  column="status"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  baseParams={baseParams}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Di động
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Ban ngành
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member, index) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/members/${member.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {member.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">{member.fullName}</td>
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
                <td className="px-4 py-3 text-gray-600">
                  {member.actualDepartmentName ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/members/${member.id}/edit`}>Sửa</Link>
                    </Button>
                    {isAdmin && (
                      <DeleteMemberButton
                        memberId={member.id}
                        memberCode={member.code}
                        memberName={member.fullName}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {members.map((member) => (
          <MobileDataCard
            key={member.id}
            actions={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/members/${member.id}/edit`}>Sửa</Link>
                </Button>
                {isAdmin && (
                  <DeleteMemberButton
                    memberId={member.id}
                    memberCode={member.code}
                    memberName={member.fullName}
                  />
                )}
              </>
            }
          >
            <Link
              href={`/members/${member.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {member.code}
            </Link>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {member.fullName}
            </p>
            <div className="mt-2">
              <MobileDataRow label="Mã hộ">
                {member.householdCode ?? "—"}
              </MobileDataRow>
              <MobileDataRow label="Tình trạng">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    statusBadgeClass(member.status)
                  )}
                >
                  {STATUS_LABELS[member.status]}
                </span>
              </MobileDataRow>
              <MobileDataRow label="Di động">
                {member.mobile1 ?? "—"}
              </MobileDataRow>
              <MobileDataRow label="Ban ngành">
                {member.actualDepartmentName ?? "—"}
              </MobileDataRow>
            </div>
          </MobileDataCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
        <p>
          Hiển thị {start}–{end} / {total} thành viên
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page <= 1}
          >
            <Link
              href={
                page <= 1
                  ? "#"
                  : buildPageUrl(baseParams, { page: String(page - 1) })
              }
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              Trước
            </Link>
          </Button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page >= totalPages}
          >
            <Link
              href={
                page >= totalPages
                  ? "#"
                  : buildPageUrl(baseParams, { page: String(page + 1) })
              }
              aria-disabled={page >= totalPages}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              Sau
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
