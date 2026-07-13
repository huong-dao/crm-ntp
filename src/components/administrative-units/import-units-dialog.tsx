"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  importAdministrativeUnitsFromCsvContent,
  importAdministrativeUnitsFromDefaultCsv,
  type ImportAdministrativeUnitsResult,
} from "@/actions/administrative-unit-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, ImportIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";

const ACCEPTED_EXTENSIONS = [".csv"];

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ImportAdministrativeUnitsDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportAdministrativeUnitsResult | null>(
    null
  );

  function handleClose() {
    if (importing) return;
    setOpen(false);
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImportDefault() {
    setError("");
    setResult(null);
    setImporting(true);

    const response = await importAdministrativeUnitsFromDefaultCsv();
    setImporting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }

    setResult(response.data);
    router.refresh();
  }

  async function handleImportFile() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chọn file CSV trước khi import");
      return;
    }
    if (!isAcceptedFile(file)) {
      setError("Chỉ hỗ trợ file CSV");
      return;
    }

    setError("");
    setResult(null);
    setImporting(true);

    try {
      const content = await file.text();
      const response = await importAdministrativeUnitsFromCsvContent(content);
      setImporting(false);

      if (!response.success) {
        setError(response.error);
        return;
      }

      setResult(response.data);
      router.refresh();
    } catch {
      setImporting(false);
      setError("Không thể đọc file CSV");
    }
  }

  return (
    <>
      <Button type="button" icon={ImportIcon} onClick={() => setOpen(true)}>
        Import dữ liệu
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Import địa chỉ hành chính
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Import danh mục tỉnh/thành, quận/huyện, phường/xã từ file CSV chuẩn
              (7 cột). Dữ liệu cũ sẽ được thay thế hoàn toàn.
            </p>

            <div className="mt-4 space-y-4">
              <Button
                type="button"
                variant="outline"
                disabled={importing}
                onClick={handleImportDefault}
              >
                {importing ? "Đang import..." : "Import file mặc định trong docs/csv"}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="administrative-unit-file">Hoặc chọn file CSV</Label>
                <input
                  ref={fileRef}
                  id="administrative-unit-file"
                  type="file"
                  accept=".csv"
                  className="block w-full text-sm text-gray-600"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {result && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Import thành công: {result.provinceCount} tỉnh/thành,{" "}
                {result.districtCount} quận/huyện, {result.wardCount} phường/xã.
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                icon={CancelIcon}
                disabled={importing}
                onClick={handleClose}
              >
                Đóng
              </Button>
              <Button
                type="button"
                icon={ImportIcon}
                disabled={importing}
                onClick={handleImportFile}
              >
                {importing ? "Đang import..." : "Import file đã chọn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
