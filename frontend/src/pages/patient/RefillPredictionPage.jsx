import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import RefillPredictionCard from '../../features/refills/RefillPredictionCard';
import { getRefillTrackedMedicines, updateMedicineStock } from '../../features/refills/refillService';

export default function RefillPredictionPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);

  const loadMedicines = () => {
    const list = getRefillTrackedMedicines();
    setMedicines(list);
  };

  useEffect(() => {
    loadMedicines();
    window.addEventListener('pillsync_refill_updated', loadMedicines);
    return () => window.removeEventListener('pillsync_refill_updated', loadMedicines);
  }, []);

  const handleAddStock = (id, amount = 30) => {
    updateMedicineStock(id, amount);
    loadMedicines();
  };

  const lowStockCount = medicines.filter(m => m.stock <= 10).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)', border: '1px solid #fde68a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fffbeb', color: '#b45309', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', border: '1px solid #fef3c7' }}>
              <RefreshCw size={16} /> AI Refill Prediction Engine
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#78350f' }}>
              Stock Depletion & Automated Refill Monitor
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Monitors medicine consumption, predicts depletion dates, and alerts caregivers before stock runs out.
            </p>
          </div>

          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.88rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div style={{ backgroundColor: '#fff1f2', border: '1.5px solid #fecdd3', color: '#b91c1c', padding: '16px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={22} color="#dc2626" />
          <span>⚠️ Low-Stock Alert: {lowStockCount} medicine(s) have 5 or fewer days of supply remaining!</span>
        </div>
      )}

      {medicines.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <RefreshCw size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Active Medicines Logged for Refill Monitoring
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>
            Add your medicines and remaining stock count to calculate stock depletion rates and automated refill warnings.
          </p>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Medicine for Refill Tracking
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {medicines.map(m => (
            <RefillPredictionCard key={m.id} medicine={m} onAddStock={handleAddStock} />
          ))}
        </div>
      )}
    </div>
  );
}
