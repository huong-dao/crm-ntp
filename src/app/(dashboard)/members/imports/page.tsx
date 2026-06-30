import Link from "next/link";
import { getMemberImportLogs } from "@/actions/member-import-actions";
import { MemberImportLogsTable } from "@/components/members/member-import-logs-table";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

type SearchParams = Record<string, string | string[] | undefined>;

function pickPage(params: SearchParams): number {
  const raw = params.page;
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  const parsed = value ? parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function MemberImportLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = pickPage(params);
  const result = await getMemberImportLogs(page);

  if (!result.success) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {result.error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử import thành viên</h1>
          <p className="mt-1 text-sm text-gray-600">
            Xem kết quả từng lần import, dòng thành công và dòng lỗi
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href="/members">Danh sách thành viên</Link>
        </Button>
      </div>

      <div className="mt-6">
        <MemberImportLogsTable
          logs={result.data.logs}
          page={result.data.page}
          totalPages={result.data.totalPages}
        />
      </div>
    </div>
  );
}
