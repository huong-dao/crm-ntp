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
