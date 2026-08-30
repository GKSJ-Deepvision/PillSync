export function Input({
  label,
  error,
  icon: Icon,
  className = '',
  type = 'text',
  required = false,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />}
        <input
          type={type}
          className={`
            w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900
            shadow-sm transition-all placeholder:text-slate-400
            focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
