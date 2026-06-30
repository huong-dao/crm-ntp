import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVisitRequestById,
  getVisitRequestFormContext,
} from "@/actions/visit-request-actions";
import { VisitRequestForm } from "@/components/visit-requests/visit-request-form";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function EditVisitRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, context] = await Promise.all([
    getVisitRequestById(id),
    getVisitRequestFormContext(),
  ]);

  if (!request) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sửa đơn thăm viếng: {request.code}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Cập nhật thông tin đơn thăm viếng
          </p>
        </div>
        <Button variant="outline" asChild icon={BackIcon}>
          <Link href={`/visit-requests/${id}`}>Chi tiết đơn</Link>
        </Button>
      </div>

      <VisitRequestForm mode="edit" context={context} request={request} />
    </div>
  );
}
