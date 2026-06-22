function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">Đang phát triển...</p>
    </div>
  );
}

export default function VisitTeamsPage() {
  return <PlaceholderPage title="Danh sách Tổ thăm viếng" />;
}
