export default function FinancesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-40 rounded-xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="h-80 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
