import { notFound } from "next/navigation";
import { getVisitRequestForPrint } from "@/actions/visit-request-actions";
import { VisitRequestPrintView } from "@/components/visit-requests/visit-request-print-view";

export default async function VisitRequestPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getVisitRequestForPrint(id);

  if (!request) {
    notFound();
  }

  return <VisitRequestPrintView request={request} />;
}
