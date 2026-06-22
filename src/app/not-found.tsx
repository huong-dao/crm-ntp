import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">Trang không tồn tại</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white"
      >
        Về Dashboard
      </Link>
    </div>
  );
}
