"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  splitHousehold,
  type HouseholdMemberItem,
} from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function SplitHouseholdForm({
  householdId,
  householdCode,
  members,
}: {
  householdId: string;
  householdCode: string;
  members: HouseholdMemberItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newHeadMemberId, setNewHeadMemberId] = useState("");

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.id)),
    [members, selectedIds]
  );

  const headOptions = useMemo(
    () =>
      selectedMembers.map((member) => ({
        value: member.id,
        label: `${member.code} — ${member.fullName}`,
        searchText: `${member.code} ${member.fullName}`,
      })),
    [selectedMembers]
  );

  function toggleMember(memberId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = checked
        ? [...prev, memberId]
        : prev.filter((id) => id !== memberId);
      if (!next.includes(newHeadMemberId)) {
        setNewHeadMemberId("");
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await splitHousehold(selectedIds, newHeadMemberId);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/households/${result.data.id}`);
    router.refresh();
  }

  const canSubmit =
    selectedIds.length > 0 &&
    selectedIds.length < members.length &&
    Boolean(newHeadMemberId);

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">
          Chọn thành viên tách từ hộ <strong>{householdCode}</strong> sang hộ mới.
          Phải để lại ít nhất một thành viên trong hộ cũ.
        </p>

        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(member.id)}
                onChange={(e) => toggleMember(member.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-900">
                {member.code} — {member.fullName}
                {member.isHead ? " (Chủ hộ)" : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-2">
        <Label htmlFor="newHeadMemberId">Chủ hộ hộ mới *</Label>
        <SearchableSelect
          id="newHeadMemberId"
          options={headOptions}
          value={newHeadMemberId}
          onChange={setNewHeadMemberId}
          placeholder="— Chọn chủ hộ mới —"
          searchPlaceholder="Tìm trong danh sách đã chọn..."
          emptyMessage="Chọn thành viên trước"
          disabled={selectedMembers.length === 0}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={loading || !canSubmit}
          icon={loading ? undefined : SaveIcon}
        >
          {loading ? "Đang tách hộ..." : "Tách hộ"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href={`/households/${householdId}`}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
