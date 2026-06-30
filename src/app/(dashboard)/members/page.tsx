import Link from "next/link";
import { Suspense } from "react";
import {
  getMemberFilterOptions,
  getMembers,
} from "@/actions/member-actions";
import {
  AddMemberLink,
  MemberFilters,
} from "@/components/members/member-filters";
import { ExportMembersButton } from "@/components/members/export-members-button";
import { ImportMembersDialog } from "@/components/members/import-members-dialog";
import { MemberTable } from "@/components/members/member-table";
import { auth } from "@/lib/auth";
import {
  DEFAULT_PAGE_SIZE,
  MEMBER_STATUSES,
  type MemberFiltersInput,
} from "@/lib/member-list";
import type { MemberStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ViewIcon } from "@/lib/button-icons";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function parseFilters(params: SearchParams): MemberFiltersInput {
  const status = pickParam(params, "status");
  const sortBy = pickParam(params, "sortBy");
  const sortOrder = pickParam(params, "sortOrder");
  const pageRaw = pickParam(params, "page");

  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;

  return {
    search: pickParam(params, "search"),
    status:
      status && MEMBER_STATUSES.includes(status as MemberStatus)
        ? (status as MemberStatus)
        : undefined,
    visitTeamId: pickParam(params, "visitTeamId"),
    department: pickParam(params, "department"),
    page: Number.isFinite(parsedPage) ? parsedPage : 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy:
      sortBy === "code" || sortBy === "fullName" || sortBy === "status"
        ? sortBy
        : "fullName",
    sortOrder: sortOrder === "desc" ? "desc" : "asc",
  };
}

function FiltersFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">Đang tải bộ lọc...</p>
    </div>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const params = await searchParams;
  const filters = parseFilters(params);

  const [result, options] = await Promise.all([
    getMembers(filters),
    getMemberFilterOptions(),
  ]);

  const filterValues = {
    search: filters.search,
    status: filters.status,
    visitTeamId: filters.visitTeamId,
    department: filters.department,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Thành viên</h1>
          
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Button variant="outline" size="default" asChild icon={ViewIcon}>
            <Link href="/members/imports">Lịch sử import</Link>
          </Button>
          <Suspense fallback={null}>
            <ExportMembersButton />
          </Suspense>
          <ImportMembersDialog />
          <AddMemberLink />
        </div>
      </div>

      <div className="mt-6">
        <Suspense fallback={<FiltersFallback />}>
          <MemberFilters
            key={JSON.stringify(filterValues)}
            options={options}
            values={filterValues}
          />
        </Suspense>
      </div>

      <MemberTable
        members={result.members}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        isAdmin={isAdmin}
        filters={filters}
      />
    </div>
  );
}
