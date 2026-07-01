"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TemplateIcon } from "@/lib/button-icons";
import { downloadBase64File } from "@/lib/download-base64";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type TemplateResult =
  | { success: true; data: { base64: string; fileName: string } }
  | { success: false; error: string };

type DownloadImportTemplateButtonProps = {
  label?: string;
  fetchTemplate: () => Promise<TemplateResult>;
};

export function DownloadImportTemplateButton({
  label = "Tải file mẫu",
  fetchTemplate,
}: DownloadImportTemplateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setError("");
    setLoading(true);

    const result = await fetchTemplate();
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
        onClick={handleDownload}
        disabled={loading}
        icon={loading ? undefined : TemplateIcon}
      >
        {loading ? "Đang tạo file mẫu..." : label}
      </Button>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
