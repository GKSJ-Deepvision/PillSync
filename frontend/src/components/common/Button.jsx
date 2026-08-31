import './Button.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-sky-500 text-white hover:from-primary-700 hover:to-sky-600 focus:ring-primary-200 active:translate-y-0.5',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-200 active:translate-y-0.5',
    danger:
      'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 focus:ring-red-200 active:translate-y-0.5',
    success:
      'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 focus:ring-emerald-200 active:translate-y-0.5',
    outline:
      'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 focus:ring-primary-200',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              fill="currentColor"
              d="M12 2c5.523 0 10 4.477 10 10 0 .52-.04 1.03-.116 1.528A1 1 0 0 1 20.87 12a8 8 0 1 1-7.87 7.87 1 1 0 0 1 1.528-.116c.498.076 1.008.116 1.528.116"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
