import Link from "next/link";
import { getVisitRequests, getVisitRequestFilterOptions } from "@/actions/visit-request-actions";
import { VisitRequestFilters } from "@/components/visit-requests/visit-request-filters";
import { VisitRequestTable } from "@/components/visit-requests/visit-request-table";
import { Button } from "@/components/ui/button";
import { AddIcon } from "@/lib/button-icons";
import {
  VISIT_REQUEST_STATUSES,
  type VisitRequestFilterValues,
} from "@/lib/visit-request-list";
import type { VisitRequestStatus } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function pickStatuses(params: SearchParams): VisitRequestStatus[] | undefined {
  const value = params.status;
  if (!value) return undefined;

  const raw = Array.isArray(value) ? value : [value];
  const valid = raw.filter((status): status is VisitRequestStatus =>
    VISIT_REQUEST_STATUSES.includes(status as VisitRequestStatus)
  );

  return valid.length > 0 ? valid : undefined;
}

export default async function VisitRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = pickParam(params, "search");
  const visitTeamId = pickParam(params, "visitTeamId");
  const dateFrom = pickParam(params, "dateFrom");
  const dateTo = pickParam(params, "dateTo");
  const status = pickStatuses(params);
  const pageRaw = pickParam(params, "page");
  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const filterValues: VisitRequestFilterValues = {
    search,
    visitTeamId,
    dateFrom,
    dateTo,
    status,
  };

  const [result, filterOptions] = await Promise.all([
    getVisitRequests({
      search,
      visitTeamId,
      dateFrom,
      dateTo,
      status,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    getVisitRequestFilterOptions(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách Đơn thăm viếng
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi lịch và tình trạng thăm viếng các hộ gia đình
          </p>
        </div>
        <Button asChild icon={AddIcon}>
          <Link href="/visit-requests/new">Tạo đơn</Link>
        </Button>
      </div>

      <div className="mt-6">
        <VisitRequestFilters
          visitTeams={filterOptions.visitTeams}
          values={filterValues}
        />
      </div>

      <VisitRequestTable
        requests={result.requests}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        filters={filterValues}
      />
    </div>
  );
}
