
const Card = ({
  children,
  className = '',
  title,
  subtitle,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-premium p-5 transition-all duration-200 ${
        hoverable ? 'hover:shadow-soft hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-slate-800 leading-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
