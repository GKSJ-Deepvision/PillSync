import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import './Layout.css';

export function Layout({ children }) {
  return (
    <div className="layout-shell">
      <Sidebar />
      <div className="layout-main-wrapper">
        <main className="layout-content-scroll">
          <div className="layout-container">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export { Sidebar } from './Sidebar';
export { MobileNav } from './MobileNav';
