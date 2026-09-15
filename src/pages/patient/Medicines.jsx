import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { patientService } from '../../services/patientService';
import { AlertTriangle, Pill, Plus, ScanLine, Trash2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

const Medicines = () => {
  const [medications, setMedications] = useState([]);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '', scheduled_time: '', quantity: 30, remaining_quantity: 30 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [labelText, setLabelText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [scanningImage, setScanningImage] = useState(false);

  const loadMedications = () => patientService.fetchMedications()
    .then(setMedications)
    .catch((err) => setError(err.response?.data?.detail || err.message || 'Unable to load medications.'))
    .finally(() => setLoading(false));

  useEffect(() => { loadMedications(); }, []);

  useEffect(() => {
    patientService.fetchIntelligence().then(setIntelligence).catch(() => {});
  }, [medications.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const medication = await patientService.addMedication({ ...form, quantity: Number(form.quantity), remaining_quantity: Number(form.remaining_quantity) });
      setMedications((current) => [...current, medication]);
      setForm({ name: '', dosage: '', frequency: '', scheduled_time: '', quantity: 30, remaining_quantity: 30 });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to add medication.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await patientService.deleteMedication(id);
    setMedications((current) => current.filter((medication) => medication.id !== id));
  };

  const handleRefill = async (id) => {
    const updated = await patientService.refillMedication(id);
    setMedications((current) => current.map((medication) => medication.id === id ? updated : medication));
  };

  const handleScan = async (event) => {
    event.preventDefault();
    setError('');
    try {
      setScanResult(await patientService.scanMedicationText(labelText));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to extract medication details.');
    }
  };

  const useScanResult = () => {
    if (!scanResult) return;
    setForm((current) => ({ ...current, name: scanResult.name, dosage: scanResult.dosage, frequency: scanResult.frequency }));
    setScanResult(null);
  };

  const handleImageScan = async (event) => {
    const image = event.target.files?.[0];
    if (!image) return;
    setScanningImage(true);
    setError('');
    try {
      const worker = await createWorker('eng');
      const result = await worker.recognize(image);
      await worker.terminate();
      setLabelText(result.data.text);
      setScanResult(await patientService.scanMedicationText(result.data.text));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to read the medicine image.');
    } finally {
      setScanningImage(false);
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="medicines-page">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Prescriptions & Medicines</h1>
        <p className="text-xs text-slate-450 mt-0.5">Manage, scan, and inspect active medications.</p>
      </div>

      <Card title="Add Medication" subtitle="Record a prescription and its refill quantity">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input label="Medicine Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input label="Dosage" placeholder="500mg" value={form.dosage} onChange={(event) => setForm({ ...form, dosage: event.target.value })} required />
          <Input label="Frequency" placeholder="Once daily" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} required />
          <Input label="Scheduled Time" placeholder="08:00 AM" value={form.scheduled_time} onChange={(event) => setForm({ ...form, scheduled_time: event.target.value })} required />
          <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
          <Input label="Remaining Quantity" type="number" min="0" value={form.remaining_quantity} onChange={(event) => setForm({ ...form, remaining_quantity: event.target.value })} required />
          <ErrorMessage message={error} />
          <Button type="submit" loading={saving} className="sm:col-start-2"><Plus className="h-4 w-4 mr-1.5" />Add Medication</Button>
        </form>
      </Card>

      <Card title="Scan Prescription Text" subtitle="OCR preview: paste label text, review it, then confirm before saving">
        <form onSubmit={handleScan} className="space-y-3 mt-4">
          <label className="block text-xs font-semibold text-slate-600">Medicine label image<input type="file" accept="image/*" onChange={handleImageScan} disabled={scanningImage} className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700" /></label>
          {scanningImage && <p className="text-xs text-slate-500">Reading image text...</p>}
          <textarea value={labelText} onChange={(event) => setLabelText(event.target.value)} required rows={3} placeholder="Example: Metformin 500mg twice daily" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500" />
          <Button type="submit"><ScanLine className="h-4 w-4 mr-1.5" />Extract Details</Button>
        </form>
        {scanResult && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-bold text-amber-900">Review extracted details</p><p className="mt-1 text-amber-800">{scanResult.name} · {scanResult.dosage || 'Dosage not detected'} · {scanResult.frequency || 'Frequency not detected'}</p><p className="mt-2 text-xs text-amber-700">{scanResult.disclaimer}</p><Button type="button" variant="secondary" className="mt-3 !py-1.5 !px-3 text-xs" onClick={useScanResult}>Use in medication form</Button></div>}
      </Card>

      {intelligence && <Card title="Medication Intelligence" subtitle="Decision-support estimates, not medical advice">
        <div className="space-y-3 mt-4">
          {intelligence.refill_predictions.map((prediction) => <div key={prediction.medication_id} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-700">{prediction.name}: {prediction.message}</span>{prediction.refill_needed && <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Refill soon</span>}</div>)}
          {intelligence.safety_alerts.map((alert) => <div key={alert.message} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Medication safety information:</strong> {alert.message}</div>)}
          <p className="text-[11px] text-slate-500">{intelligence.disclaimer}</p>
        </div>
      </Card>}

      {loading ? <Loading text="Loading medications..." /> : medications.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">No active medications have been recorded.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((medication) => (
            <Card key={medication.id}>
              <div className="flex justify-between gap-4">
                <div className="flex gap-3">
                  <div className="bg-brand-50 text-brand-600 p-2 rounded-lg h-fit"><Pill className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-bold text-slate-800">{medication.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">{medication.dosage} · {medication.frequency}</p>
                    <p className="text-xs text-slate-500 mt-1">Scheduled: {medication.time}</p>
                    <p className="text-xs text-slate-500 mt-2">Remaining: {medication.remaining_quantity} / {medication.quantity}</p>
                  </div>
                </div>
                <div className="flex gap-2 h-fit"><Button type="button" variant="secondary" className="!py-1 !px-2 text-[10px] text-amber-700" onClick={() => handleRefill(medication.id)}>Mark Refilled</Button><button type="button" onClick={() => handleDelete(medication.id)} aria-label={`Remove ${medication.name}`} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Medicines;
