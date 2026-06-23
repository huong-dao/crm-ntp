import { getHouseholds } from "@/actions/household-actions";
import { HouseholdTable } from "@/components/households/household-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function HouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = pickParam(params, "search");
  const pageRaw = pickParam(params, "page");
  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const result = await getHouseholds({
    search,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Hộ gia đình</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý hộ gia đình và thành viên trong hộ
          </p>
        </div>
        <Button asChild>
          <Link href="/households/new">+ Thêm hộ</Link>
        </Button>
      </div>

      <form
        method="get"
        className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="household-search">Tìm kiếm</Label>
            <Input
              id="household-search"
              name="search"
              placeholder="Mã hộ, tên chủ hộ..."
              defaultValue={search ?? ""}
            />
          </div>
          <Button type="submit">Tìm</Button>
          {search && (
            <Button type="button" variant="outline" asChild>
              <a href="/households">Xóa bộ lọc</a>
            </Button>
          )}
        </div>
      </form>

      <HouseholdTable
        households={result.households}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={search}
      />
    </div>
  );
}
