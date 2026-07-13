import Link from "next/link";
import { getVisitRequestFormContext } from "@/actions/visit-request-actions";
import { VisitRequestForm } from "@/components/visit-requests/visit-request-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function NewVisitRequestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const householdId = pickParam(params, "householdId");
  const options = await getVisitRequestFormContext();

  if (!options.canCreate) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tạo đơn thăm viếng
            </h1>
          </div>
          <Button variant="outline" asChild icon={BackIcon}>
            <Link href="/visit-requests">Quay lại</Link>
          </Button>
        </div>
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tài khoản chưa được gán nhân sự Ban thăm viếng — không thể tạo đơn.
          Liên hệ admin để gán tổ thăm viếng.
        </div>
      </div>
    );
  }

  const householdValid =
    householdId &&
    options.households.some((household) => household.id === householdId);

  const backHref = householdValid
    ? `/households/${householdId}`
    : "/visit-requests";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tạo đơn thăm viếng
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Lên kế hoạch thăm viếng cho hộ gia đình
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href={backHref}>Quay lại</Link>
        </Button>
      </div>

      <VisitRequestForm
        mode="create"
        context={options}
        defaultHouseholdId={householdValid ? householdId : undefined}
      />
    </div>
  );
}
