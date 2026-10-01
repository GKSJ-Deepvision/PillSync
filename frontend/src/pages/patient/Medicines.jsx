import { useEffect, useState } from 'react';
import { Plus, Pill } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { getApiErrorMessage } from '../../services/api';
import { medicationService } from '../../services/medicationService';

const emptyForm = { name: '', dosage: '', instructions: '', quantity: 0, refill_threshold: 5 };

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const loadMedicines = async () => { setLoading(true); try { setMedicines(await medicationService.listMedicines()); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Unable to load medicines.')); } finally { setLoading(false); } };
  useEffect(() => { const timer = setTimeout(loadMedicines, 0); return () => clearTimeout(timer); }, []);
  const submit = async (event) => { event.preventDefault(); setError(''); setFeedback(''); setSaving(true); try { await medicationService.createMedicine({ ...form, quantity: Number(form.quantity), refill_threshold: Number(form.refill_threshold) }); setForm(emptyForm); setIsOpen(false); setFeedback('Medicine added successfully.'); await loadMedicines(); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Unable to add medicine.')); } finally { setSaving(false); } };
  return <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="medicines-page"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Medicines</h1><p className="text-xs text-slate-450 mt-0.5">Manage active medicines and stock thresholds.</p></div><Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Add medicine</Button></div>{feedback && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{feedback}</div>}{error && <ErrorMessage message={error} onDismiss={() => setError('')} />}{loading ? <Loading text="Loading medicines..." /> : medicines.length === 0 ? <EmptyState title="No medicines yet" description="Add your first medicine to start scheduling doses." actionText="Add medicine" onAction={() => setIsOpen(true)} /> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{medicines.map((medicine) => <Card key={medicine.id} className="p-5" data-testid="medicine-card"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-600"><Pill className="h-5 w-5" /></div><div><h2 className="text-sm font-bold text-slate-800">{medicine.name}</h2><p className="text-xs text-slate-500 mt-1">{medicine.dosage || 'Dosage not specified'}</p></div></div><span className="text-[11px] font-semibold rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Active</span></div><p className="mt-4 text-xs text-slate-600">{medicine.instructions || 'No instructions provided.'}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><span className="text-slate-400 block">Stock</span><strong className={medicine.quantity <= medicine.refill_threshold ? 'text-amber-700' : 'text-slate-700'}>{medicine.quantity}</strong></div><div><span className="text-slate-400 block">Refill threshold</span><strong className="text-slate-700">{medicine.refill_threshold}</strong></div></div></Card>)}</div>}<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add medicine" footer={<><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" form="medicine-form" loading={saving}>Save medicine</Button></>}><form id="medicine-form" onSubmit={submit} className="space-y-4"><Input label="Name" id="medicine-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Dosage" id="medicine-dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} /><Input label="Instructions" id="medicine-instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input label="Quantity" type="number" min="0" id="medicine-quantity" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /><Input label="Refill threshold" type="number" min="0" id="medicine-threshold" required value={form.refill_threshold} onChange={(e) => setForm({ ...form, refill_threshold: e.target.value })} /></div></form></Modal></div>;
};
export default Medicines;
