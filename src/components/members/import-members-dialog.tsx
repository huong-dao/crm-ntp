"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  getMemberImportTemplate,
  importMembersFile,
  type ImportMembersResult,
} from "@/actions/member-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { downloadBase64File, readFileAsBase64 } from "@/lib/download-base64";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ImportMembersDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportMembersResult | null>(null);

  async function downloadTemplate() {
    setTemplateLoading(true);
    setError("");

    const templateResult = await getMemberImportTemplate();
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
    setLoading(true);
    setResult(null);

    try {
      const base64 = await readFileAsBase64(file);
      const importResult = await importMembersFile(base64, file.name);

      if (!importResult.success) {
        setError(importResult.error);
        return;
      }

      setResult(importResult.data);
      router.refresh();
    } catch {
      setError("Không đọc được file — thử lưu lại bằng Excel (.xlsx)");
    } finally {
      setLoading(false);
    }
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
        Import Excel
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
          Import thành viên từ Excel
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Dùng file Excel (.xlsx) với đầy đủ cột như file mẫu. Bắt buộc:{" "}
          <strong>Họ và lót</strong>, <strong>Tên</strong>, <strong>Mã hộ</strong>.
          Hộ chưa có sẽ được <strong>tự tạo</strong> theo mã hộ trong file.
          Mã tín hữu giữ nguyên nếu có cột Mã tín hữu, không thì tự sinh.
        </p>

        <div className="mt-4 space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            disabled={templateLoading}
          >
            {templateLoading ? "Đang tạo file mẫu..." : "Tải file mẫu Excel"}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="import-excel-file">Chọn file Excel</Label>
            <input
              ref={fileRef}
              id="import-excel-file"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
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
