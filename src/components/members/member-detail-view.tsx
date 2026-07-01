import Link from "next/link";
import type { MemberDetail } from "@/actions/member-actions";
import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { Button } from "@/components/ui/button";
import { BackIcon, EditIcon } from "@/lib/button-icons";
import { cn } from "@/lib/utils";
import {
  GENDER_LABELS,
  STATUS_LABELS,
  statusBadgeClass,
} from "@/lib/member-list";

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  const empty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

  return (
    <div className={className}>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-900">{empty ? "—" : value}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function yesNo(value: boolean) {
  return value ? "Có" : "Không";
}

function phoneLink(value: string | null) {
  if (!value?.trim()) return null;
  return (
    <a href={`tel:${value.trim()}`} className="text-[#1e3a5f] hover:underline">
      {value}
    </a>
  );
}

export function MemberDetailView({
  member,
  isAdmin,
}: {
  member: MemberDetail;
  isAdmin: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {member.fullName}
            </h1>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusBadgeClass(member.status)
              )}
            >
              {STATUS_LABELS[member.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Mã tín hữu:{" "}
            <span className="font-medium text-[#1e3a5f]">{member.code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild icon={BackIcon}>
            <Link href="/members">Danh sách</Link>
          </Button>
          <Button variant="outline" asChild icon={EditIcon}>
            <Link href={`/members/${member.id}/edit`}>Sửa</Link>
          </Button>
          {isAdmin && (
            <DeleteMemberButton
              memberId={member.id}
              memberCode={member.code}
              memberName={member.fullName}
              size="default"
            />
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Mã tín hữu</p>
          <p className="mt-1 text-lg font-semibold text-[#1e3a5f]">
            {member.code}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Mã hộ</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {member.household ? (
              <Link
                href={`/households/${member.household.id}`}
                className="text-[#1e3a5f] hover:underline"
              >
                {member.household.code}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổ phụ trách thăm viếng</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {member.visitTeam ? (
              <Link
                href={`/visit-teams/${member.visitTeam.id}`}
                className="text-[#1e3a5f] hover:underline"
              >
                {member.visitTeam.code}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Liên lạc chính</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {phoneLink(member.mobile1) ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <DetailSection title="Thông tin cơ bản">
          <DetailField label="Họ và lót" value={member.firstName} />
          <DetailField label="Tên" value={member.lastName} />
          <DetailField label="Giới tính" value={member.gender ? GENDER_LABELS[member.gender] : null} />
          <DetailField label="Năm sinh" value={member.birthYear} />
          <DetailField
            label="Tuổi"
            value={member.age != null ? `${member.age} tuổi` : null}
          />
          <DetailField label="Nghề nghiệp" value={member.occupation} />
        </DetailSection>

        <DetailSection title="Địa chỉ cũ">
          <DetailField label="Số nhà" value={member.houseNumber} />
          <DetailField label="Tên đường" value={member.street} />
          <DetailField label="Phường cũ" value={member.oldWard} />
          <DetailField label="Quận cũ" value={member.oldDistrict} />
          <DetailField label="Tỉnh cũ" value={member.oldProvince} />
          <DetailField
            label="Địa chỉ cũ đầy đủ"
            value={member.oldFullAddress}
            className="sm:col-span-2 lg:col-span-3"
          />
        </DetailSection>

        <DetailSection title="Địa chỉ mới">
          <DetailField label="Phường mới" value={member.newWard} />
          <DetailField label="Tỉnh mới" value={member.newProvince} />
          <DetailField
            label="Địa chỉ mới đầy đủ"
            value={member.newFullAddress}
            className="sm:col-span-2"
          />
        </DetailSection>

        <DetailSection title="Liên lạc">
          <DetailField label="Di động 1" value={phoneLink(member.mobile1)} />
          <DetailField label="Di động 2" value={phoneLink(member.mobile2)} />
          <DetailField label="ĐT bàn" value={phoneLink(member.landline)} />
        </DetailSection>

        <DetailSection title="Hộ gia đình">
          <DetailField
            label="Mã hộ"
            value={
              member.household ? (
                <Link
                  href={`/households/${member.household.id}`}
                  className="font-medium text-[#1e3a5f] hover:underline"
                >
                  {member.household.code}
                </Link>
              ) : null
            }
          />
          <DetailField label="Chủ hộ" value={yesNo(member.isHead)} />
          <DetailField label="Quan hệ" value={member.relationship} />
        </DetailSection>

        <DetailSection title="Tin lành">
          <DetailField label="Báp têm" value={yesNo(member.isBaptized)} />
          <DetailField
            label="Năm báp têm"
            value={member.isBaptized ? member.baptismYear : null}
          />
          <DetailField
            label="Ban ngành theo tuổi"
            value={
              member.ageDepartment ? (
                <Link
                  href={`/departments/${member.ageDepartment.id}`}
                  className="text-[#1e3a5f] hover:underline"
                >
                  {member.ageDepartment.name}
                </Link>
              ) : null
            }
          />
          <DetailField
            label="Ban ngành thực tế"
            value={
              member.actualDepartment ? (
                <Link
                  href={`/departments/${member.actualDepartment.id}`}
                  className="text-[#1e3a5f] hover:underline"
                >
                  {member.actualDepartment.name}
                </Link>
              ) : null
            }
          />
          <DetailField label="Ban chấp sự" value={member.boardServiceYear} />
          <DetailField
            label="Ban thăm viếng"
            value={member.visitDepartmentYear}
          />
        </DetailSection>

        <DetailSection title="Thăm viếng">
          <DetailField
            label="Tổ phụ trách thăm viếng"
            value={
              member.visitTeam ? (
                <Link
                  href={`/visit-teams/${member.visitTeam.id}`}
                  className="text-[#1e3a5f] hover:underline"
                >
                  {member.visitTeam.code}
                </Link>
              ) : null
            }
          />
          <DetailField
            label="Khu vực phụ trách"
            value={member.visitTeam?.area ?? null}
          />
        </DetailSection>

        {member.notes?.trim() && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Ghi chú</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
              {member.notes}
            </p>
          </section>
        )}

        <DetailSection title="Hệ thống">
          <DetailField label="Ngày tạo" value={formatDate(member.createdAt)} />
          <DetailField
            label="Cập nhật lần cuối"
            value={formatDate(member.updatedAt)}
          />
        </DetailSection>
      </div>
    </div>
  );
}
