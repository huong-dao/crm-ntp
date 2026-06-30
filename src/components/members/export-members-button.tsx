"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { exportMembers } from "@/actions/member-actions";
import { ExportIcon } from "@/lib/button-icons";
import { Button } from "@/components/ui/button";
import { downloadBase64File } from "@/lib/download-base64";
import { MEMBER_STATUSES } from "@/lib/member-list";
import type { MemberStatus } from "@prisma/client";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function ExportMembersButton() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setError("");
    setLoading(true);

    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy");

    const result = await exportMembers({
      search: searchParams.get("search") || undefined,
      status:
        status && MEMBER_STATUSES.includes(status as MemberStatus)
          ? (status as MemberStatus)
          : undefined,
      visitTeamId: searchParams.get("visitTeamId") || undefined,
      department: searchParams.get("department") || undefined,
      sortBy:
        sortBy === "code" || sortBy === "fullName" || sortBy === "status"
          ? sortBy
          : "fullName",
      sortOrder: searchParams.get("sortOrder") === "desc" ? "desc" : "asc",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    downloadBase64File(result.data.base64, result.data.fileName, EXCEL_MIME);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleExport}
        disabled={loading}
        icon={loading ? undefined : ExportIcon}
      >
        {loading ? "Đang xuất..." : "Export Excel"}
      </Button>
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
