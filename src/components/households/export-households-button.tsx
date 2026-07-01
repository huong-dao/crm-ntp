"use client";

import { useSearchParams } from "next/navigation";
import { exportHouseholds } from "@/actions/household-actions";
import { ExportExcelButton } from "@/components/shared/export-excel-button";

export function ExportHouseholdsButton() {
  const searchParams = useSearchParams();

  return (
    <ExportExcelButton
      onExport={() =>
        exportHouseholds({
          search: searchParams.get("search") || undefined,
        })
      }
    />
  );
}
