import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseholdById } from "@/actions/household-actions";
import { DeleteHouseholdButton } from "@/components/households/delete-household-button";
import { HouseholdMembersTable } from "@/components/households/household-members-table";
import { Button } from "@/components/ui/button";
import { AddIcon, BackIcon, EditIcon } from "@/lib/button-icons";

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const household = await getHouseholdById(id);

  if (!household) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hộ gia đình: {household.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Chi tiết hộ và danh sách thành viên
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild icon={BackIcon}>
            <Link href="/households">Danh sách hộ</Link>
          </Button>
          <Button variant="outline" asChild icon={EditIcon}>
            <Link href={`/households/${household.id}/edit`}>Sửa hộ</Link>
          </Button>
          {household.memberCount === 0 && (
            <DeleteHouseholdButton
              householdId={household.id}
              householdCode={household.code}
            />
          )}
          <Button asChild icon={AddIcon}>
            <Link href={`/members/new?householdId=${household.id}`}>
              Thêm thành viên vào hộ
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Mã hộ</p>
          <p className="mt-1 text-lg font-semibold text-[#1e3a5f]">
            {household.code}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Chủ hộ</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {household.headName ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Số thành viên</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {household.memberCount}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">
          Thành viên trong hộ
        </h2>
        <div className="mt-4">
          <HouseholdMembersTable members={household.members} />
        </div>
      </div>
    </div>
  );
}
