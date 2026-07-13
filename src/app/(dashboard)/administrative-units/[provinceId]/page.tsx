import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvinceById } from "@/actions/administrative-unit-actions";
import { Button } from "@/components/ui/button";
import { BackIcon } from "@/lib/button-icons";

export default async function ProvinceDetailPage({
  params,
}: {
  params: Promise<{ provinceId: string }>;
}) {
  const { provinceId } = await params;
  const province = await getProvinceById(provinceId);

  if (!province) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild icon={BackIcon}>
          <Link href="/administrative-units">Quay lại</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{province.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Mã {province.code} · {province.districts.length} quận/huyện ·{" "}
            {province.districts.reduce(
              (sum, district) => sum + district.wardCount,
              0
            )}{" "}
            phường/xã
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {province.districts.map((district) => (
          <section
            key={district.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900">
              {district.name}
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Mã {district.code} · {district.wardCount} phường/xã)
              </span>
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {district.wards.map((ward) => (
                <li
                  key={ward.id}
                  className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <span className="font-medium">{ward.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {ward.level} · {ward.code}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
