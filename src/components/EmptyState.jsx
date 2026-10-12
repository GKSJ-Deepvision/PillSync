import Button from './Button';

const EmptyState = ({
  title = 'No records found',
  description = 'There are no active records in this list.',
  actionText,
  onAction}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-white max-w-md mx-auto my-6 animate-fade-in" data-testid="empty-state">
      <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800 leading-tight">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-xs">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-5">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
