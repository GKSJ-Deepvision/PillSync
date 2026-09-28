import './EmptyState.css';

export function EmptyState({ icon: Icon, title, message, action, className = '' }) {
  return (
    <div className={`empty-state-box ${className}`}>
      {Icon && (
        <div className="empty-state-icon-box">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-msg">{message}</p>
      {action && action}
    </div>
  );
}
