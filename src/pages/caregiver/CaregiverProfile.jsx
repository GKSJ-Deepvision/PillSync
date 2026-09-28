import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import RoleBadge from '../../components/RoleBadge';
import { Mail, Phone, Calendar, Heart } from 'lucide-react';

const CaregiverProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="caregiver-profile-page">
      <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">My Profile</h1>

      <Card>
        {/* Banner with profile summary */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'}
            alt={user?.name}
            className="h-24 w-24 rounded-full border-2 border-caregiver-200 object-cover"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-850">{user?.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <RoleBadge role={user?.role} />
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded font-medium">Verified Care Provider</span>
            </div>
          </div>
        </div>

        {/* Detailed credential rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
          <div className="flex items-center gap-3.5 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Mail className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Phone className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{user?.phone || '+1 (555) 987-6543'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">January 14, 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Heart className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Affiliated Hospital</span>
              <span className="font-semibold text-slate-700 mt-0.5 block leading-normal">Mercy General Clinic</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CaregiverProfile;
