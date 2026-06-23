import Link from "next/link";
import { getMemberFormOptions } from "@/actions/member-actions";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const householdId = pickParam(params, "householdId");
  const options = await getMemberFormOptions();

  const householdValid =
    householdId &&
    options.households.some((household) => household.id === householdId);

  const backHref = householdValid
    ? `/households/${householdId}`
    : "/members";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm thành viên mới</h1>
          <p className="mt-1 text-sm text-gray-600">
            Nhập thông tin thành viên — mã tín hữu tự động sinh khi lưu
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={backHref}>← Quay lại</Link>
        </Button>
      </div>

      {options.households.length === 0 ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Chưa có hộ gia đình. Cần tạo hộ trước khi thêm thành viên.
        </div>
      ) : (
        <MemberForm
          mode="create"
          options={options}
          defaultHouseholdId={householdValid ? householdId : undefined}
        />
      )}
    </div>
  );
}
