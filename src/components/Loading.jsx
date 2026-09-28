
const Loading = ({
  fullScreen = false,
  size = 'md',
  text = 'Loading...'}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3" data-testid="loading-indicator">
      <div
        className={`animate-spin rounded-full border-brand-200 border-t-brand-600 ${sizeClasses[size]}`}
      />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-55/75 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex items-center justify-center w-full">{spinner}</div>;
};

export default Loading;
