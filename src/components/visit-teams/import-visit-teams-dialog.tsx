"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  getVisitTeamImportTemplate,
  importVisitTeamBatch,
  type ImportVisitTeamsResult,
} from "@/actions/visit-team-import-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ImportProgressModal,
  type ImportProgressState,
} from "@/components/import-progress-modal";
import { downloadBase64File } from "@/lib/download-base64";
import {
  extractVisitTeamImportRows,
  parseVisitTeamImportHeaders,
} from "@/lib/visit-team-import";
import { parseSpreadsheetFile } from "@/lib/spreadsheet-client";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const BATCH_SIZE = 25;

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ImportVisitTeamsDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportVisitTeamsResult | null>(null);
  const [progress, setProgress] = useState<ImportProgressState | null>(null);

  async function downloadTemplate() {
    setTemplateLoading(true);
    setError("");
    const templateResult = await getVisitTeamImportTemplate();
    setTemplateLoading(false);
    if (!templateResult.success) {
      setError(templateResult.error);
      return;
    }
    downloadBase64File(
      templateResult.data.base64,
      templateResult.data.fileName,
      EXCEL_MIME
    );
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chọn file Excel trước khi import");
      return;
    }
    if (!isAcceptedFile(file)) {
      setError("Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV");
      return;
    }

    setError("");
    setResult(null);
    setImporting(true);
    setProgress({
      phase: "parsing",
      fileName: file.name,
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
    });

    try {
      const parsed = await parseSpreadsheetFile(file);
      const headerResult = parseVisitTeamImportHeaders(parsed);
      if (!headerResult.ok) {
        setError(headerResult.error);
        return;
      }

      const dataRows = extractVisitTeamImportRows(parsed);
      if (dataRows.length === 0) {
        setError("Không có dòng dữ liệu hợp lệ để import");
        return;
      }

      setProgress((prev) =>
        prev
          ? { ...prev, phase: "importing", totalRows: dataRows.length }
          : null
      );

      const allResults: ImportVisitTeamsResult["results"] = [];
      let successCount = 0;
      let errorCount = 0;
      let processedRows = 0;

      for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
        const batch = dataRows.slice(i, i + BATCH_SIZE);
        const isLastBatch = i + BATCH_SIZE >= dataRows.length;
        const batchResult = await importVisitTeamBatch(batch, parsed[0], {
          isLastBatch,
        });

        if (!batchResult.success) {
          setError(batchResult.error);
          return;
        }

        successCount += batchResult.data.successCount;
        errorCount += batchResult.data.errorCount;
        processedRows += batch.length;
        allResults.push(...batchResult.data.results);

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                phase: "importing",
                processedRows,
                successCount,
                errorCount,
              }
            : null
        );
      }

      setResult({ successCount, errorCount, results: allResults });
      router.refresh();
    } catch {
      setError("Không đọc được file — thử lưu lại bằng Excel (.xlsx)");
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  function handleClose() {
    if (importing) return;
    setOpen(false);
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import Excel
      </Button>
    );
  }

  return (
    <>
      {progress && (
        <ImportProgressModal
          progress={progress}
          entityLabel="tổ thăm viếng"
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-visit-teams-title"
      >
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
          <h2
            id="import-visit-teams-title"
            className="text-lg font-semibold text-gray-900"
          >
            Import tổ thăm viếng từ Excel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            File cần 3 cột: <strong>Mã tổ thăm viếng</strong>,{" "}
            <strong>Mã tín hữu</strong> (trưởng tổ, tùy chọn),{" "}
            <strong>Khu vực phụ trách</strong>. Tổ đã có sẽ được cập nhật.
          </p>

          <div className="mt-4 space-y-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              disabled={templateLoading || importing}
            >
              {templateLoading ? "Đang tạo file mẫu..." : "Tải file mẫu Excel"}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="import-visit-team-file">Chọn file Excel</Label>
              <input
                ref={fileRef}
                id="import-visit-team-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={importing}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="font-medium text-gray-900">
                Thành công: {result.successCount} · Lỗi: {result.errorCount}
              </p>
              {result.results.some((r) => !r.success) && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-red-700">
                  {result.results
                    .filter((r) => !r.success)
                    .map((r) => (
                      <li key={r.row}>
                        Dòng {r.row}: {r.error}
                      </li>
                    ))}
                </ul>
              )}
              {result.successCount > 0 && (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-green-800">
                  {result.results
                    .filter((r) => r.success)
                    .slice(0, 10)
                    .map((r) => (
                      <li key={r.row}>
                        Dòng {r.row}: {r.code}
                      </li>
                    ))}
                  {result.successCount > 10 && (
                    <li className="text-gray-500">
                      ... và {result.successCount - 10} dòng khác
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              {result ? "Đóng" : "Hủy"}
            </Button>
            {!result && (
              <Button type="button" onClick={handleImport} disabled={importing}>
                {importing ? "Đang import..." : "Import"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
