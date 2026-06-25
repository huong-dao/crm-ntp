/** Pure helpers — safe for Client Components (no Prisma). */

function joinAddress(parts: (string | null | undefined)[]) {
  return parts
    .map((part) => part?.trim())
    .filter((part) => part && part.length > 0)
    .join(", ");
}

export function buildOldFullAddress(data: {
  houseNumber?: string | null;
  street?: string | null;
  oldWard?: string | null;
  oldDistrict?: string | null;
  oldProvince?: string | null;
}) {
  return joinAddress([
    data.houseNumber,
    data.street,
    data.oldWard,
    data.oldDistrict,
    data.oldProvince,
  ]);
}

export function buildNewFullAddress(data: {
  houseNumber?: string | null;
  street?: string | null;
  newWard?: string | null;
  newProvince?: string | null;
}) {
  return joinAddress([
    data.houseNumber,
    data.street,
    data.newWard,
    data.newProvince,
  ]);
}

export function buildFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
