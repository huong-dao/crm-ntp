"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelMemberImportLog,
  importMemberBatch,
  startMemberImport,
  type ImportMembersResult,
} from "@/actions/member-import-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, ImportIcon, SaveIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";
import {
  extractImportDataRows,
  parseImportHeaders,
} from "@/lib/member-import";
import { parseSpreadsheetFile } from "@/lib/spreadsheet-client";
import {
  ImportProgressModal,
  type ImportProgressState,
} from "@/components/import-progress-modal";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const BATCH_SIZE = 25;

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ImportMembersDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportMembersResult | null>(null);
  const [progress, setProgress] = useState<ImportProgressState | null>(null);

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

    let logId: string | null = null;

    try {
      const parsed = await parseSpreadsheetFile(file);

      const headerResult = parseImportHeaders(parsed);
      if (!headerResult.ok) {
        setError(headerResult.error);
        return;
      }

      const dataRows = extractImportDataRows(parsed);
      if (dataRows.length === 0) {
        setError("Không có dòng dữ liệu hợp lệ để import");
        return;
      }

      setProgress((prev) =>
        prev
          ? { ...prev, phase: "importing", totalRows: dataRows.length }
          : null
      );

      const start = await startMemberImport({
        fileName: file.name,
        columnHeaders: parsed[0],
        totalRows: dataRows.length,
      });

      if (!start.success) {
        setError(start.error);
        return;
      }

      logId = start.data.logId;
      const allResults: ImportMembersResult["results"] = [];
      let successCount = 0;
      let errorCount = 0;
      let processedRows = 0;

      for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
        const batch = dataRows.slice(i, i + BATCH_SIZE);
        const isLastBatch = i + BATCH_SIZE >= dataRows.length;
        const batchResult = await importMemberBatch(logId, batch, {
          isLastBatch,
        });

        if (!batchResult.success) {
          await cancelMemberImportLog(logId);
          logId = null;
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

      setProgress((prev) =>
        prev
          ? {
              ...prev,
              phase: "done",
              processedRows: dataRows.length,
              successCount,
              errorCount,
            }
          : null
      );

      setResult({
        logId,
        successCount,
        errorCount,
        results: allResults,
      });
      router.refresh();
    } catch {
      if (logId) {
        await cancelMemberImportLog(logId);
      }
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
      <Button type="button" variant="outline" icon={ImportIcon} onClick={() => setOpen(true)}>
        Import Excel
      </Button>
    );
  }

  return (
    <>
      {progress && (
        <ImportProgressModal progress={progress} entityLabel="thành viên" />
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-members-title"
      >
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
          <h2
            id="import-members-title"
            className="text-lg font-semibold text-gray-900"
          >
            Import thành viên từ Excel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Dùng file Excel (.xlsx) với đầy đủ cột như file mẫu (tải từ nút{" "}
            <strong>Tải file mẫu</strong> trên trang). Bắt buộc:{" "}
            <strong>Họ và lót</strong>, <strong>Tên</strong>, <strong>Mã hộ</strong>.
            Hộ, tổ thăm viếng hoặc ban ngành chưa có sẽ được{" "}
            <strong>tự tạo</strong>. Mã tín hữu đã có sẽ được{" "}
            <strong>cập nhật</strong>, chưa có thì tạo mới (tự sinh mã nếu để trống).
            Ban ngành theo tuổi được <strong>tự gán</strong> từ năm sinh khi có thể.
          </p>
          <p className="mt-2 text-sm text-amber-800">
            Nên import thành viên trước khi import tổ thăm viếng (tổ cần mã tín
            hữu trưởng tổ).
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-excel-file">Chọn file Excel</Label>
              <input
                ref={fileRef}
                id="import-excel-file"
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
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
              {result.logId && (
                <p className="mt-3">
                  <Link
                    href={`/members/imports/${result.logId}`}
                    className="font-medium text-[#1e3a5f] underline"
                  >
                    Xem chi tiết log import →
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              icon={CancelIcon}
              onClick={handleClose}
              disabled={importing}
            >
              {result ? "Đóng" : "Hủy"}
            </Button>
            {!result && (
              <Button
                type="button"
                icon={importing ? undefined : SaveIcon}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Đang import..." : "Import"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
