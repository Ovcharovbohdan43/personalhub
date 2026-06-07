export default function DocumentsLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr] animate-pulse">
      <div className="h-[520px] rounded-2xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
