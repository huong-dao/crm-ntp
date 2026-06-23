"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  updateVisitRequestStaff,
  type VisitRequestStaffOption,
} from "@/actions/visit-request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matchStaffMemberIds } from "@/lib/visit-request-list";

const multiSelectClass =
  "flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

export function VisitRequestStaffForm({
  requestId,
  staffCodes,
  staffMembers,
}: {
  requestId: string;
  staffCodes: string | null;
  staffMembers: VisitRequestStaffOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedIds = matchStaffMemberIds(staffCodes, staffMembers);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const staffMemberIds = form.getAll("staffMemberIds") as string[];
    const staffCodesRaw = (form.get("staffCodes") as string).trim();

    const result = await updateVisitRequestStaff(requestId, {
      staffMemberIds:
        staffMemberIds.length > 0 ? staffMemberIds : undefined,
      staffCodes: staffCodesRaw.length > 0 ? staffCodesRaw : null,
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
        <Label htmlFor="staffMemberIds">Chọn nhân sự</Label>
        <select
          id="staffMemberIds"
          name="staffMemberIds"
          multiple
          className={multiSelectClass}
          defaultValue={selectedIds}
        >
          {staffMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.code} — {member.fullName}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Giữ Ctrl để chọn nhiều thành viên.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staffCodes">Hoặc nhập mã thủ công</Label>
        <Input
          id="staffCodes"
          name="staffCodes"
          defaultValue={staffCodes ?? ""}
          placeholder="vd: 00001, 00002"
          maxLength={500}
        />
        <p className="text-xs text-gray-500">
          Nếu chọn từ danh sách, mã sẽ được lưu tự động.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu nhân sự"}
      </Button>
    </form>
  );
}
