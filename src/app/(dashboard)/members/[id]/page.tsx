import { notFound } from "next/navigation";
import { getMemberDetail } from "@/actions/member-actions";
import { MemberDetailView } from "@/components/members/member-detail-view";
import { auth } from "@/lib/auth";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, session] = await Promise.all([getMemberDetail(id), auth()]);

  if (!member) {
    notFound();
  }

  const isAdmin = session?.user?.role === "admin";

  return <MemberDetailView member={member} isAdmin={isAdmin} />;
}
