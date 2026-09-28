import './Badge.css';

export function Badge({ children, variant = 'primary', size = 'sm', className = '' }) {
  return (
    <span className={`badge-base badge-${variant} badge-${size} ${className}`}>{children}</span>
  );
}
