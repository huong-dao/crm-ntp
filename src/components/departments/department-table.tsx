import Link from "next/link";
import type { DepartmentListItem } from "@/actions/department-actions";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { EditIcon, ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";
import { membersFilterUrl } from "@/lib/member-list";
import { formatAgeRange } from "@/lib/validations/department";

function buildPageUrl(search: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/departments?${query}` : "/departments";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

function MemberCountLink({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  if (count === 0) {
    return <span className="text-gray-600">0</span>;
  }

  return (
    <Link href={href} className="text-[#1e3a5f] hover:underline">
      {count}
    </Link>
  );
}

export function DepartmentTable({
  departments,
  total,
  page,
  pageSize,
  totalPages,
  search,
}: {
  departments: DepartmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search?: string;
}) {
  if (departments.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không tìm thấy ban ngành.</p>
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
                Tên ban ngành
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Độ tuổi
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số thành viên theo độ tuổi
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số thành viên thực tế
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.map((department, index) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/departments/${department.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {department.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatAgeRange(department.minAge, department.maxAge)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <MemberCountLink
                    count={department.ageMemberCount}
                    href={membersFilterUrl({ ageDepartment: department.id })}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <MemberCountLink
                    count={department.actualMemberCount}
                    href={membersFilterUrl({ actualDepartment: department.id })}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(department.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                      <Link href={`/departments/${department.id}`}>Chi tiết</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild icon={EditIcon}>
                      <Link href={`/departments/${department.id}/edit`}>Sửa</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {departments.map((department) => (
          <MobileDataCard
            key={department.id}
            actions={
              <>
                <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                  <Link href={`/departments/${department.id}`}>Chi tiết</Link>
                </Button>
                <Button variant="outline" size="sm" asChild icon={EditIcon}>
                  <Link href={`/departments/${department.id}/edit`}>Sửa</Link>
                </Button>
              </>
            }
          >
            <Link
              href={`/departments/${department.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {department.name}
            </Link>
            <div className="mt-2">
              <MobileDataRow label="Độ tuổi">
                {formatAgeRange(department.minAge, department.maxAge)}
              </MobileDataRow>
              <MobileDataRow label="Số thành viên theo độ tuổi">
                <MemberCountLink
                  count={department.ageMemberCount}
                  href={membersFilterUrl({ ageDepartment: department.id })}
                />
              </MobileDataRow>
              <MobileDataRow label="Số thành viên thực tế">
                <MemberCountLink
                  count={department.actualMemberCount}
                  href={membersFilterUrl({ actualDepartment: department.id })}
                />
              </MobileDataRow>
              <MobileDataRow label="Ngày tạo">
                {formatDate(department.createdAt)}
              </MobileDataRow>
            </div>
          </MobileDataCard>
        ))}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        getPageHref={(p) => buildPageUrl(search, p)}
        summary={
          <>
            Hiển thị {start}–{end} / {total} ban ngành
          </>
        }
      />
    </div>
  );
}
