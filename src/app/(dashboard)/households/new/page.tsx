import Link from "next/link";
import { getHeadMemberOptions } from "@/actions/household-actions";
import { HouseholdForm } from "@/components/households/household-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function NewHouseholdPage() {
  const headOptions = await getHeadMemberOptions();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo hộ gia đình mới</h1>
          <p className="mt-1 text-sm text-gray-600">
            Mã hộ tự động sinh — có thể chọn chủ hộ sau
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href="/households">Danh sách hộ</Link>
        </Button>
      </div>

      <HouseholdForm mode="create" headOptions={headOptions} />
    </div>
  );
}
