import Link from "next/link";
import type { VisitRequestTeamOption } from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildVisitRequestListUrl,
  hasVisitRequestFilters,
  VISIT_REQUEST_STATUSES,
  VISIT_REQUEST_STATUS_LABELS,
  type VisitRequestFilterValues,
} from "@/lib/visit-request-list";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function VisitRequestFilters({
  visitTeams,
  values,
}: {
  visitTeams: VisitRequestTeamOption[];
  values: VisitRequestFilterValues;
}) {
  const selectedStatuses = values.status ?? [];
  const hasFilters = hasVisitRequestFilters(values);

  return (
    <form
      method="get"
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="visit-request-search">Tìm kiếm</Label>
          <Input
            id="visit-request-search"
            name="search"
            placeholder="Mã đơn, mã hộ, mã tổ, nhân sự..."
            defaultValue={values.search ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitTeamId">Tổ thăm viếng</Label>
          <select
            id="visitTeamId"
            name="visitTeamId"
            className={selectClass}
            defaultValue={values.visitTeamId ?? ""}
          >
            <option value="">Tất cả tổ</option>
            {visitTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.code} — {team.area}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom">Lịch từ ngày</Label>
          <Input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={values.dateFrom ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo">Lịch đến ngày</Label>
          <Input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={values.dateTo ?? ""}
          />
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-4">
          <Label>Tình trạng</Label>
          <div className="flex flex-wrap gap-4">
            {VISIT_REQUEST_STATUSES.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  name="status"
                  value={status}
                  defaultChecked={selectedStatuses.includes(status)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {VISIT_REQUEST_STATUS_LABELS[status]}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">Lọc</Button>
        {hasFilters && (
          <Button type="button" variant="outline" asChild>
            <Link href="/visit-requests">Xóa bộ lọc</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
