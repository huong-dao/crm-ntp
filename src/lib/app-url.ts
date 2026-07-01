import { headers } from "next/headers";

/** Base URL công khai của app (dùng cho QR, link ngoài). */
export async function getAppBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

/** Chỉ cho phép redirect nội bộ (tránh open redirect). */
export function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!callbackUrl) return fallback;
  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}
