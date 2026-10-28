import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Chuẩn hóa chuỗi tiếng Việt về cùng 1 dạng Unicode (NFC) trước khi so sánh.
 * Dữ liệu import từ Excel/macOS có thể ở dạng NFD (dấu tổ hợp riêng), khiến
 * `.includes()` không khớp dù 2 chuỗi hiển thị giống hệt nhau.
 */
export function normalizeSearchText(value: string): string {
  return value.normalize("NFC").toLowerCase();
}
