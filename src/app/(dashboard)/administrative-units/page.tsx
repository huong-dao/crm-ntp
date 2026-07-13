import {
  getAdministrativeUnitStats,
  getProvinces,
} from "@/actions/administrative-unit-actions";
import { ImportAdministrativeUnitsDialog } from "@/components/administrative-units/import-units-dialog";
import { ProvinceTable } from "@/components/administrative-units/province-table";
import { Button } from "@/components/ui/button";
import { CancelIcon, SearchIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function AdministrativeUnitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const params = await searchParams;
  const search = pickParam(params, "search");
  const pageRaw = pickParam(params, "page");
  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const [stats, result] = await Promise.all([
    getAdministrativeUnitStats(),
    getProvinces({
      search,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Địa chỉ hành chính</h1>
          <p className="mt-1 text-sm text-gray-600">
            {stats.provinceCount} tỉnh/thành · {stats.districtCount} quận/huyện ·{" "}
            {stats.wardCount} phường/xã
          </p>
        </div>
        {isAdmin && <ImportAdministrativeUnitsDialog />}
      </div>

      <form
        method="get"
        className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="province-search">Tìm kiếm</Label>
            <Input
              id="province-search"
              name="search"
              placeholder="Tên hoặc mã tỉnh/thành..."
              defaultValue={search ?? ""}
            />
          </div>
          <Button type="submit" icon={SearchIcon}>
            Tìm
          </Button>
          {search && (
            <Button type="button" variant="outline" asChild icon={CancelIcon}>
              <Link href="/administrative-units">Xóa bộ lọc</Link>
            </Button>
          )}
        </div>
      </form>

      <ProvinceTable
        provinces={result.provinces}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={search}
      />
    </div>
  );
}
