import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={user?.role === "admin"} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          username={user?.username ?? ""}
          role={user?.role ?? "user"}
          isAdmin={user?.role === "admin"}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
