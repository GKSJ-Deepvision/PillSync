import React, { useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AppRoutes from './routes/AppRoutes';
import ReminderModal from './pages/patient/ReminderModal';
import './App.css';

function MainLayout() {
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState('patient');
  const [currentUser, setCurrentUser] = useState(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const isPublicAuthPage = ['/', '/login', '/login/patient', '/login/caregiver', '/login/admin', '/register', '/register/patient', '/register/caregiver', '/forgot-password'].includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcf8f9', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        currentUser={currentUser} 
        currentRole={currentRole} 
        setRole={setCurrentRole} 
      />
      
      <div style={{ display: 'flex', flex: 1 }}>
        {!isPublicAuthPage && (
          <Sidebar currentRole={currentRole} />
        )}

        <main style={{ flex: 1, padding: '24px', maxWidth: isPublicAuthPage ? '100%' : '1200px', margin: isPublicAuthPage ? '0 auto' : '0', width: '100%' }}>
          {!isPublicAuthPage && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsReminderOpen(true)}
                style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#DC143C', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
              >
                🔔 Demo: Test Medication Reminder Modal
              </button>
            </div>
          )}

          <AppRoutes 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            setCurrentRole={setCurrentRole} 
          />
        </main>
      </div>

      <ReminderModal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;
