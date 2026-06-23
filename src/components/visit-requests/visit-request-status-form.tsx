"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VisitRequestStatus } from "@prisma/client";
import { updateVisitStatus } from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  VISIT_REQUEST_STATUS_LABELS,
  visitRequestStatusBadgeClass,
} from "@/lib/visit-request-list";
import { formatDateForInput } from "@/lib/validations/visit-request";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

const STATUS_OPTIONS: VisitRequestStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
];

export function VisitRequestStatusForm({
  requestId,
  currentStatus,
  currentActualDate,
}: {
  requestId: string;
  currentStatus: VisitRequestStatus;
  currentActualDate: Date | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<VisitRequestStatus>(currentStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const needsActualDate = status === "completed";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const actualDateValue = (form.get("actualDate") as string) || null;

    const result = await updateVisitStatus(requestId, {
      status,
      actualDate: actualDateValue,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Tình trạng</Label>
        <select
          id="status"
          name="status"
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as VisitRequestStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIT_REQUEST_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            visitRequestStatusBadgeClass(currentStatus)
          )}
        >
          Hiện tại: {VISIT_REQUEST_STATUS_LABELS[currentStatus]}
        </span>
      </div>

      {needsActualDate && (
        <div className="space-y-2">
          <Label htmlFor="actualDate">Ngày thăm thực tế *</Label>
          <Input
            id="actualDate"
            name="actualDate"
            type="date"
            required
            defaultValue={formatDateForInput(currentActualDate)}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : "Cập nhật tình trạng"}
      </Button>
    </form>
  );
}
