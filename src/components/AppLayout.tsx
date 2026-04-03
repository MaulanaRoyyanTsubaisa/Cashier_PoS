import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Warehouse, FileText, Menu, X, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Produk', path: '/products', icon: Package },
  { label: 'Kasir', path: '/pos', icon: ShoppingCart },
  { label: 'Inventori', path: '/inventory', icon: Warehouse },
  { label: 'Laporan', path: '/reports', icon: FileText },
  { label: 'Pengaturan', path: '/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:static z-40 h-full w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <ShoppingCart className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-primary-foreground">KasirKu</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto pos-scrollbar">
          {navItems.map(item => {
            const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-sidebar-accent text-sidebar-primary' : 'hover:bg-sidebar-accent/60 text-sidebar-foreground'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 w-full">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-base font-semibold">{navItems.find(i => i.path === pathname || (i.path !== '/' && pathname.startsWith(i.path)))?.label ?? 'KasirKu'}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
