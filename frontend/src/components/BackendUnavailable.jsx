import Card from './Card';

const BackendUnavailable = ({ title, description }) => (
  <div className="max-w-3xl mx-auto animate-fade-in">
    <Card className="p-8 text-center">
      <h1 className="text-xl font-extrabold text-slate-800">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <p className="mt-4 text-xs font-semibold text-slate-400">This view will become available when the Django API exposes the required resource.</p>
    </Card>
  </div>
);

export default BackendUnavailable;
