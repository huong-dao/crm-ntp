import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLeaderMemberOptions,
  getVisitTeamById,
} from "@/actions/visit-team-actions";
import { DeleteVisitTeamButton } from "@/components/visit-teams/delete-visit-team-button";
import { VisitTeamForm } from "@/components/visit-teams/visit-team-form";
import { Button } from "@/components/ui/button";
import { BackIcon, ViewIcon } from "@/lib/button-icons";

export default async function EditVisitTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, leaderOptions] = await Promise.all([
    getVisitTeamById(id),
    getLeaderMemberOptions(),
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
            Sửa tổ: {team.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">Cập nhật khu vực và trưởng tổ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild icon={ViewIcon}>
            <Link href={`/visit-teams/${team.id}`}>Chi tiết tổ</Link>
          </Button>
          <Button variant="outline" asChild icon={BackIcon}>
            <Link href="/visit-teams">Danh sách tổ</Link>
          </Button>
          {canDelete && (
            <DeleteVisitTeamButton teamId={team.id} teamCode={team.code} />
          )}
        </div>
      </div>

      <VisitTeamForm
        mode="edit"
        team={{
          id: team.id,
          code: team.code,
          area: team.area,
          leaderMemberId: team.leaderMemberId,
        }}
        leaderOptions={leaderOptions}
      />
    </div>
  );
}
