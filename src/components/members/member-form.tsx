"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createMember,
  updateMember,
  type MemberFormDefaults,
  type MemberFormOptions,
} from "@/actions/member-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildNewFullAddress,
  buildOldFullAddress,
  buildFullName,
} from "@/lib/member-format";
import {
  MEMBER_STATUSES,
  STATUS_LABELS,
} from "@/lib/member-list";
import { parseMemberFormData, CREATE_NEW_HOUSEHOLD, type MemberFormInput } from "@/lib/validations/member";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

const textareaClass =
  "flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-2"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

type AddressState = {
  houseNumber: string;
  street: string;
  oldWard: string;
  oldDistrict: string;
  oldProvince: string;
  newWard: string;
  newProvince: string;
};

function addressFromMember(member?: MemberFormDefaults): AddressState {
  if (!member) {
    return {
      houseNumber: "",
      street: "",
      oldWard: "",
      oldDistrict: "",
      oldProvince: "",
      newWard: "",
      newProvince: "",
    };
  }
  return {
    houseNumber: member.houseNumber ?? "",
    street: member.street ?? "",
    oldWard: member.oldWard ?? "",
    oldDistrict: member.oldDistrict ?? "",
    oldProvince: member.oldProvince ?? "",
    newWard: member.newWard ?? "",
    newProvince: member.newProvince ?? "",
  };
}

