import './Select.css';

export function Select({ label, error, options = [], required = false, className = '', ...props }) {
  return (
    <div className="select-group">
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="select-required-star">*</span>}
        </label>
      )}
      <select
        className={`select-field ${error ? 'select-field-error' : ''} ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="select-error-msg">{error}</p>}
    </div>
  );
}
