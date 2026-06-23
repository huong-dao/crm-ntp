import Link from "next/link";
import { getLeaderMemberOptions } from "@/actions/visit-team-actions";
import { VisitTeamForm } from "@/components/visit-teams/visit-team-form";
import { Button } from "@/components/ui/button";

export default async function NewVisitTeamPage() {
  const leaderOptions = await getLeaderMemberOptions();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tổ thăm viếng</h1>
          <p className="mt-1 text-sm text-gray-600">
            Mã tổ tự động sinh — nhập khu vực phụ trách
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/visit-teams">← Danh sách tổ</Link>
        </Button>
      </div>

      <VisitTeamForm mode="create" leaderOptions={leaderOptions} />
    </div>
  );
}
