import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHeadMemberOptions,
  getHouseholdById,
} from "@/actions/household-actions";
import { HouseholdForm } from "@/components/households/household-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function EditHouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [household, headOptions] = await Promise.all([
    getHouseholdById(id),
    getHeadMemberOptions(id),
  ]);

  if (!household) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sửa hộ: {household.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">Cập nhật chủ hộ</p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href={`/households/${household.id}`}>Chi tiết</Link>
        </Button>
      </div>

      <HouseholdForm
        mode="edit"
        household={{
          id: household.id,
          code: household.code,
          headMemberId: household.headMemberId,
        }}
        headOptions={headOptions}
      />
    </div>
  );
}
