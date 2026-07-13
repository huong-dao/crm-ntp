import Link from "next/link";
import type { ProvinceListItem } from "@/actions/administrative-unit-actions";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";

function buildPageUrl(search: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/administrative-units?${query}` : "/administrative-units";
}

export function ProvinceTable({
  provinces,
  total,
  page,
  pageSize,
  totalPages,
  search,
}: {
  provinces: ProvinceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search?: string;
}) {
  if (provinces.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">
          {search
            ? "Không tìm thấy tỉnh/thành phố."
            : "Chưa có dữ liệu — hãy import từ file CSV."}
        </p>
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
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Tỉnh / Thành phố
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số quận/huyện
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số phường/xã
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {provinces.map((province, index) => (
              <tr key={province.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{province.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/administrative-units/${province.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {province.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{province.districtCount}</td>
                <td className="px-4 py-3 text-gray-600">{province.wardCount}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                    <Link href={`/administrative-units/${province.id}`}>
                      Chi tiết
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {provinces.map((province) => (
          <MobileDataCard
            key={province.id}
            actions={
              <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                <Link href={`/administrative-units/${province.id}`}>Chi tiết</Link>
              </Button>
            }
          >
            <Link
              href={`/administrative-units/${province.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {province.name}
            </Link>
            <div className="mt-2">
              <MobileDataRow label="Mã">{province.code}</MobileDataRow>
              <MobileDataRow label="Quận/huyện">{province.districtCount}</MobileDataRow>
              <MobileDataRow label="Phường/xã">{province.wardCount}</MobileDataRow>
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
            Hiển thị {start}–{end} / {total} tỉnh/thành
          </>
        }
      />
    </div>
  );
}
