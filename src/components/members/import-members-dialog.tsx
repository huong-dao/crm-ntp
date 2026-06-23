"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  importMembers,
  type ImportMembersResult,
} from "@/actions/member-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  buildMemberImportTemplate,
  CSV_UTF8_BOM,
} from "@/lib/csv";

export function ImportMembersDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportMembersResult | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_UTF8_BOM + buildMemberImportTemplate()], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau-import-thanh-vien.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chọn file CSV trước khi import");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    const text = await file.text();
    const importResult = await importMembers(text);

    setLoading(false);

    if (!importResult.success) {
      setError(importResult.error);
      return;
    }

    setResult(importResult.data);
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
    );
  }

  return (
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
          Import thành viên từ CSV
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          File cần có cột <strong>Họ và lót</strong>, <strong>Tên</strong> (hoặc{" "}
          <strong>Họ tên</strong>) và <strong>Mã hộ</strong>. Mã tín hữu tự
          sinh khi import.
        </p>

        <div className="mt-4 space-y-4">
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            Tải file mẫu
          </Button>

          <div className="space-y-2">
            <Label htmlFor="import-csv-file">Chọn file CSV</Label>
            <input
              ref={fileRef}
              id="import-csv-file"
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
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
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {result ? "Đóng" : "Hủy"}
          </Button>
          {!result && (
            <Button type="button" onClick={handleImport} disabled={loading}>
              {loading ? "Đang import..." : "Import"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
