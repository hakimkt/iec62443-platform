export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
}
