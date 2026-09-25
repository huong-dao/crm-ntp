"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MemberStatus } from "@prisma/client";
import {
  createMember,
  updateMember,
  type MemberFormDefaults,
  type MemberFormOptions,
} from "@/actions/member-actions";
import {
  getDefaultVisitTeamForHousehold,
} from "@/actions/visit-request-actions";
import {
  getHouseholdActiveMemberOptions,
  type HeadMemberOption,
} from "@/actions/household-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatAgeRange } from "@/lib/validations/department";
import { resolveDepartmentIdByAge } from "@/lib/department-age";
import {
  buildNewFullAddress,
  buildOldFullAddress,
  buildFullName,
} from "@/lib/member-format";
import {
  MEMBER_STATUSES,
  STATUS_LABELS,
} from "@/lib/member-list";
import {
  RELATIONSHIP_OPTIONS,
} from "@/lib/relationship-options";
import { parseMemberFormData, CREATE_NEW_HOUSEHOLD, type MemberFormInput } from "@/lib/validations/member";
import { AddressFields } from "@/components/administrative-units/address-fields";
import { CancelIcon, SaveIcon } from "@/lib/button-icons";

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
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{children}</div>
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

function formatHouseholdOptionLabel(household: {
  code: string;
  headName: string | null;
}): string {
  if (household.headName) {
    return `${household.code} — ${household.headName}`;
  }
  return household.code;
}

function relationshipInitialState(relationship?: string | null) {
  const value = relationship?.trim() ?? "";
  if (!value) {
    return { select: "", custom: "" };
  }
  if (
    (RELATIONSHIP_OPTIONS as readonly string[]).includes(value) &&
    value !== "Khác"
  ) {
    return { select: value, custom: "" };
  }
  return { select: "Khác", custom: value };
}

