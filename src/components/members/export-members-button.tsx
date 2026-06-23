"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { exportMembers } from "@/actions/member-actions";
import { Button } from "@/components/ui/button";
import { CSV_UTF8_BOM } from "@/lib/csv";
import { MEMBER_STATUSES } from "@/lib/member-list";
import type { MemberStatus } from "@prisma/client";

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

    const blob = new Blob([CSV_UTF8_BOM + result.data], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `thanh-vien-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleExport}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        {loading ? "Đang xuất..." : "Export CSV"}
      </Button>
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
