import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { ArrowLeft, Pill, Clock, CheckCircle } from 'lucide-react';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await patientService.fetchPatientDetails(id);
        setPatient(data);
      } catch (err) {
        setError(err.message || 'Failed to load patient details.');
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (loading) return <Loading text="Loading patient profile..." />;
  if (error) return (
    <div className="space-y-4 max-w-lg mx-auto">
      <ErrorMessage message={error} />
      <Button variant="outline" onClick={() => navigate('/patients')} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Patients
      </Button>
    </div>
  );
  if (!patient) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="patient-details-page">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100"
          aria-label="Back to patients roster"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{patient.name}</h1>
          <p className="text-xs text-slate-450 mt-0.5 font-medium">Detailed adherence history and active prescriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Demographics and Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demographic Card */}
          <Card title="Demographics & Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-xs">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Email Address</span>
                <span className="font-bold text-slate-700 mt-0.5 block">{patient.email}</span>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Phone Number</span>
                <span className="font-bold text-slate-700 mt-0.5 block">{patient.phone}</span>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Age / DOB</span>
                <span className="font-bold text-slate-700 mt-0.5 block">{patient.age} years old ({patient.dob})</span>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Compliance Status</span>
                <span className="font-bold text-slate-705 mt-0.5 block">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    patient.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {patient.status}
                  </span>
                </span>
              </div>
            </div>
          </Card>

          {/* Active Medications list */}
          <Card title="Prescribed Medications" subtitle="Current drugs list">
            <div className="mt-4 space-y-3">
              {patient.medications.map((med) => (
                <div key={med.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-caregiver-50 text-caregiver-600 p-2 rounded-lg">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                      <p className="text-xs text-slate-450 mt-0.5">{med.dosage} • {med.frequency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-705">Scheduled: {med.time}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-bold">Compliance: {med.compliance}%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Hourly Timeline schedule */}
          <Card title="Today's Timeline" subtitle="Dosage schedule log status">
            <div className="mt-4 divide-y divide-slate-100">
              {patient.schedule.map((slot, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      slot.status === 'Taken' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {slot.status === 'Taken' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-850">{slot.name} ({slot.dosage})</h4>
                      <p className="text-slate-450 text-[10px] mt-0.5">Scheduled for {slot.time}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    slot.status === 'Taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : slot.status === 'Missed' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Adherence chart placeholder & alerts */}
        <div className="space-y-6">
          {/* Adherence Rate */}
          <Card title="Adherence Rate">
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex items-center justify-center relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-800">{patient.adherence.monthly}%</span>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-700">Monthly Average Compliance</h4>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Calculated on daily dosage logs over the last 30 days.
              </p>
            </div>
          </Card>

          {/* Quick Care Actions */}
          <Card title="Quick Actions">
            <div className="space-y-2 mt-2">
              <Button
                variant="outline"
                className="w-full text-xs font-bold"
                onClick={() => alert(`A phone call to ${patient.phone} would initiate here.`)}
              >
                Call Patient
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs font-bold"
                onClick={() => alert(`Initiating direct chat with ${patient.name}...`)}
              >
                Message Patient
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
