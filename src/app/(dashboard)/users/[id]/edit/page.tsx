import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getMemberLinkOptions,
  getUserById,
} from "@/actions/user-actions";
import { EditUserForm } from "@/components/users/edit-user-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const [user, memberOptions] = await Promise.all([
    getUserById(id),
    getMemberLinkOptions(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sửa tài khoản: {user.username}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Cập nhật mật khẩu, role, trạng thái và liên kết thành viên
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/users">← Danh sách tài khoản</Link>
        </Button>
      </div>

      <EditUserForm
        user={user}
        memberOptions={memberOptions}
        isSelf={user.id === session.user.id}
      />
    </div>
  );
}
