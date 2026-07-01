import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";
import Image from "next/image";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

type SearchParams = Record<string, string | string[] | undefined>;

function pickCallbackUrl(params: SearchParams): string {
  const raw = params.callbackUrl;
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  return sanitizeCallbackUrl(value);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const callbackUrl = pickCallbackUrl(params);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e3a5f] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex justify-center mb-2">
          <Image src="/logo-ntp.png" alt="Logo" width={100} height={100} />
        </div>
        <h1 className="text-center text-xl font-bold text-[#1e3a5f]">
          Ban Thăm Viếng<br />
          HTTL Nguyễn Tri Phương
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Đăng nhập hệ thống quản lý
        </p>
        <Suspense fallback={null}>
          <LoginForm callbackUrl={callbackUrl} />
        </Suspense>
      </div>
    </div>
  );
}
