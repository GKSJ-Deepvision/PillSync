
const RoleBadge = ({ role, className = '' }) => {
  const styles = {
    patient: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    caregiver: 'bg-violet-50 text-violet-700 border-violet-100',
    admin: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const labels = {
    patient: 'Patient',
    caregiver: 'Caregiver',
    admin: 'Admin',
  };

  const lowerRole = role ? role.toLowerCase() : '';
  const activeStyle = styles[lowerRole] || 'bg-slate-50 text-slate-700 border-slate-200';
  const activeLabel = labels[lowerRole] || role;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeStyle} ${className}`}>
      {activeLabel}
    </span>
  );
};

export default RoleBadge;
