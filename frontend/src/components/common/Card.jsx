import './Card.css';

export function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div
      className={`
        rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        ${hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(15,23,42,0.08)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`border-b border-slate-200/80 px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`border-t border-slate-200/80 bg-slate-50/60 px-5 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
