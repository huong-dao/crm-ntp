import Link from "next/link";
import type { VisitTeamSuccessStat } from "@/actions/dashboard-actions";
import {
  MobileDataCard,
  MobileDataRow,
} from "@/components/ui/mobile-data-card";

function formatRate(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  const percent = Math.round((numerator / denominator) * 100);
  return `${numerator} / ${denominator} (${percent}%)`;
}

export function DashboardTeamVisitStatsTable({
  stats,
}: {
  stats: VisitTeamSuccessStat[];
}) {
  if (stats.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Chưa có tổ thăm viếng.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Mã tổ</th>
              <th className="px-4 py-3 font-medium">Khu vực</th>
              <th className="px-4 py-3 font-medium">
                Đơn hoàn thành / Tổng hộ
              </th>
              <th className="px-4 py-3 font-medium">
                Hộ đã thăm / Tổng hộ
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/visit-teams/${row.id}`}
                    className="font-medium text-[#1e3a5f] hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{row.area}</td>
                <td className="px-4 py-3 text-gray-900">
                  {formatRate(row.completedVisitCount, row.totalHouseholds)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {formatRate(row.visitedHouseholdCount, row.totalHouseholds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {stats.map((row) => (
          <MobileDataCard key={row.id}>
            <Link
              href={`/visit-teams/${row.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {row.code}
            </Link>
            <p className="mt-1 text-sm text-gray-600">{row.area}</p>
            <div className="mt-2">
              <MobileDataRow label="Đơn hoàn thành / Tổng hộ">
                {formatRate(row.completedVisitCount, row.totalHouseholds)}
              </MobileDataRow>
              <MobileDataRow label="Hộ đã thăm / Tổng hộ">
                {formatRate(row.visitedHouseholdCount, row.totalHouseholds)}
              </MobileDataRow>
            </div>
          </MobileDataCard>
        ))}
      </div>
    </>
  );
}
