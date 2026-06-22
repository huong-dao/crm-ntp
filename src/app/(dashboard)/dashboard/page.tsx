export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Tổng quan hệ thống — chi tiết ở bước 3.31
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Thành viên", value: "—" },
          { label: "Hộ gia đình", value: "—" },
          { label: "Đơn pending", value: "—" },
          { label: "Tổ thăm viếng", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