export function MemberForm({
  mode,
  options,
  member,
  defaultHouseholdId,
  forceCreateHousehold = false,
}: {
  mode: "create" | "edit";
  options: MemberFormOptions;
  member?: MemberFormDefaults;
  defaultHouseholdId?: string;
  /** Khi chưa có hộ nào — tự tạo hộ mới khi lưu */
  forceCreateHousehold?: boolean;
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && member;
  const createNewHousehold = !isEdit && forceCreateHousehold;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHead, setIsHead] = useState(
    member?.isHead ?? createNewHousehold
  );
  const [isBaptized, setIsBaptized] = useState(member?.isBaptized ?? false);
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [address, setAddress] = useState<AddressState>(addressFromMember(member));
  const [householdId, setHouseholdId] = useState(
    createNewHousehold
      ? CREATE_NEW_HOUSEHOLD
      : member?.householdId ?? defaultHouseholdId ?? ""
  );

  const isCreatingHousehold =
    !isEdit && (createNewHousehold || householdId === CREATE_NEW_HOUSEHOLD);

  const fullNamePreview = useMemo(
    () => (firstName || lastName ? buildFullName(firstName, lastName) : ""),
    [firstName, lastName]
  );

  const oldFullAddressPreview = useMemo(
    () => buildOldFullAddress(address) || "—",
    [address]
  );

  const newFullAddressPreview = useMemo(
    () => buildNewFullAddress(address) || "—",
    [address]
  );

  const cancelHref = isEdit ? `/members/${member.id}` : "/members";

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function handleHouseholdChange(value: string) {
    setHouseholdId(value);
    if (value === CREATE_NEW_HOUSEHOLD) {
      setIsHead(true);
    }
  }

  function handleIsHeadChange(checked: boolean) {
    if (isCreatingHousehold && !checked) {
      return;
    }
    setIsHead(checked);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const raw = parseMemberFormData(form) as MemberFormInput;

    const result = isEdit
      ? await updateMember(member.id, raw)
      : await createMember(raw);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/members/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <Section title="Thông tin cơ bản">
        <Field label="Mã tín hữu" className="space-y-2 sm:col-span-2">
          <Input
            readOnly
            value={isEdit ? member.code : "Tự động (00001)"}
            className="bg-gray-50"
          />
        </Field>
        <Field label="Tình trạng *">
          <select
            name="status"
            className={selectClass}
            defaultValue={member?.status ?? "active"}
          >
            {MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Họ và lót *">
          <Input
            name="firstName"
            required
            maxLength={100}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="Tên *">
          <Input
            name="lastName"
            required
            maxLength={50}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
        <Field label="Họ tên đầy đủ">
          <Input
            readOnly
            value={fullNamePreview || "—"}
            className="bg-gray-50"
          />
        </Field>
        <Field label="Giới tính">
          <select
            name="gender"
            className={selectClass}
            defaultValue={member?.gender ?? ""}
          >
            <option value="">— Chọn —</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </Field>
        <Field label="Năm sinh">
          <Input
            name="birthYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={member?.birthYear ?? ""}
          />
        </Field>
        <Field label="Nghề nghiệp">
          <Input
            name="occupation"
            maxLength={200}
            defaultValue={member?.occupation ?? ""}
          />
        </Field>
      </Section>

      <Section title="Địa chỉ cũ">
        <Field label="Số nhà">
          <Input
            name="houseNumber"
            maxLength={50}
            value={address.houseNumber}
            onChange={(e) => updateAddress("houseNumber", e.target.value)}
          />
        </Field>
        <Field label="Tên đường">
          <Input
            name="street"
            maxLength={200}
            value={address.street}
            onChange={(e) => updateAddress("street", e.target.value)}
          />
        </Field>
        <Field label="Phường cũ">
          <Input
            name="oldWard"
            maxLength={100}
            value={address.oldWard}
            onChange={(e) => updateAddress("oldWard", e.target.value)}
          />
        </Field>
        <Field label="Quận cũ">
          <Input
            name="oldDistrict"
            maxLength={100}
            value={address.oldDistrict}
            onChange={(e) => updateAddress("oldDistrict", e.target.value)}
          />
        </Field>
        <Field label="Tỉnh cũ">
          <Input
            name="oldProvince"
            maxLength={100}
            value={address.oldProvince}
            onChange={(e) => updateAddress("oldProvince", e.target.value)}
          />
        </Field>
        <Field label="Địa chỉ cũ đầy đủ" className="space-y-2 sm:col-span-2">
          <Input readOnly value={oldFullAddressPreview} className="bg-gray-50" />
        </Field>
      </Section>

      <Section title="Địa chỉ mới">
        <Field label="Phường mới">
          <Input
            name="newWard"
            maxLength={100}
            value={address.newWard}
            onChange={(e) => updateAddress("newWard", e.target.value)}
          />
        </Field>
        <Field label="Tỉnh mới">
          <Input
            name="newProvince"
            maxLength={100}
            value={address.newProvince}
            onChange={(e) => updateAddress("newProvince", e.target.value)}
          />
        </Field>
        <Field label="Địa chỉ mới đầy đủ" className="space-y-2 sm:col-span-2">
          <Input readOnly value={newFullAddressPreview} className="bg-gray-50" />
        </Field>
      </Section>

      <Section title="Liên lạc">
        <Field label="Di động 1">
          <Input name="mobile1" type="tel" defaultValue={member?.mobile1 ?? ""} />
        </Field>
        <Field label="Di động 2">
          <Input name="mobile2" type="tel" defaultValue={member?.mobile2 ?? ""} />
        </Field>
        <Field label="ĐT bàn">
          <Input name="landline" type="tel" defaultValue={member?.landline ?? ""} />
        </Field>
      </Section>

      <Section title="Hộ gia đình">
        {isCreatingHousehold ? (
          <>
            <input type="hidden" name="householdId" value={CREATE_NEW_HOUSEHOLD} />
            <input type="hidden" name="createNewHousehold" value="on" />
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm text-gray-600">
                {forceCreateHousehold
                  ? "Chưa có hộ gia đình nào — hệ thống sẽ tự tạo hộ mới khi lưu. Thành viên này là chủ hộ."
                  : "Hộ gia đình mới sẽ được tạo tự động khi lưu. Thành viên này là chủ hộ."}
              </p>
            </div>
          </>
        ) : (
          <Field label="Mã hộ *">
            <select
              name="householdId"
              className={selectClass}
              required
              value={householdId}
              onChange={(e) => handleHouseholdChange(e.target.value)}
            >
              <option value="" disabled>
                — Chọn mã hộ —
              </option>
              {!isEdit && (
                <option value={CREATE_NEW_HOUSEHOLD}>+ Tạo hộ mới</option>
              )}
              {options.households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.code}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Chủ hộ" className="space-y-2 flex items-end flex-col">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isHead"
              checked={isHead}
              onChange={(e) => handleIsHeadChange(e.target.checked)}
              disabled={isCreatingHousehold}
              className="h-4 w-4 rounded border-gray-300 disabled:opacity-60"
            />
            Là chủ hộ
          </label>
        </Field>
        <Field label="Quan hệ" className="space-y-2 sm:col-span-2">
          <Input
            name="relationship"
            maxLength={100}
            placeholder="vd: Vợ, Con,..."
            defaultValue={member?.relationship ?? ""}
          />
        </Field>
      </Section>

      <Section title="Tin lành">
        <Field label="Báp têm" className="space-y-2 flex items-end flex-col">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isBaptized"
              checked={isBaptized}
              onChange={(e) => setIsBaptized(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Đã báp têm
          </label>
        </Field>
        {isBaptized && (
          <Field label="Năm báp têm">
            <Input
              name="baptismYear"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              defaultValue={member?.baptismYear ?? ""}
            />
          </Field>
        )}
        <Field label="Ban ngành theo tuổi">
          <Input
            name="ageDepartment"
            maxLength={100}
            defaultValue={member?.ageDepartment ?? ""}
          />
        </Field>
        <Field label="Ban ngành thực tế">
          <Input
            name="actualDepartment"
            maxLength={100}
            defaultValue={member?.actualDepartment ?? ""}
          />
        </Field>
        <Field label="Ban chấp sự (ngày)">
          <Input
            name="boardServiceDate"
            type="date"
            defaultValue={member?.boardServiceDate ?? ""}
          />
        </Field>
        <Field label="Ban thăm viếng">
          <Input
            name="visitDepartment"
            maxLength={100}
            defaultValue={member?.visitDepartment ?? ""}
          />
        </Field>
      </Section>

      <Section title="Thăm viếng">
        <Field label="Mã tổ thăm viếng" className="space-y-2 sm:col-span-2">
          <select
            name="visitTeamId"
            className={selectClass}
            defaultValue={member?.visitTeamId ?? ""}
          >
            <option value="">— Không chọn —</option>
            {options.visitTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.code} — {team.area}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Ghi chú</h2>
        <div className="mt-4 space-y-2">
          <Label htmlFor="notes">Ghi chú</Label>
          <textarea
            id="notes"
            name="notes"
            className={textareaClass}
            rows={4}
            defaultValue={member?.notes ?? ""}
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Lưu thành viên"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
