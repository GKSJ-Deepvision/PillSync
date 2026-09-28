import './Input.css';

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
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required-star">*</span>}
        </label>
      )}
      <div className="input-box-relative">
        {Icon && <Icon className="input-icon-left" />}
        <input
          type={type}
          className={`input-field ${Icon ? 'input-field-with-icon' : ''} ${error ? 'input-field-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
}
