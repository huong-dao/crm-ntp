import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentById } from "@/actions/department-actions";
import { DeleteDepartmentButton } from "@/components/departments/delete-department-button";
import { DepartmentForm } from "@/components/departments/department-form";
import { Button } from "@/components/ui/button";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    notFound();
  }

  const canDelete =
    department.ageMemberCount === 0 && department.actualMemberCount === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sửa ban ngành: {department.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Cập nhật tên và khoảng độ tuổi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/departments/${department.id}`}>Chi tiết</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/departments">← Danh sách ban ngành</Link>
          </Button>
        </div>
      </div>

      <DepartmentForm
        mode="edit"
        department={{
          id: department.id,
          name: department.name,
          minAge: department.minAge,
          maxAge: department.maxAge,
        }}
      />

      {canDelete && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <DeleteDepartmentButton
            departmentId={department.id}
            departmentName={department.name}
          />
        </div>
      )}
    </div>
  );
}
