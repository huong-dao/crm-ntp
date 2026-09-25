import Link from "next/link";
import {
  getCalendarVisitRequests,
  getDashboardStats,
  getVisitTeamSuccessStats,
} from "@/actions/dashboard-actions";
import { DashboardTeamVisitStatsTable } from "@/components/dashboard/dashboard-team-visit-stats-table";
import { VisitCalendar } from "@/components/dashboard/visit-calendar";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

const statCards = [
  {
    key: "totalMembers",
    label: "Thành viên (hoạt động)",
    href: "/members?status=active",
  },
  {
    key: "totalHouseholds",
    label: "Hộ gia đình",
    href: "/households",
  },
  {
    key: "scheduledVisitsThisWeek",
    label: "Đơn lên lịch (7 ngày tới)",
    href: "/visit-requests?status=scheduled",
  },
  {
    key: "totalTeams",
    label: "Tổ thăm viếng",
    href: "/visit-teams",
  },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const now = new Date();
  const yearRaw = pickParam(params, "year");
  const monthRaw = pickParam(params, "month");
  const year = yearRaw ? parseInt(yearRaw, 10) : now.getFullYear();
  const month = monthRaw ? parseInt(monthRaw, 10) : now.getMonth() + 1;
  const safeYear = Number.isFinite(year) ? year : now.getFullYear();
  const safeMonth =
    Number.isFinite(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1;

  const [stats, teamVisitStats, calendarEvents] = await Promise.all([
    getDashboardStats(),
    getVisitTeamSuccessStats(),
    getCalendarVisitRequests(safeYear, safeMonth),
  ]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tổng quan hệ thống quản lý thành viên và thăm viếng
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[#1e3a5f]/30 hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">
              {stats[card.key]}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Lịch thăm viếng
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Xem đơn thăm viếng theo ngày trong tháng
          </p>
        </div>
        <div className="mt-4">
          <VisitCalendar
            year={safeYear}
            month={safeMonth}
            events={calendarEvents}
          />
        </div>
      </div>

      <div className="mt-8">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Tỷ lệ thăm viếng theo tổ
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Số đơn hoàn thành so với tổng đơn của từng tổ
          </p>
        </div>
        <div className="mt-4">
          <DashboardTeamVisitStatsTable stats={teamVisitStats} />
        </div>
      </div>
    </div>
  );
}
