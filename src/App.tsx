import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import BusinessProfilePage from './pages/BusinessProfile';
import Settings from './pages/Settings';
import { FileText, Building2, Settings2, LayoutDashboard, Menu, X } from 'lucide-react';

type Page = 'dashboard' | 'create' | 'edit' | 'profile' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [editId, setEditId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = (p: Page) => {
    setPage(p);
    setMobileMenuOpen(false);
  };

  const handleCreateNew = () => {
    setEditId(null);
    setPage('create');
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setPage('edit');
  };

  const handleBack = () => {
    setEditId(null);
    setPage('dashboard');
  };

  // Full screen pages (no sidebar)
  if (page === 'create' || page === 'edit') {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <CreateInvoice editId={editId} onBack={handleBack} />
      </>
    );
  }

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as Page, label: 'Business Profile', icon: Building2 },
    { id: 'settings' as Page, label: 'Settings', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">InvoiceGen</div>
            <div className="text-xs text-gray-400">Invoice Generator</div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                page === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">All data stored locally</p>
          <p className="text-xs text-gray-400">No backend · No login</p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1 text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">InvoiceGen</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <Dashboard onCreateNew={handleCreateNew} onEdit={handleEdit} />}
          {page === 'profile' && <BusinessProfilePage />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
