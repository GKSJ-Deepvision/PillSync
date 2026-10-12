import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none" data-testid="unauthorized-page">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6 animate-fade-in">
        <div className="bg-red-50 text-red-600 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-red-100">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-550 leading-relaxed">
            You do not have permissions to access this screen. Frontend role authorization policies are enforced.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
