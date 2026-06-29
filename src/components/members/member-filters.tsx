"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberFilterOptions } from "@/actions/member-actions";
import {
  MEMBER_STATUSES,
  STATUS_LABELS,
  type MemberFiltersInput,
} from "@/lib/member-list";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

type FilterValues = Pick<
  MemberFiltersInput,
  "search" | "status" | "visitTeamId" | "department"
>;

export function MemberFilters({
  options,
  values,
}: {
  options: MemberFilterOptions;
  values: FilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    pushParams({
      search: (form.get("search") as string) || undefined,
      status: (form.get("status") as string) || undefined,
      visitTeamId: (form.get("visitTeamId") as string) || undefined,
      department: (form.get("department") as string) || undefined,
    });
  }

  function handleReset() {
    router.push(pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="member-search">Tìm kiếm</Label>
          <Input
            id="member-search"
            name="search"
            placeholder="Họ tên, mã tín hữu, mã hộ..."
            defaultValue={values.search ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-status">Tình trạng</Label>
          <select
            id="member-status"
            name="status"
            className={selectClass}
            defaultValue={values.status ?? ""}
          >
            <option value="">Tất cả</option>
            {MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-visit-team">Tổ thăm viếng</Label>
          <select
            id="member-visit-team"
            name="visitTeamId"
            className={selectClass}
            defaultValue={values.visitTeamId ?? ""}
          >
            <option value="">Tất cả</option>
            {options.visitTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.code} — {team.area}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-department">Ban ngành</Label>
          <select
            id="member-department"
            name="department"
            className={selectClass}
            defaultValue={values.department ?? ""}
          >
            <option value="">Tất cả</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">Lọc</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Xóa bộ lọc
        </Button>
      </div>
    </form>
  );
}

export function AddMemberLink() {
  return (
    <Button asChild>
      <Link href="/members/new">+ Thêm thành viên</Link>
    </Button>
  );
}
