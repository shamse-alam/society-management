export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-10 h-10 border-[3px] border-indigo-100 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      <p className="text-[13px] text-muted mt-3">Loading...</p>
    </div>
  );
}

export function ButtonSpinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
  );
}

export function InlineSpinner({ className = '' }) {
  return (
    <span className={`w-4 h-4 border-2 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin inline-block ${className}`} />
  );
}
