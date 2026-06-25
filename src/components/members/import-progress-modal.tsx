"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export type ImportProgressState = {
  phase: "parsing" | "importing" | "done";
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
};

export function ImportProgressModal({ progress }: { progress: ImportProgressState }) {
  const isActive = progress.phase === "parsing" || progress.phase === "importing";

  useEffect(() => {
    if (!isActive) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive]);

  const percent =
    progress.totalRows > 0
      ? Math.min(
          100,
          Math.round((progress.processedRows / progress.totalRows) * 100)
        )
      : progress.phase === "parsing"
        ? 0
        : 100;

  const statusText =
    progress.phase === "parsing"
      ? "Đang đọc file..."
      : progress.phase === "importing"
        ? `Đang import dòng ${progress.processedRows} / ${progress.totalRows}...`
        : "Hoàn tất import";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="import-progress-title"
      aria-busy={isActive}
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          {isActive && (
            <Loader2
              className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1e3a5f]"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <h2
              id="import-progress-title"
              className="text-lg font-semibold text-gray-900"
            >
              {progress.phase === "done" ? "Import xong" : "Đang import thành viên"}
            </h2>
            <p className="mt-1 truncate text-sm text-gray-600">{progress.fileName}</p>
          </div>
        </div>

        {isActive && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Vui lòng <strong>không đóng</strong> hoặc tải lại trang cho đến khi import
            hoàn tất.
          </p>
        )}

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{statusText}</span>
            <span className="font-medium tabular-nums text-gray-900">{percent}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Tiến độ import"
          >
            <div
              className="h-full rounded-full bg-[#1e3a5f] transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-md bg-gray-50 px-2 py-2">
            <p className="text-xs text-gray-500">Tổng dòng</p>
            <p className="font-semibold text-gray-900">{progress.totalRows}</p>
          </div>
          <div className="rounded-md bg-green-50 px-2 py-2">
            <p className="text-xs text-green-700">Thành công</p>
            <p className="font-semibold text-green-800">{progress.successCount}</p>
          </div>
          <div className="rounded-md bg-red-50 px-2 py-2">
            <p className="text-xs text-red-700">Lỗi</p>
            <p className="font-semibold text-red-800">{progress.errorCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
