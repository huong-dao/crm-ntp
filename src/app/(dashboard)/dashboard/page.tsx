import Link from "next/link";
import {
  getDashboardStats,
  getRecentVisitRequests,
} from "@/actions/dashboard-actions";
import { DashboardRecentVisitsTable } from "@/components/dashboard/dashboard-recent-visits-table";
import { Button } from "@/components/ui/button";

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

export default async function DashboardPage() {
  const [stats, recentVisits] = await Promise.all([
    getDashboardStats(),
    getRecentVisitRequests(5),
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Đơn thăm viếng lên lịch
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              5 đơn lên lịch sắp tới theo ngày thăm viếng
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/visit-requests?status=scheduled">Xem tất cả</Link>
          </Button>
        </div>
        <div className="mt-4">
          <DashboardRecentVisitsTable visits={recentVisits} />
        </div>
      </div>
    </div>
  );
}
