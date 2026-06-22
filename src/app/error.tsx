"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Có lỗi xảy ra</h2>
      <p className="mt-2 text-sm text-red-700">
        Vui lòng thử lại hoặc quay lại trang trước.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white"
      >
        Thử lại
      </button>
    </div>
  );
}
