export default function TasksLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted" />)}</div>
    </div>
  );
}
