"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDistrictOptionsByProvince,
  getProvinceOptions,
  getWardOptionsByDistrict,
  getWardOptionsByProvince,
  type DistrictOption,
  type ProvinceOption,
  type WardOption,
} from "@/actions/administrative-unit-actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

export type AddressFieldValues = {
  houseNumber: string;
  street: string;
  oldWard: string;
  oldDistrict: string;
  oldProvince: string;
  newWard: string;
  newProvince: string;
};

type AddressFieldsProps = {
  values: AddressFieldValues;
  onChange: (field: keyof AddressFieldValues, value: string) => void;
  hasAdministrativeData: boolean;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function findByName<T extends { id: string; name: string }>(
  items: T[],
  name: string | undefined
): T | undefined {
  if (!name?.trim()) return undefined;
  const target = normalizeName(name);
  return items.find((item) => normalizeName(item.name) === target);
}

function wardLabel(ward: WardOption, includeDistrict: boolean): string {
  if (includeDistrict) {
    return `${ward.name} — ${ward.districtName}`;
  }
  return ward.name;
}

export function AddressFields({
  values,
  onChange,
  hasAdministrativeData,
}: AddressFieldsProps) {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [oldDistricts, setOldDistricts] = useState<DistrictOption[]>([]);
  const [oldWards, setOldWards] = useState<WardOption[]>([]);
  const [newWards, setNewWards] = useState<WardOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  const [oldProvinceId, setOldProvinceId] = useState("");
  const [oldDistrictId, setOldDistrictId] = useState("");
  const [oldWardId, setOldWardId] = useState("");
  const [newProvinceId, setNewProvinceId] = useState("");
  const [newWardId, setNewWardId] = useState("");

  useEffect(() => {
    if (!hasAdministrativeData) return;

    let cancelled = false;
    setLoadingProvinces(true);

    getProvinceOptions()
      .then((items) => {
        if (cancelled) return;
        setProvinces(items);

        const matchedOldProvince = findByName(items, values.oldProvince);
        if (matchedOldProvince) {
          setOldProvinceId(matchedOldProvince.id);
        }

        const matchedNewProvince = findByName(items, values.newProvince);
        if (matchedNewProvince) {
          setNewProvinceId(matchedNewProvince.id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasAdministrativeData, values.oldProvince, values.newProvince]);

  useEffect(() => {
    if (!oldProvinceId) {
      setOldDistricts([]);
      setOldDistrictId("");
      setOldWards([]);
      setOldWardId("");
      return;
    }

    let cancelled = false;

    getDistrictOptionsByProvince(oldProvinceId).then((items) => {
      if (cancelled) return;
      setOldDistricts(items);

      const matchedDistrict = findByName(items, values.oldDistrict);
      setOldDistrictId(matchedDistrict?.id ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [oldProvinceId, values.oldDistrict]);

  useEffect(() => {
    if (!oldDistrictId) {
      setOldWards([]);
      setOldWardId("");
      return;
    }

    let cancelled = false;

    getWardOptionsByDistrict(oldDistrictId).then((items) => {
      if (cancelled) return;
      setOldWards(items);

      const matchedWard = findByName(items, values.oldWard);
      setOldWardId(matchedWard?.id ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [oldDistrictId, values.oldWard]);

  useEffect(() => {
    if (!newProvinceId) {
      setNewWards([]);
      setNewWardId("");
      return;
    }

    let cancelled = false;

    getWardOptionsByProvince(newProvinceId).then((items) => {
      if (cancelled) return;
      setNewWards(items);

      const matchedWard = findByName(items, values.newWard);
      setNewWardId(matchedWard?.id ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [newProvinceId, values.newWard]);

  const provinceOptions = useMemo(
    () =>
      provinces.map((province) => ({
        value: province.id,
        label: province.name,
        searchText: `${province.name} ${province.code}`,
      })),
    [provinces]
  );

  const oldDistrictOptions = useMemo(
    () =>
      oldDistricts.map((district) => ({
        value: district.id,
        label: district.name,
        searchText: `${district.name} ${district.code}`,
      })),
    [oldDistricts]
  );

  const oldWardOptions = useMemo(
    () =>
      oldWards.map((ward) => ({
        value: ward.id,
        label: ward.name,
        searchText: `${ward.name} ${ward.code} ${ward.level}`,
      })),
    [oldWards]
  );

  const newWardOptions = useMemo(
    () =>
      newWards.map((ward) => ({
        value: ward.id,
        label: wardLabel(ward, true),
        searchText: `${ward.name} ${ward.districtName} ${ward.code}`,
      })),
    [newWards]
  );

  function handleOldProvinceChange(provinceId: string) {
    setOldProvinceId(provinceId);
    const province = provinces.find((item) => item.id === provinceId);
    onChange("oldProvince", province?.name ?? "");
    onChange("oldDistrict", "");
    onChange("oldWard", "");
    setOldDistrictId("");
    setOldWardId("");
  }

  function handleOldDistrictChange(districtId: string) {
    setOldDistrictId(districtId);
    const district = oldDistricts.find((item) => item.id === districtId);
    onChange("oldDistrict", district?.name ?? "");
    onChange("oldWard", "");
    setOldWardId("");
  }

  function handleOldWardChange(wardId: string) {
    setOldWardId(wardId);
    const ward = oldWards.find((item) => item.id === wardId);
    onChange("oldWard", ward?.name ?? "");
  }

  function handleNewProvinceChange(provinceId: string) {
    setNewProvinceId(provinceId);
    const province = provinces.find((item) => item.id === provinceId);
    onChange("newProvince", province?.name ?? "");
    onChange("newWard", "");
    setNewWardId("");
  }

  function handleNewWardChange(wardId: string) {
    setNewWardId(wardId);
    const ward = newWards.find((item) => item.id === wardId);
    onChange("newWard", ward?.name ?? "");
  }

  const selectPlaceholder = loadingProvinces
    ? "Đang tải..."
    : hasAdministrativeData
      ? "— Chọn —"
      : "Chưa có dữ liệu — import tại menu Địa chỉ HC";

  return (
    <>
      {hasAdministrativeData && (
        <>
          <input type="hidden" name="oldProvince" value={values.oldProvince} />
          <input type="hidden" name="oldDistrict" value={values.oldDistrict} />
          <input type="hidden" name="oldWard" value={values.oldWard} />
          <input type="hidden" name="newProvince" value={values.newProvince} />
          <input type="hidden" name="newWard" value={values.newWard} />
        </>
      )}

      <div className="space-y-2 sm:col-span-3">
        <p className="text-sm font-medium text-gray-900">Địa chỉ cũ (3 cấp)</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tỉnh cũ</label>
        {hasAdministrativeData ? (
          <SearchableSelect
            options={provinceOptions}
            value={oldProvinceId}
            onChange={handleOldProvinceChange}
            placeholder={selectPlaceholder}
            disabled={loadingProvinces || provinces.length === 0}
            emptyMessage="Không tìm thấy tỉnh/thành"
          />
        ) : (
          <input
            name="oldProvince"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={values.oldProvince}
            onChange={(e) => onChange("oldProvince", e.target.value)}
            maxLength={100}
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Quận cũ</label>
        {hasAdministrativeData ? (
          <SearchableSelect
            options={oldDistrictOptions}
            value={oldDistrictId}
            onChange={handleOldDistrictChange}
            placeholder={oldProvinceId ? "— Chọn —" : "Chọn tỉnh trước"}
            disabled={!oldProvinceId}
            emptyMessage="Không tìm thấy quận/huyện"
          />
        ) : (
          <input
            name="oldDistrict"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={values.oldDistrict}
            onChange={(e) => onChange("oldDistrict", e.target.value)}
            maxLength={100}
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phường cũ</label>
        {hasAdministrativeData ? (
          <SearchableSelect
            options={oldWardOptions}
            value={oldWardId}
            onChange={handleOldWardChange}
            placeholder={oldDistrictId ? "— Chọn —" : "Chọn quận trước"}
            disabled={!oldDistrictId}
            emptyMessage="Không tìm thấy phường/xã"
          />
        ) : (
          <input
            name="oldWard"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={values.oldWard}
            onChange={(e) => onChange("oldWard", e.target.value)}
            maxLength={100}
          />
        )}
      </div>

      <div className="space-y-2 sm:col-span-3">
        <p className="text-sm font-medium text-gray-900">Địa chỉ mới</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tỉnh mới</label>
        {hasAdministrativeData ? (
          <SearchableSelect
            options={provinceOptions}
            value={newProvinceId}
            onChange={handleNewProvinceChange}
            placeholder={selectPlaceholder}
            disabled={loadingProvinces || provinces.length === 0}
            emptyMessage="Không tìm thấy tỉnh/thành"
          />
        ) : (
          <input
            name="newProvince"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={values.newProvince}
            onChange={(e) => onChange("newProvince", e.target.value)}
            maxLength={100}
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phường mới</label>
        {hasAdministrativeData ? (
          <SearchableSelect
            options={newWardOptions}
            value={newWardId}
            onChange={handleNewWardChange}
            placeholder={newProvinceId ? "— Chọn —" : "Chọn tỉnh trước"}
            disabled={!newProvinceId}
            emptyMessage="Không tìm thấy phường/xã"
          />
        ) : (
          <input
            name="newWard"
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={values.newWard}
            onChange={(e) => onChange("newWard", e.target.value)}
            maxLength={100}
          />
        )}
      </div>
    </>
  );
}
