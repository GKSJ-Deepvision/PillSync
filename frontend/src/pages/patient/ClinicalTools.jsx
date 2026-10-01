import { useEffect, useState } from 'react';
import { FileText, ScanLine, TrendingDown } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import { getApiErrorMessage } from '../../services/api';
import { medicationService } from '../../services/medicationService';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const initialCorrection = {
  medicine_name: '', dosage: '', quantity: '', frequency: '', prescription_details: '',
};

const ClinicalTools = () => {
  const [medicines, setMedicines] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrRecord, setOcrRecord] = useState(null);
  const [correction, setCorrection] = useState(initialCorrection);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ doctor_name: '', issue_date: '', expiry_date: '' });
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [medicineData, prescriptionData] = await Promise.all([
          medicationService.listMedicines(), medicationService.listPrescriptions(),
        ]);
        setMedicines(medicineData);
        setPrescriptions(prescriptionData);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load clinical tools.'));
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const uploadOcr = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    if (!ocrFile) return setError('Select an image or PDF first.');
    if (!allowedTypes.includes(ocrFile.type)) return setError('OCR accepts JPEG, PNG, WEBP, or PDF files.');
    if (ocrFile.size > 5 * 1024 * 1024) return setError('OCR files cannot exceed 5 MB.');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', ocrFile);
      formData.append('upload_type', 'medicine_image');
      const record = await medicationService.uploadOcr(formData);
      setOcrRecord(record);
      setCorrection({
        medicine_name: record.medicine_name || '', dosage: record.dosage || '', quantity: record.quantity || '',
        frequency: record.frequency || '', prescription_details: record.prescription_details || '',
      });
      setFeedback('OCR upload completed. Review the extracted fields below.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to process the OCR upload.'));
    } finally {
      setSaving(false);
    }
  };

  const saveCorrection = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await medicationService.correctOcr(ocrRecord.id, correction);
      setOcrRecord(updated);
      setFeedback('OCR corrections saved.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save OCR corrections.'));
    } finally {
      setSaving(false);
    }
  };

  const uploadPrescription = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!prescriptionFile) throw new Error('Select a prescription file first.');
      const formData = new FormData();
      formData.append('file', prescriptionFile);
      Object.entries(prescriptionForm).forEach(([key, value]) => formData.append(key, value));
      const created = await medicationService.createPrescription(formData);
      setPrescriptions((current) => [created, ...current]);
      setPrescriptionFile(null);
      setPrescriptionForm({ doctor_name: '', issue_date: '', expiry_date: '' });
      setFeedback('Prescription uploaded successfully.');
    } catch (requestError) {
      setError(requestError.response ? getApiErrorMessage(requestError, 'Unable to upload prescription.') : requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const loadPrediction = async (medicineId) => {
    setSelectedMedicine(medicineId);
    if (!medicineId) return;
    setError('');
    try {
      const prediction = await medicationService.getRefillPrediction(medicineId);
      setPredictions((current) => ({ ...current, [medicineId]: prediction }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load refill prediction.'));
    }
  };

  if (loading) return <Loading fullScreen text="Loading clinical tools..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="clinical-tools-page">
      <div><h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Clinical tools</h1><p className="text-xs text-slate-450 mt-0.5">Upload records, review OCR extraction, and check refill predictions from the backend.</p></div>
      {feedback && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{feedback}</div>}
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Medicine OCR" subtitle="JPEG, PNG, WEBP, or PDF up to 5 MB" className="p-5">
          <form onSubmit={uploadOcr} className="space-y-4 mt-3">
            <label className="block text-xs font-semibold text-slate-600">Medicine image or PDF<input className="mt-1 block w-full text-xs" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => setOcrFile(event.target.files?.[0] || null)} /></label>
            <Button type="submit" disabled={saving}><ScanLine className="mr-2 h-4 w-4" />{saving ? 'Processing...' : 'Upload for OCR'}</Button>
          </form>
          {ocrRecord && <div className="mt-5 border-t border-slate-100 pt-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">Status: {ocrRecord.status}</span><span className={ocrRecord.is_uncertain ? 'text-amber-700' : 'text-emerald-700'}>{ocrRecord.is_uncertain ? 'Review required' : `Confidence ${ocrRecord.confidence ?? 'n/a'}`}</span></div><form onSubmit={saveCorrection} className="mt-4 space-y-3">{Object.keys(initialCorrection).map((field) => <Input key={field} label={field.replaceAll('_', ' ')} value={correction[field]} onChange={(event) => setCorrection({ ...correction, [field]: event.target.value })} />)}<Button type="submit" variant="outline" disabled={saving}>Save corrections</Button></form></div>}
        </Card>
        <Card title="Prescription upload" subtitle="Store a prescription with its dates and doctor" className="p-5">
          <form onSubmit={uploadPrescription} className="space-y-3 mt-3"><Input label="Doctor name" value={prescriptionForm.doctor_name} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, doctor_name: event.target.value })} required /><div className="grid grid-cols-2 gap-3"><Input label="Issue date" type="date" value={prescriptionForm.issue_date} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, issue_date: event.target.value })} required /><Input label="Expiry date" type="date" value={prescriptionForm.expiry_date} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, expiry_date: event.target.value })} required /></div><label className="block text-xs font-semibold text-slate-600">Prescription file<input className="mt-1 block w-full text-xs" type="file" onChange={(event) => setPrescriptionFile(event.target.files?.[0] || null)} required /></label><Button type="submit" disabled={saving}><FileText className="mr-2 h-4 w-4" />Upload prescription</Button></form><div className="mt-5 space-y-2">{prescriptions.length === 0 ? <p className="text-xs text-slate-500">No prescriptions uploaded yet.</p> : prescriptions.map((prescription) => <div key={prescription.id} className="rounded-lg border border-slate-100 p-3 text-xs"><strong className="text-slate-800">{prescription.doctor_name}</strong><span className="ml-2 text-slate-500">{prescription.issue_date} to {prescription.expiry_date}</span></div>)}</div>
        </Card>
      </div>
      <Card title="Refill prediction" subtitle="Predictions are calculated by the Django backend" className="p-5">
        {medicines.length === 0 ? <EmptyState title="Add a medicine first" description="Refill predictions need a medicine and its schedules." /> : <><select value={selectedMedicine} onChange={(event) => loadPrediction(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">Select a medicine</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}</select>{selectedMedicine && predictions[selectedMedicine] && <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"><div><span className="block text-slate-400">Daily use</span><strong>{predictions[selectedMedicine].daily_consumption}</strong></div><div><span className="block text-slate-400">Days remaining</span><strong>{predictions[selectedMedicine].days_remaining}</strong></div><div><span className="block text-slate-400">Predicted refill</span><strong>{predictions[selectedMedicine].predicted_refill_date}</strong></div><div className="flex items-center gap-2 text-brand-700"><TrendingDown className="h-4 w-4" />{predictions[selectedMedicine].is_fallback ? 'Fallback estimate' : 'Calculated estimate'}</div></div>}</>}
      </Card>
    </div>
  );
};

export default ClinicalTools;
