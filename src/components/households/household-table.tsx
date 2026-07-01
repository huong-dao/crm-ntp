import Link from "next/link";
import type { HouseholdListItem } from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";

function buildPageUrl(
  search: string | undefined,
  page: number
): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/households?${query}` : "/households";
}

export function HouseholdTable({
  households,
  total,
  page,
  pageSize,
  totalPages,
  search,
}: {
  households: HouseholdListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search?: string;
}) {
  if (households.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không tìm thấy hộ gia đình.</p>
      </div>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-6 space-y-4">
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Mã hộ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Chủ hộ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số thành viên
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {households.map((household, index) => (
              <tr key={household.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/households/${household.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {household.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {household.headName ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {household.memberCount}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                    <Link href={`/households/${household.id}`}>Chi tiết</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {households.map((household) => (
          <MobileDataCard
            key={household.id}
            actions={
              <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                <Link href={`/households/${household.id}`}>Chi tiết</Link>
              </Button>
            }
          >
            <Link
              href={`/households/${household.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {household.code}
            </Link>
            <div className="mt-2">
              <MobileDataRow label="Chủ hộ">
                {household.headName ?? "—"}
              </MobileDataRow>
              <MobileDataRow label="Số thành viên">
                {household.memberCount}
              </MobileDataRow>
            </div>
          </MobileDataCard>
        ))}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        getPageHref={(p) => buildPageUrl(search, p)}
        summary={
          <>
            Hiển thị {start}–{end} / {total} hộ
          </>
        }
      />
    </div>
  );
}
