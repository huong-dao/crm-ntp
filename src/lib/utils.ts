import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Chuẩn hóa chuỗi tiếng Việt để so khớp tìm kiếm: bỏ dấu + hạ chữ thường.
 * Dữ liệu import từ Excel/macOS có thể ở dạng Unicode NFD (dấu tổ hợp riêng)
 * thay vì NFC, khiến `.includes()` không khớp dù 2 chuỗi hiển thị giống hệt
 * nhau. Bỏ dấu hoàn toàn còn giúp tìm được dù gõ thiếu/sai dấu.
 */
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
