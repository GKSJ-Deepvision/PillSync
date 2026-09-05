export default function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center gap-2 text-slate-500 ${className}`}>
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
