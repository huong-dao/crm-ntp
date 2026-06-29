import Link from "next/link";
import { DepartmentForm } from "@/components/departments/department-form";
import { Button } from "@/components/ui/button";

export default function NewDepartmentPage() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm ban ngành</h1>
          <p className="mt-1 text-sm text-gray-600">
            Nhập tên ban ngành và khoảng độ tuổi (nếu có)
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/departments">← Danh sách ban ngành</Link>
        </Button>
      </div>

      <DepartmentForm mode="create" />
    </div>
  );
}
