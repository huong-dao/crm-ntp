import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentById } from "@/actions/department-actions";
import { Button } from "@/components/ui/button";
import { BackIcon, EditIcon } from "@/lib/button-icons";
import { membersFilterUrl } from "@/lib/member-list";
import { formatAgeRange } from "@/lib/validations/department";

function MemberCountLink({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  if (count === 0) {
    return <span>{count} thành viên</span>;
  }

  return (
    <Link href={href} className="text-[#1e3a5f] hover:underline">
      {count} thành viên
    </Link>
  );
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    notFound();
  }

  const createdAt = new Date(department.createdAt).toLocaleDateString("vi-VN");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Chi tiết ban ngành</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild icon={EditIcon}>
            <Link href={`/departments/${department.id}/edit`}>Sửa</Link>
          </Button>
          <Button variant="outline" asChild icon={BackIcon}>
            <Link href="/departments">Danh sách ban ngành</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Tên ban ngành</dt>
            <dd className="mt-1 font-medium text-gray-900">{department.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Độ tuổi</dt>
            <dd className="mt-1 text-gray-900">
              {formatAgeRange(department.minAge, department.maxAge)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Ban ngành theo tuổi</dt>
            <dd className="mt-1 text-gray-900">
              <MemberCountLink
                count={department.ageMemberCount}
                href={membersFilterUrl({ ageDepartment: department.id })}
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Ban ngành thực tế</dt>
            <dd className="mt-1 text-gray-900">
              <MemberCountLink
                count={department.actualMemberCount}
                href={membersFilterUrl({ actualDepartment: department.id })}
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Ngày tạo</dt>
            <dd className="mt-1 text-gray-900">{createdAt}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
