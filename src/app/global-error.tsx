"use client";

/**
 * Global error boundary — phải có html/body riêng, không dùng root layout.
 * Minimal để tránh lỗi prerender /_global-error khi build trên server.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          margin: 0,
          background: "#f9fafb",
          color: "#111827",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Lỗi hệ thống</h1>
        <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
          Đã xảy ra lỗi. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#1e3a5f",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
