import LoginForm from "@/components/auth/login-form";
import Image from "next/image";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
