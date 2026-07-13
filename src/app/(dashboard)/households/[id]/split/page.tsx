import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseholdById } from "@/actions/household-actions";
import { SplitHouseholdForm } from "@/components/households/split-household-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function SplitHouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const household = await getHouseholdById(id);

  if (!household) {
    notFound();
  }

  if (household.members.length <= 1) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tách hộ: {household.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Tách một phần thành viên sang hộ gia đình mới
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href={`/households/${household.id}`}>Chi tiết</Link>
        </Button>
      </div>

      <SplitHouseholdForm
        householdId={household.id}
        householdCode={household.code}
        members={household.members}
      />
    </div>
  );
}
