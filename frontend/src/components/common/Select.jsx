import './Select.css';

export function Select({ label, error, options = [], required = false, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 bg-white
          focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
          disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed
          ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
    </div>
  );
}
