export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-muted" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
