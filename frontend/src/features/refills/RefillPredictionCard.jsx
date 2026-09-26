import React from 'react';
import { RefreshCw, Plus, ShoppingCart, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { calculateRefillPrediction } from './refillService';

export default function RefillPredictionCard({ medicine, onAddStock }) {
  const prediction = calculateRefillPrediction({
    stock: medicine.stock,
    dailyFrequency: medicine.dailyFrequency || 2,
    qtyPerDose: medicine.qtyPerDose || 1,
    medicineName: medicine.name
  });

  return (
    <div className="glass-card" style={{ padding: '24px', border: prediction.isLowStock ? '2px solid #fecdd3' : '1px solid #fde68a', backgroundColor: prediction.isLowStock ? '#fff1f2' : '#fffbeb' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: prediction.isLowStock ? '#dc2626' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {prediction.isLowStock ? '⚠️ Urgent Refill Alert' : '🔄 Active Stock Monitor'}
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>💊 {medicine.name}</h3>
        </div>

        {prediction.isLowStock ? (
          <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> LOW STOCK ALERT
          </span>
        ) : (
          <span style={{ backgroundColor: '#d97706', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> SUFFICIENT SUPPLY
          </span>
        )}
      </div>

      {/* Warning Banner if low stock */}
      {prediction.isLowStock && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecdd3', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span>{prediction.warningMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', backgroundColor: 'white', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fef3c7' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Current Stock</span>
          <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{medicine.stock} Tablets</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Daily Consumption</span>
          <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{prediction.dailyConsumption} / Day</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Depletion Date</span>
          <strong style={{ fontSize: '1.05rem', color: '#dc2626' }}>In {prediction.daysRemaining} Days</strong>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{prediction.depletionDateStr}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Recommended Refill</span>
          <strong style={{ fontSize: '1.05rem', color: '#d97706' }}>By {prediction.refillDateStr}</strong>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => onAddStock(medicine.id, 30)} className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add 30 Pills Manually
        </button>
        <button style={{ border: '1px solid #d97706', color: '#d97706', background: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={16} /> Order Refill Now
        </button>
      </div>
    </div>
  );
}
