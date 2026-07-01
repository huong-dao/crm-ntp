import Link from "next/link";
import type { VisitTeamListItem } from "@/actions/visit-team-actions";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { EditIcon, ViewIcon } from "@/lib/button-icons";
import { MobileDataCard, MobileDataRow } from "@/components/ui/mobile-data-card";

function buildPageUrl(search: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/visit-teams?${query}` : "/visit-teams";
}

export function VisitTeamTable({
  teams,
  total,
  page,
  pageSize,
  totalPages,
  search,
}: {
  teams: VisitTeamListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search?: string;
}) {
  if (teams.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Không tìm thấy tổ thăm viếng.</p>
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
                Mã tổ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Trưởng tổ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Khu vực
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Số hộ
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
            {teams.map((team, index) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{start + index}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/visit-teams/${team.id}`}
                    className="hover:text-[#1e3a5f] hover:underline"
                  >
                    {team.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {team.leaderName ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{team.area}</td>
                <td className="px-4 py-3 text-gray-600">{team.householdCount}</td>
                <td className="px-4 py-3 text-gray-600">{team.memberCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                      <Link href={`/visit-teams/${team.id}`}>Chi tiết</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild icon={EditIcon}>
                      <Link href={`/visit-teams/${team.id}/edit`}>Sửa</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {teams.map((team) => (
          <MobileDataCard
            key={team.id}
            actions={
              <>
                <Button variant="outline" size="sm" asChild icon={ViewIcon}>
                  <Link href={`/visit-teams/${team.id}`}>Chi tiết</Link>
                </Button>
                <Button variant="outline" size="sm" asChild icon={EditIcon}>
                  <Link href={`/visit-teams/${team.id}/edit`}>Sửa</Link>
                </Button>
              </>
            }
          >
            <Link
              href={`/visit-teams/${team.id}`}
              className="font-semibold text-[#1e3a5f] hover:underline"
            >
              {team.code}
            </Link>
            <div className="mt-2">
              <MobileDataRow label="Trưởng tổ">
                {team.leaderName ?? "—"}
              </MobileDataRow>
              <MobileDataRow label="Khu vực">{team.area}</MobileDataRow>
              <MobileDataRow label="Số hộ">{team.householdCount}</MobileDataRow>
              <MobileDataRow label="Số thành viên">
                {team.memberCount}
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
            Hiển thị {start}–{end} / {total} tổ
          </>
        }
      />
    </div>
  );
}
