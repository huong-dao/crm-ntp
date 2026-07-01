"use client";

import { useSearchParams } from "next/navigation";
import { exportVisitRequests } from "@/actions/visit-request-actions";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { VISIT_REQUEST_STATUSES } from "@/lib/visit-request-list";
import type { VisitRequestStatus } from "@prisma/client";

export function ExportVisitRequestsButton() {
  const searchParams = useSearchParams();

  function pickStatuses(): VisitRequestStatus[] | undefined {
    const values = searchParams.getAll("status");
    const valid = values.filter((status): status is VisitRequestStatus =>
      VISIT_REQUEST_STATUSES.includes(status as VisitRequestStatus)
    );
    return valid.length > 0 ? valid : undefined;
  }

  return (
    <ExportExcelButton
      onExport={() =>
        exportVisitRequests({
          search: searchParams.get("search") || undefined,
          visitTeamId: searchParams.get("visitTeamId") || undefined,
          dateFrom: searchParams.get("dateFrom") || undefined,
          dateTo: searchParams.get("dateTo") || undefined,
          status: pickStatuses(),
        })
      }
    />
  );
}
