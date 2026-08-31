import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function Layout({ children }) {
  return (
    <div className="dashboard-shell flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-10">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export { Navbar } from './Navbar';
export { Sidebar } from './Sidebar';
export { MobileNav } from './MobileNav';
