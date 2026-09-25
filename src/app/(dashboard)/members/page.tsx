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
import { DownloadImportTemplateButton } from "@/components/shared/download-import-template-button";
import { getMemberImportTemplate } from "@/actions/member-import-actions";
import { MemberTable } from "@/components/members/member-table";
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

function parseBooleanParam(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseFilters(params: SearchParams): MemberFiltersInput {
  const status = pickParam(params, "status");
  const sortBy = pickParam(params, "sortBy");
  const sortOrder = pickParam(params, "sortOrder");
  const pageRaw = pickParam(params, "page");

  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;

  const birthYearFromRaw = pickParam(params, "birthYearFrom");
  const birthYearToRaw = pickParam(params, "birthYearTo");
  const parsedBirthYearFrom = birthYearFromRaw
    ? parseInt(birthYearFromRaw, 10)
    : undefined;
  const parsedBirthYearTo = birthYearToRaw
    ? parseInt(birthYearToRaw, 10)
    : undefined;

  return {
    search: pickParam(params, "search"),
    status:
      status && MEMBER_STATUSES.includes(status as MemberStatus)
        ? (status as MemberStatus)
        : undefined,
    visitTeamId: pickParam(params, "visitTeamId"),
    ageDepartment: pickParam(params, "ageDepartment"),
    actualDepartment:
      pickParam(params, "actualDepartment") ?? pickParam(params, "department"),
    birthYearFrom: Number.isFinite(parsedBirthYearFrom)
      ? parsedBirthYearFrom
      : undefined,
    birthYearTo: Number.isFinite(parsedBirthYearTo)
      ? parsedBirthYearTo
      : undefined,
    isTrusted: parseBooleanParam(pickParam(params, "isTrusted")),
    isNtpPer: parseBooleanParam(pickParam(params, "isNtpPer")),
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
    ageDepartment: filters.ageDepartment,
    actualDepartment: filters.actualDepartment,
    birthYearFrom: filters.birthYearFrom,
    birthYearTo: filters.birthYearTo,
    isTrusted: filters.isTrusted,
    isNtpPer: filters.isNtpPer,
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
          <DownloadImportTemplateButton fetchTemplate={getMemberImportTemplate} />
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
        filters={filters}
      />
    </div>
  );
}
