import React, { useState, useEffect, useCallback } from 'react';
import { Invoice } from '../types/invoice';
import { getInvoices, deleteInvoice, duplicateInvoice, generateInvoiceNumber, saveInvoice } from '../services/storageService';
import { formatCurrencySymbol } from '../utils/currency';
import { generatePDFFromElement } from '../services/pdfService';
import InvoicePreview from '../components/InvoicePreview/InvoicePreview';
import toast from 'react-hot-toast';
import {
  PlusCircle, Search, Edit2, Copy, Trash2, Download, Printer,
  FileText, Calendar, User, Hash, TrendingUp,
  AlertTriangle, CheckCircle, Clock, BarChart2
} from 'lucide-react';

interface DashboardProps {
  onCreateNew: () => void;
  onEdit: (id: string) => void;
}

type SortField = 'date' | 'number' | 'customer' | 'total';
type SortDir = 'asc' | 'desc';

const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onEdit }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadInvoices = useCallback(() => {
    setInvoices(getInvoices());
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase();
      const matchesSearch = (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.business.name.toLowerCase().includes(q)
      );
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      } else if (sortField === 'number') {
        cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
      } else if (sortField === 'customer') {
        cmp = a.customer.name.localeCompare(b.customer.name);
      } else if (sortField === 'total') {
        cmp = a.totals.grandTotal - b.totals.grandTotal;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteInvoice(deleteConfirm);
    loadInvoices();
    setDeleteConfirm(null);
    toast.success('Invoice deleted');
  };

  const handleDuplicate = (id: string) => {
    const newNum = generateInvoiceNumber();
    const dup = duplicateInvoice(id, newNum);
    if (dup) {
      loadInvoices();
      toast.success(`Duplicated as ${newNum}`);
    }
  };

  const handleMarkPaid = (invoice: Invoice) => {
    const updated = { ...invoice, status: 'paid' as const, updatedAt: new Date().toISOString() };
    saveInvoice(updated);
    loadInvoices();
    toast.success('Marked as paid');
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    setGeneratingPdf(invoice.id);
    setPdfInvoice(invoice);
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      const el = document.getElementById('dashboard-pdf-render');
      if (!el) throw new Error('Render area not found');
      const inner = el.querySelector('#invoice-preview-content') as HTMLElement;
      await generatePDFFromElement(inner || el, `${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) {
      toast.error('PDF generation failed');
      console.error(e);
    } finally {
      setGeneratingPdf(null);
      setPdfInvoice(null);
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setPdfInvoice(invoice);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPdfInvoice(null), 2000);
    }, 300);
  };

  // Stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totals.grandTotal, 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const draftCount = invoices.filter(i => i.status === 'draft').length;

  const statusConfig = {
    paid: { label: 'Paid', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    draft: { label: 'Draft', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    saved: { label: 'Sent', cls: 'bg-blue-100 text-blue-700', icon: FileText },
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-gray-400">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your invoices</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Revenue', value: formatCurrencySymbol(totalRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Paid', value: paidCount, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Drafts', value: draftCount, icon: BarChart2, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'saved', 'paid', 'draft'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s === 'saved' ? 'Sent' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {search || filterStatus !== 'all' ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-gray-400 mb-4 text-sm">
            {search || filterStatus !== 'all'
              ? 'Try changing your search or filter'
              : 'Create your first invoice to get started'}
          </p>
          {!search && filterStatus === 'all' && (
            <button
              onClick={onCreateNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Create New Invoice
            </button>
          )}
        </div>
      )}

      {/* Invoice Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 whitespace-nowrap"
                    onClick={() => handleSort('number')}>
                    <div className="flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1" />Invoice # <SortIcon field="number" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800"
                    onClick={() => handleSort('customer')}>
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1" />Customer <SortIcon field="customer" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 whitespace-nowrap"
                    onClick={() => handleSort('date')}>
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />Date <SortIcon field="date" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 whitespace-nowrap"
                    onClick={() => handleSort('total')}>
                    <div className="flex items-center">
                      Total <SortIcon field="total" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(inv => {
                  const sc = statusConfig[inv.status] || statusConfig.saved;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-indigo-700 text-xs">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]">
                          {inv.customer.name || <span className="text-gray-400 italic">No customer</span>}
                        </div>
                        {inv.customer.city && (
                          <div className="text-xs text-gray-400">{inv.customer.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {inv.invoiceDate
                          ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrencySymbol(inv.totals.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                          <sc.icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(inv.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(inv.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            disabled={generatingPdf === inv.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {generatingPdf === inv.id ? (
                              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handlePrint(inv)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Invoice</h3>
                <p className="text-sm text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to permanently delete this invoice?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF render area */}
      {pdfInvoice && (
        <div
          id="dashboard-pdf-render"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '0',
            width: '794px',
            zIndex: -1,
            background: 'white',
          }}
          className="print:fixed print:top-0 print:left-0 print:z-[9999] print:w-full"
        >
          <InvoicePreview invoice={pdfInvoice} forPrint />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
