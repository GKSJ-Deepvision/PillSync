import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';
import { Menu, Shield } from 'lucide-react';
import { PillSyncIcon } from '../common';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import './Layout.css';

export function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const userRole = (user?.role || 'patient').toLowerCase();
  const homePortalPath =
    userRole === 'caregiver'
      ? '/caregiver/portal'
      : userRole === 'admin'
        ? '/admin/portal'
        : '/patient/portal';

  return (
    <div className="layout-shell">
      {/* Mobile Top Header (< 768px only) */}
      <header className="mobile-top-bar">
        <Link to={homePortalPath} className="mobile-top-brand">
          <div className="mobile-top-logo">
            <PillSyncIcon className="h-4 w-4 text-white" />
          </div>
          <span className="mobile-top-title">PillSync</span>
        </Link>

        <div className="mobile-top-actions">
          <span className="mobile-top-role-badge">
            <Shield className="h-3 w-3" />
            {userRole}
          </span>
          <button
            type="button"
            className="mobile-top-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Floating Desktop Sidebar / Slide-out Mobile Drawer */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="layout-main-wrapper">
        <main className="layout-content-scroll">
          <div className="layout-container">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (< 768px only) */}
      <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}

export { Sidebar } from './Sidebar';
export { MobileNav } from './MobileNav';
