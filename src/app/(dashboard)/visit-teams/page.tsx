import { Suspense } from "react";
import { getVisitTeams } from "@/actions/visit-team-actions";
import { getVisitTeamImportTemplate } from "@/actions/visit-team-import-actions";
import { ExportVisitTeamsButton } from "@/components/visit-teams/export-visit-teams-button";
import { ImportVisitTeamsDialog } from "@/components/visit-teams/import-visit-teams-dialog";
import { DownloadImportTemplateButton } from "@/components/shared/download-import-template-button";
import { VisitTeamTable } from "@/components/visit-teams/visit-team-table";
import { Button } from "@/components/ui/button";
import { AddIcon, CancelIcon, SearchIcon } from "@/lib/button-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/lib/member-list";

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function VisitTeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = pickParam(params, "search");
  const pageRaw = pickParam(params, "page");
  const parsedPage = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const result = await getVisitTeams({
    search,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Tổ thăm viếng</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Suspense fallback={null}>
            <ExportVisitTeamsButton />
          </Suspense>
          <DownloadImportTemplateButton fetchTemplate={getVisitTeamImportTemplate} />
          <ImportVisitTeamsDialog />
          <Button asChild icon={AddIcon}>
            <Link href="/visit-teams/new">Thêm tổ</Link>
          </Button>
        </div>
      </div>

      <form
        method="get"
        className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="visit-team-search">Tìm kiếm</Label>
            <Input
              id="visit-team-search"
              name="search"
              placeholder="Mã tổ, khu vực..."
              defaultValue={search ?? ""}
            />
          </div>
          <Button type="submit" icon={SearchIcon}>Tìm</Button>
          {search && (
            <Button type="button" variant="outline" asChild icon={CancelIcon}>
              <a href="/visit-teams">Xóa bộ lọc</a>
            </Button>
          )}
        </div>
      </form>

      <VisitTeamTable
        teams={result.teams}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={search}
      />
    </div>
  );
}
