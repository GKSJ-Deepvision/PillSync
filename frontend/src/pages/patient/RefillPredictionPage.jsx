import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function RefillPredictionPage() {
  const navigate = useNavigate();

  // Start with empty medicines array - NO PRE-POPULATED DATA
  const [medicines, setMedicines] = useState([]);

  const handleAddStock = (id, amount = 30) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, stock: m.stock + amount } : m));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          🔄 AI Refill Prediction Engine
        </h2>
        <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {medicines.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFF0F3', border: '2px dashed #FFD6DC' }}>
          <RefreshCw size={44} color="#DC143C" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#2B181D' }}>
            No Active Medicines to Predict Refills
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#7E646A' }}>
            Add your medicines and remaining stock count to calculate stock depletion rates and automated refill warnings.
          </p>
          <button onClick={() => navigate('/add-medicine')} className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Medicine for Refill Tracking
          </button>
        </div>
      ) : (
        medicines.map(m => (
          <div key={m.id} className="glass-card" style={{ padding: '24px', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Active Stock Monitor</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#78350f' }}>💊 {m.name}</h3>
              </div>
              {m.stock <= 10 && (
                <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> LOW STOCK WARNING
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'white', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fef3c7' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Current Stock</span>
                <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>{m.stock} Tablets</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Daily Consumption</span>
                <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>2 Tablets / Day</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Estimated Depletion Date</span>
                <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>In {Math.max(1, Math.floor(m.stock / 2))} Days</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Recommended Refill Date</span>
                <strong style={{ fontSize: '1.1rem', color: '#d97706' }}>In {Math.max(1, Math.floor(m.stock / 2) - 2)} Days</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleAddStock(m.id, 30)} className="btn-primary" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Stock Manually
              </button>
              <button style={{ border: '1px solid #d97706', color: '#d97706', background: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={16} /> Order Refill Medicine
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
