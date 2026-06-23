import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAssignableMemberOptions,
  getVisitTeamById,
} from "@/actions/visit-team-actions";
import { AssignMembersForm } from "@/components/visit-teams/assign-members-form";
import { DeleteVisitTeamButton } from "@/components/visit-teams/delete-visit-team-button";
import { VisitTeamMembersTable } from "@/components/visit-teams/visit-team-members-table";
import { Button } from "@/components/ui/button";

export default async function VisitTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, assignableMembers] = await Promise.all([
    getVisitTeamById(id),
    getAssignableMemberOptions(id),
  ]);

  if (!team) {
    notFound();
  }

  const canDelete =
    team.memberCount === 0 && team.visitRequestCount === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tổ thăm viếng: {team.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Khu vực phụ trách và thành viên trong tổ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/visit-teams">← Danh sách tổ</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/visit-teams/${team.id}/edit`}>Sửa tổ</Link>
          </Button>
          {canDelete && (
            <DeleteVisitTeamButton teamId={team.id} teamCode={team.code} />
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Mã tổ</p>
          <p className="mt-1 text-lg font-semibold text-[#1e3a5f]">
            {team.code}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Khu vực phụ trách</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {team.area}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Trưởng tổ</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {team.leaderName ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Số hộ / thành viên</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {team.householdCount} hộ · {team.memberCount} thành viên
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">
            Thành viên trong tổ
          </h2>
          <div className="mt-4">
            <VisitTeamMembersTable members={team.members} />
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Gán thành viên
          </h2>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <AssignMembersForm
              teamId={team.id}
              memberOptions={assignableMembers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
