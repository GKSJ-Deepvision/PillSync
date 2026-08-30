import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ShieldCheck, Pill } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px', margin: '20px auto 0', paddingBottom: '40px' }}>
      
      {/* Hero Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFF0F3', color: '#DC143C', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '14px' }}>
          <Pill size={16} /> PillSync Intelligent Platform
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2B181D', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Choose Your Access Role Category
        </h1>
        <p style={{ fontSize: '1rem', color: '#7E646A', margin: 0 }}>
          Select one of the 3 role categories below to enter your customized portal experience.
        </p>
      </div>

      {/* 3 Categories Cards */}
      <div className="role-cards-container">
        
        {/* Category 1: Patient */}
        <div className="role-card-item">
          <div className="role-card-header">
            <div className="role-card-icon-box">
              <User size={38} color="#DC143C" />
            </div>
          </div>
          <div className="role-card-body">
            <h3 className="role-card-title">Patient Portal</h3>
            <p className="role-card-subtitle">
              Manage daily dosage schedules, intake logs, 8am/1pm/8pm reminders & prescription OCR scanning.
            </p>
            <div className="role-card-badge">Patient Scope</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button 
                onClick={() => navigate('/login/patient')} 
                className="btn-coral-pay"
              >
                LOGIN AS PATIENT
              </button>
              <button 
                onClick={() => navigate('/patient')} 
                style={{ background: '#FFF0F3', border: '1px solid #FFD6DC', color: '#DC143C', padding: '8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Direct Access (/patient)
              </button>
            </div>
          </div>
        </div>

        {/* Category 2: Caregiver */}
        <div className="role-card-item">
          <div className="role-card-header" style={{ background: 'linear-gradient(135deg, #FF6B81 0%, #ED4264 100%)' }}>
            <div className="role-card-icon-box">
              <Users size={38} color="#ED4264" />
            </div>
          </div>
          <div className="role-card-body">
            <h3 className="role-card-title">Caregiver Portal</h3>
            <p className="role-card-subtitle">
              Monitor assigned patients, receive missed dose alerts, emergency call triggers & adherence logs.
            </p>
            <div className="role-card-badge" style={{ backgroundColor: '#FFF0F3', color: '#ED4264' }}>
              Multi-Patient Scope
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button 
                onClick={() => navigate('/login/caregiver')} 
                className="btn-coral-pay"
                style={{ background: 'linear-gradient(135deg, #FF6B81 0%, #ED4264 100%)' }}
              >
                LOGIN AS CAREGIVER
              </button>
              <button 
                onClick={() => navigate('/caregiver')} 
                style={{ background: '#FFF0F3', border: '1px solid #FFD6DC', color: '#ED4264', padding: '8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Direct Access (/caregiver)
              </button>
            </div>
          </div>
        </div>

        {/* Category 3: Admin */}
        <div className="role-card-item">
          <div className="role-card-header" style={{ background: 'linear-gradient(135deg, #2B181D 0%, #4A2830 100%)' }}>
            <div className="role-card-icon-box">
              <ShieldCheck size={38} color="#2B181D" />
            </div>
          </div>
          <div className="role-card-body">
            <h3 className="role-card-title">Admin Console</h3>
            <p className="role-card-subtitle">
              Manage platform user accounts, caregiver assignments, notification gateway rules & audit logs.
            </p>
            <div className="role-card-badge" style={{ backgroundColor: '#f1f5f9', color: '#2B181D' }}>
              System Admin Scope
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button 
                onClick={() => navigate('/login/admin')} 
                className="btn-coral-pay"
                style={{ background: 'linear-gradient(135deg, #2B181D 0%, #4A2830 100%)' }}
              >
                LOGIN AS ADMIN
              </button>
              <button 
                onClick={() => navigate('/admin')} 
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#2B181D', padding: '8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Direct Access (/admin)
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
