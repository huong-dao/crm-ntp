import { redirect } from "next/navigation";
import { getUsers } from "@/actions/user-actions";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { UsersTable } from "@/components/users/users-table";
import { auth } from "@/lib/auth";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Tài khoản
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Tạo và quản lý tài khoản người dùng hệ thống
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <div className="mt-6">
        <UsersTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
