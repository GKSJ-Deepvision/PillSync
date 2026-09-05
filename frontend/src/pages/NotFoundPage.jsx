import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-5xl font-semibold text-brand-700">404</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">This page does not exist</h1>
        <p className="mt-1 text-sm text-slate-600">
          The link may be out of date, or the page may have moved.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
