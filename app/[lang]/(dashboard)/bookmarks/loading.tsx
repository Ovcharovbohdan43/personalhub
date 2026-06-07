export default function BookmarksLoading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-muted" />)}
    </div>
  );
}