export function MemberForm({
  mode,
  options,
  member,
  defaultHouseholdId,
  forceCreateHousehold = false,
  hasAdministrativeData = false,
}: {
  mode: "create" | "edit";
  options: MemberFormOptions;
  member?: MemberFormDefaults;
  defaultHouseholdId?: string;
  /** Khi chưa có hộ nào — tự tạo hộ mới khi lưu */
  forceCreateHousehold?: boolean;
  hasAdministrativeData?: boolean;
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && member;
  const createNewHousehold = !isEdit && forceCreateHousehold;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<MemberStatus>(member?.status ?? "active");
  const [isHead, setIsHead] = useState(
    member?.isHead ?? createNewHousehold
  );
  const [isBaptized, setIsBaptized] = useState(member?.isBaptized ?? false);
  const [isTrusted, setIsTrusted] = useState(member?.isTrusted ?? false);
  const [isNtpPer, setIsNtpPer] = useState(member?.isNtpPer ?? false);
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [address, setAddress] = useState<AddressState>(addressFromMember(member));
  const [householdId, setHouseholdId] = useState(
    createNewHousehold
      ? CREATE_NEW_HOUSEHOLD
      : member?.householdId ?? defaultHouseholdId ?? ""
  );
  const [ageDepartmentId, setAgeDepartmentId] = useState(
    member?.ageDepartmentId ?? ""
  );
  const [actualDepartmentId, setActualDepartmentId] = useState(
    member?.actualDepartmentId ?? ""
  );
  const initialRelationship = relationshipInitialState(member?.relationship);
  const [birthYear, setBirthYear] = useState(
    member?.birthYear != null ? String(member.birthYear) : ""
  );
  const [relationshipSelect, setRelationshipSelect] = useState(
    initialRelationship.select
  );
  const [customRelationship, setCustomRelationship] = useState(
    initialRelationship.custom
  );
  const [visitTeamId, setVisitTeamId] = useState(member?.visitTeamId ?? "");

  const relationshipValue =
    relationshipSelect === "Khác" ? customRelationship : relationshipSelect;

  const isCreatingHousehold =
    !isEdit && (createNewHousehold || householdId === CREATE_NEW_HOUSEHOLD);

  const originalIsHead = member?.isHead ?? false;
  const showHeadTransferBox = Boolean(
    isEdit &&
      originalIsHead &&
      status !== "active" &&
      member?.householdId &&
      householdId === member.householdId
  );

  const [newHeadMemberId, setNewHeadMemberId] = useState("");
  const [householdActiveMembers, setHouseholdActiveMembers] = useState<
    HeadMemberOption[]
  >([]);

  useEffect(() => {
    if (!showHeadTransferBox || !isEdit) {
      setHouseholdActiveMembers([]);
      setNewHeadMemberId("");
      return;
    }
    let cancelled = false;
    void getHouseholdActiveMemberOptions(member.householdId, member.id).then(
      (options) => {
        if (!cancelled) setHouseholdActiveMembers(options);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeadTransferBox]);

  useEffect(() => {
    if (showHeadTransferBox && isHead) {
      setIsHead(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeadTransferBox]);

  const headTransferOptions = useMemo(
    () =>
      householdActiveMembers.map((option) => ({
        value: option.id,
        label: `${option.code} — ${option.fullName}`,
        searchText: `${option.code} ${option.fullName}`,
      })),
    [householdActiveMembers]
  );

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

  const departmentOptions = useMemo(
    () =>
      options.departments.map((department) => ({
        value: department.id,
        label: department.name,
        searchText: `${department.name} ${formatAgeRange(department.minAge, department.maxAge)}`,
      })),
    [options.departments]
  );

  const householdOptions = useMemo(() => {
    const items = options.households.map((household) => {
      const label = formatHouseholdOptionLabel(household);
      return {
        value: household.id,
        label,
        searchText: `${household.code} ${household.headName ?? ""}`,
      };
    });

    if (!isEdit) {
      return [
        {
          value: CREATE_NEW_HOUSEHOLD,
          label: "+ Tạo hộ mới",
          searchText: "tao ho moi tao hộ mới",
        },
        ...items,
      ];
    }

    return items;
  }, [options.households, isEdit]);

  const relationshipOptions = useMemo(
    () =>
      RELATIONSHIP_OPTIONS.map((option) => ({
        value: option,
        label: option,
        searchText: option,
      })),
    []
  );

  const cancelHref = isEdit ? `/members/${member.id}` : "/members";

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (isEdit || isHead || !defaultHouseholdId) return;
    if (householdId !== defaultHouseholdId) return;
    void getDefaultVisitTeamForHousehold(defaultHouseholdId).then((teamId) => {
      if (teamId) setVisitTeamId(teamId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHouseholdChange(value: string) {
    setHouseholdId(value);
    if (value === CREATE_NEW_HOUSEHOLD) {
      setIsHead(true);
      return;
    }
    if (!isHead) {
      void getDefaultVisitTeamForHousehold(value).then((teamId) => {
        if (teamId) setVisitTeamId(teamId);
      });
    }
  }

  function handleIsHeadChange(checked: boolean) {
    if (isCreatingHousehold && !checked) {
      return;
    }
    setIsHead(checked);
    if (
      !checked &&
      householdId &&
      householdId !== CREATE_NEW_HOUSEHOLD
    ) {
      void getDefaultVisitTeamForHousehold(householdId).then((teamId) => {
        if (teamId) setVisitTeamId(teamId);
      });
    }
  }

  function handleBirthYearChange(value: string) {
    setBirthYear(value);
    const year = parseInt(value, 10);
    if (Number.isFinite(year) && year >= 1900) {
      const resolved = resolveDepartmentIdByAge(year, options.departments);
      if (resolved) {
        setAgeDepartmentId(resolved);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      showHeadTransferBox &&
      headTransferOptions.length > 0 &&
      !newHeadMemberId
    ) {
      setError("Vui lòng chọn chủ hộ mới trước khi lưu");
      return;
    }

    setLoading(true);

    const form = new FormData(e.currentTarget);
    const raw = parseMemberFormData(form) as MemberFormInput;

    const result = isEdit
      ? await updateMember(
          member.id,
          raw,
          showHeadTransferBox ? newHeadMemberId || null : null
        )
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
        <Field label="Mã tín hữu">
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
            value={status}
            onChange={(e) => setStatus(e.target.value as MemberStatus)}
          >
            {MEMBER_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {STATUS_LABELS[statusOption]}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-1"></div>
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
            value={birthYear}
            onChange={(e) => handleBirthYearChange(e.target.value)}
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

      <Section title="Địa chỉ">
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

        <AddressFields
          values={address}
          onChange={updateAddress}
          hasAdministrativeData={hasAdministrativeData}
        />

        <Field label="Địa chỉ cũ đầy đủ" className="sm:col-span-3">
          <Input readOnly value={oldFullAddressPreview} className="bg-gray-50" />
        </Field>
        <Field label="Địa chỉ mới đầy đủ" className="sm:col-span-3">
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
      <Field label="Chủ hộ" className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isHead"
              checked={isHead}
              onChange={(e) => handleIsHeadChange(e.target.checked)}
              disabled={isCreatingHousehold || showHeadTransferBox}
              className="h-4 w-4 rounded border-gray-300 disabled:opacity-60"
            />
            Là chủ hộ
          </label>
          {showHeadTransferBox && (
            <p className="text-xs text-amber-700">
              Tình trạng khác &quot;Hoạt động&quot; — không thể tiếp tục là chủ hộ.
            </p>
          )}
        </Field>
        {showHeadTransferBox && (
          <Field label="Chọn chủ hộ mới *" className="sm:col-span-3">
            <SearchableSelect
              id="newHeadMemberId"
              name="newHeadMemberId"
              options={headTransferOptions}
              value={newHeadMemberId}
              onChange={setNewHeadMemberId}
              placeholder="— Chọn chủ hộ mới —"
              searchPlaceholder="Tìm theo mã hoặc tên..."
              emptyMessage="Không còn thành viên đang hoạt động khác trong hộ"
              required={headTransferOptions.length > 0}
            />
            <p className="mt-1 text-xs text-gray-500">
              Chỉ hiển thị thành viên đang &quot;Hoạt động&quot; trong cùng hộ.
              {headTransferOptions.length === 0 &&
                " Không còn ai phù hợp — hộ sẽ không có chủ hộ sau khi lưu."}
            </p>
          </Field>
        )}
        {isCreatingHousehold ? (
          <>
            <input type="hidden" name="householdId" value={CREATE_NEW_HOUSEHOLD} />
            <input type="hidden" name="createNewHousehold" value="on" />
            <input type="hidden" name="isHead" value="on" />
            <div>
              <p className="text-sm text-gray-600">
                {forceCreateHousehold
                  ? "Chưa có hộ gia đình nào — hệ thống sẽ tự tạo hộ mới khi lưu. Thành viên này là chủ hộ."
                  : "Hộ gia đình mới sẽ được tạo tự động khi lưu. Thành viên này là chủ hộ."}
              </p>
            </div>
          </>
        ) : (
          <Field label="Mã hộ *">
            <SearchableSelect
              id="householdId"
              name="householdId"
              options={householdOptions}
              value={householdId}
              onChange={handleHouseholdChange}
              placeholder="— Chọn mã hộ —"
              searchPlaceholder="Tìm theo mã hộ hoặc tên chủ hộ..."
              emptyMessage="Không tìm thấy hộ"
              required
            />
          </Field>
        )}
        <Field label="Quan hệ">
          <SearchableSelect
            id="relationshipSelect"
            options={relationshipOptions}
            value={relationshipSelect}
            onChange={setRelationshipSelect}
            placeholder="— Chọn quan hệ —"
            searchPlaceholder="Tìm quan hệ..."
            emptyMessage="Không có kết quả"
          />
          <input type="hidden" name="relationship" value={relationshipValue} />
          {relationshipSelect === "Khác" && (
            <Input
              className="mt-2"
              value={customRelationship}
              onChange={(e) => setCustomRelationship(e.target.value)}
              placeholder="Nhập quan hệ khác..."
              maxLength={100}
            />
          )}
        </Field>
      </Section>

      <Section title="Tin lành">
        <Field label="Báp têm" className="space-y-2">
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
        <Field label="Tin Chúa" className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isTrusted"
              checked={isTrusted}
              onChange={(e) => setIsTrusted(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Tin Chúa
          </label>
        </Field>
        <Field label="Là thành viên NTP" className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isNtpPer"
              checked={isNtpPer}
              onChange={(e) => setIsNtpPer(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Là thành viên NTP
          </label>
        </Field>
        <Field label="Ban ngành theo tuổi">
          <SearchableSelect
            id="ageDepartmentId"
            name="ageDepartmentId"
            options={departmentOptions}
            value={ageDepartmentId}
            onChange={setAgeDepartmentId}
            placeholder="— Chọn ban ngành —"
            searchPlaceholder="Tìm theo tên ban ngành..."
            emptyMessage="Chưa có ban ngành — thêm tại menu Ban ngành"
          />
        </Field>
        <Field label="Ban ngành thực tế">
          <SearchableSelect
            id="actualDepartmentId"
            name="actualDepartmentId"
            options={departmentOptions}
            value={actualDepartmentId}
            onChange={setActualDepartmentId}
            placeholder="— Chọn ban ngành —"
            searchPlaceholder="Tìm theo tên ban ngành..."
            emptyMessage="Chưa có ban ngành — thêm tại menu Ban ngành"
          />
        </Field>
        <Field label="Ban chấp sự">
          <Input
            name="boardServiceYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={member?.boardServiceYear ?? ""}
            placeholder="Năm"
          />
        </Field>
        <Field label="Ban thăm viếng">
          <Input
            name="visitDepartmentYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={member?.visitDepartmentYear ?? ""}
            placeholder="Năm"
          />
        </Field>
      </Section>

      <Section title="Thăm viếng">
        <Field label="Tổ phụ trách thăm viếng">
          <select
            name="visitTeamId"
            className={selectClass}
            value={visitTeamId}
            onChange={(e) => setVisitTeamId(e.target.value)}
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
        <Button
          type="submit"
          disabled={loading}
          icon={loading ? undefined : SaveIcon}
        >
          {loading
            ? "Đang lưu..."
            : isEdit
              ? "Lưu thay đổi"
              : "Lưu thành viên"}
        </Button>
        <Button type="button" variant="outline" asChild icon={CancelIcon}>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
