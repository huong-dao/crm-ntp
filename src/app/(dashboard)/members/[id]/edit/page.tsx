import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMemberById,
  getMemberFormOptions,
} from "@/actions/member-actions";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, options] = await Promise.all([
    getMemberById(id),
    getMemberFormOptions(),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sửa thành viên: {member.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{member.fullName}</p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href={`/members/${member.id}`}>Chi tiết</Link>
        </Button>
      </div>

      <MemberForm mode="edit" member={member} options={options} />
    </div>
  );
}
