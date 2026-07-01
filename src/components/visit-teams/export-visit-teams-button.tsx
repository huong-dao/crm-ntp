"use client";

import { useSearchParams } from "next/navigation";
import { exportVisitTeams } from "@/actions/visit-team-actions";
import { ExportExcelButton } from "@/components/shared/export-excel-button";

export function ExportVisitTeamsButton() {
  const searchParams = useSearchParams();

  return (
    <ExportExcelButton
      onExport={() =>
        exportVisitTeams({
          search: searchParams.get("search") || undefined,
        })
      }
    />
  );
}
