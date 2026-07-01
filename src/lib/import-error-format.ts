import type { ZodError } from "zod";

export const MEMBER_IMPORT_FIELD_LABELS: Record<string, string> = {
  status: "Tình trạng",
  firstName: "Họ và lót",
  lastName: "Tên",
  gender: "Giới tính",
  birthYear: "Năm sinh",
  baptismYear: "Năm báp têm",
  occupation: "Nghề nghiệp",
  houseNumber: "Số nhà",
  street: "Tên đường",
  oldWard: "Phường cũ",
  oldDistrict: "Quận cũ",
  oldProvince: "Tỉnh cũ",
  newWard: "Phường mới",
  newProvince: "Tỉnh mới",
  mobile1: "Di động 1",
  mobile2: "Di động 2",
  landline: "ĐT bàn",
  relationship: "Quan hệ",
  boardServiceYear: "Ban chấp sự",
  visitDepartmentYear: "Ban thăm viếng",
  notes: "Ghi chú",
  householdId: "Mã hộ",
  isHead: "Chủ hộ",
};

function translateZodMessage(message: string): string {
  if (message === "Invalid input") {
    return "dữ liệu không hợp lệ";
  }
  if (message.startsWith("Too big:")) {
    const match = message.match(/<= (\d+)/);
    return match ? `tối đa ${match[1]} ký tự` : "quá dài";
  }
  if (message.startsWith("Too small:")) {
    const match = message.match(/>= (\d+)/);
    return match ? `tối thiểu ${match[1]} ký tự` : "quá ngắn";
  }
  if (message.startsWith("Invalid option:")) {
    return "giá trị không hợp lệ";
  }
  return message;
}

export function formatZodImportErrors(
  error: ZodError,
  fieldLabels: Record<string, string> = MEMBER_IMPORT_FIELD_LABELS
): string {
  const parts = error.issues.map((issue) => {
    const field = issue.path[0]?.toString() ?? "";
    const label = fieldLabels[field] ?? field ?? "Dữ liệu";
    const msg = translateZodMessage(issue.message);
    return `Cột "${label}": ${msg}`;
  });

  const unique = [...new Set(parts)];
  if (unique.length <= 3) {
    return unique.join("; ");
  }
  return `${unique.slice(0, 3).join("; ")}; ... (+${unique.length - 3} lỗi khác)`;
}

export function importFieldError(
  column: string,
  message: string,
  value?: string
): string {
  const trimmed = value?.trim();
  if (trimmed) {
    return `Cột "${column}": ${message} (giá trị: "${trimmed}")`;
  }
  return `Cột "${column}": ${message}`;
}
