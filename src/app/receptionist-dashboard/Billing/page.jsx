'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  User,
  Clock,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  CreditCard,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  DollarSign,
  FileText,
  Percent,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '@/utils/api';
import toast, { Toaster } from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   Status Badge Helper
───────────────────────────────────────────────────────── */
function BillingStatusBadge({ status }) {
  const normStatus = (status || '').toLowerCase();
  switch (normStatus) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Paid
        </span>
      );
    case 'partially_paid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Partially Paid
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Pending
        </span>
      );
    case 'refunded':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Refunded
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
          {status || 'Unknown'}
        </span>
      );
  }
}

/* ─────────────────────────────────────────────────────────
   Printable Invoice Component
───────────────────────────────────────────────────────── */
const PrintableInvoice = ({ invoice, refProp }) => {
  if (!invoice) return null;
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <div ref={refProp} className="p-8 max-w-3xl mx-auto bg-white font-sans text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-blue-700 tracking-tight">INVOICE</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Invoice #{invoice.id}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 text-lg">ClinicPro Healthcare</p>
          <p className="text-xs text-slate-500">Medical OPD &amp; Diagnostic Center</p>
        </div>
      </div>

      {/* Bill To & Meta */}
      <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-slate-100">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
          <p className="font-bold text-slate-900 text-base">{invoice.client}</p>
          <p className="text-xs text-slate-500">Patient Code: {invoice.patientCode || 'N/A'}</p>
          {invoice.patientPhone && <p className="text-xs text-slate-500">Phone: {invoice.patientPhone}</p>}
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-slate-500">Date: <strong className="text-slate-800">{invoice.date}</strong></p>
          <p className="text-xs text-slate-500">Doctor: <strong className="text-slate-800">{invoice.doctorName || 'Attending Physician'}</strong></p>
          <div className="pt-1">
            <BillingStatusBadge status={invoice.rawStatus || invoice.status} />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left text-sm mb-6 border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
            <th className="py-2.5 px-3">Item Description</th>
            <th className="py-2.5 px-3">Type</th>
            <th className="py-2.5 px-3 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 px-3 font-medium text-slate-800">{item.description || item.name}</td>
              <td className="py-3 px-3 capitalize text-xs text-slate-500">{item.type || 'service'}</td>
              <td className="py-3 px-3 text-right font-bold text-slate-900">₹{Number(item.price || item.amount || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Financials */}
      <div className="border-t border-slate-200 pt-4 flex justify-end">
        <div className="w-72 space-y-2 text-right">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span>₹{Number(invoice.totalAmount || invoice.amount).toFixed(2)}</span>
          </div>
          {Number(invoice.discount || 0) > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount:</span>
              <span>-₹{Number(invoice.discount).toFixed(2)}</span>
            </div>
          )}
          {Number(invoice.tax || 0) > 0 && (
            <div className="flex justify-between text-xs text-slate-600">
              <span>Tax:</span>
              <span>+₹{Number(invoice.tax).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Payable:</span>
            <span>₹{Number(invoice.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-700">
            <span>Amount Paid:</span>
            <span className="font-semibold text-emerald-600">₹{Number(invoice.paidAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-blue-700 pt-1 border-t border-slate-100">
            <span>Balance Due:</span>
            <span>₹{Number(invoice.remainingAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Billing & Invoices Component
───────────────────────────────────────────────────────── */
export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Payment Form States
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'partial'
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const printRef = useRef(null);

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/billing/list?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch bills (${res.status})`);
      }

      const response = await res.json();
      if (response.success && Array.isArray(response.data?.bills)) {
        const mappedBills = response.data.bills.map(bill => {
          const patientObj = bill.patients || (typeof bill.patientId === 'object' ? bill.patientId : null);
          const doctorObj = bill.doctors || (typeof bill.doctorId === 'object' ? bill.doctorId : null);

          const clientName = patientObj 
            ? `${patientObj.first_name || patientObj.firstName || ''} ${patientObj.last_name || patientObj.lastName || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient';

          const docName = doctorObj
            ? `Dr. ${doctorObj.first_name || doctorObj.firstName || ''} ${doctorObj.last_name || doctorObj.lastName || ''}`.trim()
            : 'Not assigned';

          const finalAmt = Number(bill.final_amount ?? bill.finalAmount ?? 0);
          const paidAmt = Number(bill.paid_amount ?? bill.paidAmount ?? 0);
          const remAmt = Number(bill.remaining_amount ?? bill.remainingAmount ?? Math.max(0, finalAmt - paidAmt));

          return {
            id: bill.billing_id || bill.billingId || `INV-${bill.id?.slice(0, 6)}`,
            _id: bill.id || bill._id,
            client: clientName,
            patientCode: patientObj?.patient_code || patientObj?.patientCode || 'N/A',
            patientPhone: patientObj?.phone_number || patientObj?.phoneNumber || '',
            doctorName: docName,
            date: bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '—',
            dueDate: bill.created_at ? new Date(new Date(bill.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : '—',
            amount: finalAmt,
            totalAmount: Number(bill.total_amount ?? bill.totalAmount ?? finalAmt),
            paidAmount: paidAmt,
            remainingAmount: remAmt,
            discount: Number(bill.discount || 0),
            tax: Number(bill.tax || 0),
            rawStatus: bill.status,
            status: bill.status === 'partially_paid' ? 'Partially Paid' : (bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'Pending'),
            paymentMethod: bill.payment_method || bill.paymentMethod || 'cash',
            paidAt: bill.paid_at || bill.paidAt || null,
            diagnosis: bill.diagnosis || bill.visitId?.diagnosis || '',
            followUpDate: bill.followUpDate || bill.visitId?.followUpDate || '',
            items: Array.isArray(bill.items) ? bill.items.map(item => ({
              description: item.name || item.description || 'Medical Service',
              quantity: item.quantity || 1,
              price: Number(item.amount || item.price || 0),
              type: item.type || 'service'
            })) : []
          };
        });

        setInvoices(mappedBills);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err.message || 'Error loading billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `@page { size: auto; margin: 10mm; }`,
    onBeforePrint: () => setIsPrintModalOpen(false)
  });

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMode('full');
    setPaymentAmountInput(Number(invoice.remainingAmount || 0).toFixed(2));
    setPaymentMethod('cash');
    setTransactionId('');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const closeAllModals = () => {
    setIsDetailsModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsPrintModalOpen(false);
    setSelectedInvoice(null);
    setPaymentError('');
  };

  // Submit payment handler (Full or Partial)
  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setPaymentError('');

    const targetAmount = paymentMode === 'full' 
      ? Number(selectedInvoice.remainingAmount) 
      : Number(paymentAmountInput);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    if (targetAmount > selectedInvoice.remainingAmount) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ₹${selectedInvoice.remainingAmount.toFixed(2)}.`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/payment/${selectedInvoice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentAmount: targetAmount,
          paymentMethod: paymentMethod,
          ...(transactionId.trim() && { transactionId: transactionId.trim() })
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment processing failed');
      }

      toast.success(
        targetAmount >= selectedInvoice.remainingAmount 
          ? 'Invoice fully paid successfully!' 
          : `Partial payment of ₹${targetAmount.toFixed(2)} recorded!`
      );
      
      closeAllModals();
      fetchBills();
    } catch (err) {
      setPaymentError(err.message || 'Failed to process payment');
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        (invoice.patientCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const normStatus = (invoice.rawStatus || invoice.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || normStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalCollected = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalOutstanding = invoices.reduce((s, i) => s + (Number(i.remainingAmount) || 0), 0);

    const counts = {
      all: invoices.length,
      pending: invoices.filter(i => (i.rawStatus || '').toLowerCase() === 'pending').length,
      partially_paid: invoices.filter(i => (i.rawStatus || '').toLowerCase() === 'partially_paid').length,
      paid: invoices.filter(i => (i.rawStatus || '').toLowerCase() === 'paid').length,
      refunded: invoices.filter(i => (i.rawStatus || '').toLowerCase() === 'refunded').length,
    };

    return { totalInvoiced, totalCollected, totalOutstanding, counts };
  }, [invoices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      {/* 1. Header Card (Matching Lab Orders) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Receipt className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Financial Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing &amp; Invoices</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage patient invoices, collect full or partial payments, and monitor clinic revenue.
          </p>
        </div>

        <button
          onClick={fetchBills}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          title="Refresh Invoices"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Financial Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{stats.totalInvoiced.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.counts.all} total invoice records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalCollected.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.counts.paid} fully settled invoices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-black text-amber-600 mt-1">₹{stats.totalOutstanding.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.counts.pending + stats.counts.partially_paid} pending or partial invoices</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar (Matching Lab Orders) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-billing"
              type="text"
              placeholder="Search by Invoice #, Patient Name, or Patient Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Invoices</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {stats.counts.all}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Pending</span>
              {stats.counts.pending > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 font-bold">
                  {stats.counts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('partially_paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'partially_paid'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Partially Paid</span>
              {stats.counts.partially_paid > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
                  {stats.counts.partially_paid}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Paid</span>
              {stats.counts.paid > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {stats.counts.paid}
                </span>
              )}
            </button>

            {stats.counts.refunded > 0 && (
              <button
                onClick={() => setStatusFilter('refunded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'refunded'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>Refunded</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-bold">
                  {stats.counts.refunded}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Invoices Table (Matching Lab Orders) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading invoices &amp; billing records...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Error Loading Invoices</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchBills}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No invoices found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No invoices match your filter criteria. Try clearing search filters.'
                : 'No invoices have been generated for completed clinical visits yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Invoice # &amp; Date</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Attending Doctor</th>
                  <th className="py-3.5 px-4">Total &amp; Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const hasOutstanding = invoice.remainingAmount > 0 && invoice.rawStatus !== 'cancelled';

                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => openInvoiceModal(invoice)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Invoice # & Date */}
                      <td className="py-4 px-4 sm:px-6 font-medium">
                        <div>
                          <p className="font-bold text-blue-700 text-sm">{invoice.id}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {invoice.date}
                          </p>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{invoice.client}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              {invoice.patientCode || 'N/A'}
                            </span>
                            {invoice.patientPhone && (
                              <span className="text-xs text-slate-500">{invoice.patientPhone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-700">
                        {invoice.doctorName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      {/* Total & Paid */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">₹{invoice.amount.toFixed(2)}</p>
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                            Paid: ₹{invoice.paidAmount.toFixed(2)}
                          </p>
                        </div>
                      </td>

                      {/* Balance Due */}
                      <td className="py-4 px-4">
                        <span className={`text-sm font-bold ${hasOutstanding ? 'text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block' : 'text-slate-400'}`}>
                          ₹{invoice.remainingAmount.toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <BillingStatusBadge status={invoice.rawStatus || invoice.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasOutstanding && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openPaymentModal(invoice); }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Collect</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); openInvoiceModal(invoice); }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Invoice Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); setIsPrintModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────
         Modal: Record Payment (Full or Partial)
      ───────────────────────────────────────────────────────── */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Payment
              </h2>
              <button
                onClick={closeAllModals}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invoice Context Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Invoice:</span>
                <span className="font-bold text-blue-700">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Patient:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.client}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                <span className="text-slate-500">Total Invoice:</span>
                <span className="font-bold text-slate-800">₹{selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Already Paid:</span>
                <span className="font-bold text-emerald-600">₹{selectedInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-amber-700 border-t border-slate-200 pt-1">
                <span>Remaining Balance:</span>
                <span>₹{selectedInvoice.remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('full');
                      setPaymentAmountInput(selectedInvoice.remainingAmount.toFixed(2));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      paymentMode === 'full'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Full Balance (₹{selectedInvoice.remainingAmount.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('partial');
                      setPaymentAmountInput('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      paymentMode === 'partial'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Partial Amount
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.remainingAmount}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  disabled={paymentMode === 'full'}
                  placeholder="Enter payment amount..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors disabled:opacity-75"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="online">Online Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Transaction ID / Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Reference / Transaction ID <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI Ref / Receipt # / Bank Auth"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* Summary of Impact */}
              {Number(paymentAmountInput) > 0 && (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-xs text-emerald-800">
                  Remaining balance after this payment: <strong>₹{Math.max(0, selectedInvoice.remainingAmount - Number(paymentAmountInput)).toFixed(2)}</strong>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Confirm & Collect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
         Modal: Invoice Details
      ───────────────────────────────────────────────────────── */}
      {isDetailsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Invoice Details — {selectedInvoice.id}</h2>
              </div>
              <button
                onClick={closeAllModals}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Patient & Doctor Banner */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoice.client}</p>
                  <p className="text-xs text-slate-500">ID: {selectedInvoice.patientCode} • {selectedInvoice.patientPhone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Physician &amp; Date</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedInvoice.doctorName}</p>
                  <p className="text-xs text-slate-500">{selectedInvoice.date}</p>
                </div>
              </div>

              {/* Status and Summary Strip */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div>
                  <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Payment Status</p>
                  <div className="mt-1">
                    <BillingStatusBadge status={selectedInvoice.rawStatus || selectedInvoice.status} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</p>
                  <p className="text-lg font-black text-amber-700">₹{selectedInvoice.remainingAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed Items &amp; Services</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Service / Item</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                            <td className="py-2.5 px-3 capitalize text-slate-500">{item.type}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{item.price.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-3 px-3 text-center text-slate-400 italic">No breakdown items available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-₹{selectedInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax:</span>
                      <span>+₹{selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Final Amount:</span>
                    <span>₹{selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-600">
                    <span>Total Paid:</span>
                    <span>₹{selectedInvoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-amber-700 pt-1 border-t border-slate-100">
                    <span>Remaining Due:</span>
                    <span>₹{selectedInvoice.remainingAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              {selectedInvoice.remainingAmount > 0 && selectedInvoice.rawStatus !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openPaymentModal(selectedInvoice);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
         Modal: Print Preview
      ───────────────────────────────────────────────────────── */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Print Preview
              </h2>
              <button
                onClick={closeAllModals}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50">
              <PrintableInvoice invoice={selectedInvoice} refProp={printRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Confirm &amp; Print</span>
              </button>
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for print target */}
      <div style={{ display: 'none' }}>
        <PrintableInvoice invoice={selectedInvoice} refProp={printRef} />
      </div>
    </div>
  );
}
