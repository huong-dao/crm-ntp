import { notFound } from "next/navigation";
import { getVisitRequestForPrint } from "@/actions/visit-request-actions";
import { VisitRequestPrintView } from "@/components/visit-requests/visit-request-print-view";
import { getAppBaseUrl } from "@/lib/app-url";
import { generateQrDataUrl } from "@/lib/qrcode";

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

  const baseUrl = await getAppBaseUrl();
  const editUrl = `${baseUrl}/visit-requests/${id}/edit`;
  const qrDataUrl = await generateQrDataUrl(editUrl);

  return (
    <VisitRequestPrintView request={request} qrDataUrl={qrDataUrl} editUrl={editUrl} />
  );
}
