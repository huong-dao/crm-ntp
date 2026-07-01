"use client";

import { useState } from "react";
import { ExportIcon } from "@/lib/button-icons";
import { Button } from "@/components/ui/button";
import { downloadBase64File } from "@/lib/download-base64";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type ExportResult =
  | { success: true; data: { base64: string; fileName: string } }
  | { success: false; error: string };

type ExportExcelButtonProps = {
  label?: string;
  onExport: () => Promise<ExportResult>;
};

export function ExportExcelButton({
  label = "Export Excel",
  onExport,
}: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setError("");
    setLoading(true);

    const result = await onExport();
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    downloadBase64File(
      result.data.base64,
      result.data.fileName,
      EXCEL_MIME
    );
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
        {loading ? "Đang xuất..." : label}
      </Button>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
