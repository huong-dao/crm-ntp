import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e3a5f] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold text-[#1e3a5f]">
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
