export type DepartmentAgeRange = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
};

/** Tuổi dương lịch theo năm sinh (chỉ có năm, không có ngày/tháng). */
export function ageFromBirthYear(
  birthYear: number,
  referenceYear = new Date().getFullYear()
): number {
  return referenceYear - birthYear;
}

export function ageMatchesDepartment(
  age: number,
  minAge: number | null,
  maxAge: number | null
): boolean {
  if (minAge == null && maxAge == null) return false;
  if (minAge != null && age < minAge) return false;
  if (maxAge != null && age > maxAge) return false;
  return true;
}

function departmentRangeWidth(
  minAge: number | null,
  maxAge: number | null
): number {
  const min = minAge ?? 0;
  const max = maxAge ?? 150;
  return max - min;
}

/** Chọn ban ngành có khoảng tuổi khớp; ưu tiên khoảng hẹp nhất nếu trùng. */
export function resolveDepartmentIdByAge(
  birthYear: number,
  departments: DepartmentAgeRange[],
  referenceYear = new Date().getFullYear()
): string | null {
  const age = ageFromBirthYear(birthYear, referenceYear);
  const matches = departments.filter((department) =>
    ageMatchesDepartment(age, department.minAge, department.maxAge)
  );

  if (matches.length === 0) return null;

  matches.sort(
    (a, b) =>
      departmentRangeWidth(a.minAge, a.maxAge) -
      departmentRangeWidth(b.minAge, b.maxAge)
  );

  return matches[0].id;
}
