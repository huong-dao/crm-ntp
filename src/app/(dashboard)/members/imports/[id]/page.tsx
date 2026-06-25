import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberImportLogById } from "@/actions/member-import-actions";
import { MemberImportLogDetailView } from "@/components/members/member-import-log-detail";
import { Button } from "@/components/ui/button";

export default async function MemberImportLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMemberImportLogById(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết import</h1>
          <p className="mt-1 text-sm text-gray-600">{result.data.fileName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/members/imports">← Lịch sử import</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/members">Danh sách thành viên</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <MemberImportLogDetailView log={result.data} />
      </div>
    </div>
  );
}
