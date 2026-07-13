import { notFound } from "next/navigation";
import { getVisitRequestMembersForPrint } from "@/actions/visit-request-actions";
import { VisitRequestMembersPrintView } from "@/components/visit-requests/visit-request-members-print-view";

export default async function VisitRequestMembersPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getVisitRequestMembersForPrint(id);

  if (!data) {
    notFound();
  }

  return <VisitRequestMembersPrintView data={data} requestId={id} />;
}
