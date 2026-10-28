import { Suspense } from "react";
import type { HouseholdStatus } from "@prisma/client";
import { getHouseholds } from "@/actions/household-actions";
import { ExportHouseholdsButton } from "@/components/households/export-households-button";
import { HouseholdTable } from "@/components/households/household-table";
import { Button } from "@/components/ui/button";
import { AddIcon, CancelIcon, SearchIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";
import { HOUSEHOLD_STATUS_LABELS } from "@/lib/household-status";

const HOUSEHOLD_STATUS_VALUES: HouseholdStatus[] = ["active", "inactive"];

function isHouseholdStatus(value: string): value is HouseholdStatus {
  return (HOUSEHOLD_STATUS_VALUES as string[]).includes(value);
}

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
  const statusRaw = pickParam(params, "status");
  const status = statusRaw && isHouseholdStatus(statusRaw) ? statusRaw : undefined;
  const pageRaw = pickParam(params, "page");
  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const result = await getHouseholds({
    search,
    status,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Hộ gia đình</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Suspense fallback={null}>
            <ExportHouseholdsButton />
          </Suspense>
          <Button asChild icon={AddIcon}>
            <Link href="/households/new">Thêm hộ</Link>
          </Button>
        </div>
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
          <div className="min-w-[160px] space-y-2">
            <Label htmlFor="household-status">Trạng thái</Label>
            <select
              id="household-status"
              name="status"
              defaultValue={status ?? ""}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
            >
              <option value="">Tất cả</option>
              {HOUSEHOLD_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {HOUSEHOLD_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" icon={SearchIcon}>Tìm</Button>
          {(search || status) && (
            <Button type="button" variant="outline" asChild icon={CancelIcon}>
              <Link href="/households">Xóa bộ lọc</Link>
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
        status={status}
      />
    </div>
  );
}
