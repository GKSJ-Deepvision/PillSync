import './Alert.css';

export function Alert({ type = 'info', title, message, onClose, className = '' }) {
  return (
    <div className={`alert-box alert-${type} ${className}`}>
      <div>
        {title && <h3 className="alert-title">{title}</h3>}
        {message && <p className="alert-message">{message}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="alert-close-btn"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
