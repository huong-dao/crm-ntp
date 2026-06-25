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

  let options;
  try {
    options = await getMemberFormOptions();
  } catch {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm thành viên mới</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/members">← Quay lại</Link>
          </Button>
        </div>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Không thể tải form. Vui lòng đăng nhập lại hoặc thử lại sau.
        </div>
      </div>
    );
  }

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

      <MemberForm
        mode="create"
        options={options}
        defaultHouseholdId={householdValid ? householdId : undefined}
        forceCreateHousehold={options.households.length === 0}
      />
    </div>
  );
}
