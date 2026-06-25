"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  exportFailedImportRowsExcel,
  retryFailedImportRows,
} from "@/actions/member-import-actions";
import { Button } from "@/components/ui/button";
import { downloadBase64File } from "@/lib/download-base64";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function MemberImportLogActions({
  logId,
  failedCount,
}: {
  logId: string;
  failedCount: number;
}) {
  const router = useRouter();
  const [retryLoading, setRetryLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRetry() {
    setError("");
    setMessage("");
    setRetryLoading(true);

    const result = await retryFailedImportRows(logId);
    setRetryLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setMessage(
      `Import lại xong: ${result.data.successCount} thành công, ${result.data.errorCount} vẫn lỗi`
    );
    router.refresh();
  }

  async function handleExportFailed() {
    setError("");
    setExportLoading(true);

    const result = await exportFailedImportRowsExcel(logId);
    setExportLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    downloadBase64File(result.data.base64, result.data.fileName, EXCEL_MIME);
  }

  if (failedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleRetry}
          disabled={retryLoading || exportLoading}
        >
          {retryLoading ? "Đang import lại..." : "Import lại dòng lỗi"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportFailed}
          disabled={retryLoading || exportLoading}
        >
          {exportLoading ? "Đang xuất..." : "Tải Excel dòng lỗi"}
        </Button>
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
