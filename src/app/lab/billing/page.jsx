'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Building,
  ArrowUpRight,
  Eye,
  X,
  Receipt,
  Check,
  ChevronRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ModalPortal from '@/components/ModalPortal';
import { hasLabPermission, LAB_PERMISSIONS } from '@/constants/labRoles';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function LabBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    total_revenue: 0,
    paid_amount: 0,
    pending_amount: 0,
    total_invoices: 0,
    status_counts: { all: 0, issued: 0, partially_paid: 0, paid: 0, draft: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Eligible orders state for invoice creation
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [discountVal, setDiscountVal] = useState(0);
  const [taxVal, setTaxVal] = useState(0);
  const [dueDateVal, setDueDateVal] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Current user info
  const [currentUser, setCurrentUser] = useState(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const canManageBilling = useMemo(() => {
    if (!currentUser) return false;
    return hasLabPermission(currentUser, LAB_PERMISSIONS.MANAGE_BILLING);
  }, [currentUser]);

  // Fetch billing summary & invoices
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // 1. Fetch summary metrics
      try {
        const sumRes = await axios.get(`${API_BASE_URL}/api/v1/lab/billing/summary`, { headers });
        if (sumRes.data?.data) {
          setSummary(sumRes.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch billing summary:', err.message);
      }

      // 2. Fetch invoice list
      let invRes;
      try {
        invRes = await axios.get(
          `${API_BASE_URL}/api/v1/lab/billing/invoices?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`,
          { headers }
        );
      } catch (e) {
        invRes = await axios.get(
          `/api/v1/lab/billing/invoices?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`,
          { headers }
        );
      }

      const fetchedInvoices = invRes.data?.data?.invoices || [];
      setInvoices(fetchedInvoices);
    } catch (err) {
      console.error('Error loading billing data:', err);
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Fetch eligible orders when opening Create modal
  const handleOpenCreateModal = async () => {
    try {
      setIsCreateOpen(true);
      setLoadingOrders(true);
      setSelectedOrder(null);
      setDiscountVal(0);
      setTaxVal(0);
      setDueDateVal('');
      setInvoiceNotes('');

      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/billing/eligible-orders`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/billing/eligible-orders`, { headers });
      }

      const orders = res.data?.data?.orders || [];
      setEligibleOrders(orders);
    } catch (err) {
      console.error('Error fetching eligible orders:', err);
      toast.error('Failed to fetch eligible laboratory orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Create invoice submit
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error('Please select an order to generate an invoice');
      return;
    }

    try {
      setCreatingInvoice(true);
      const headers = getAuthHeaders();
      const payload = {
        order_id: selectedOrder.id,
        discount: Number(discountVal || 0),
        tax: Number(taxVal || 0),
        due_date: dueDateVal || null,
        notes: invoiceNotes.trim()
      };

      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/billing/invoices`, payload, { headers });
      } catch (e) {
        res = await axios.post(`/api/v1/lab/billing/invoices`, payload, { headers });
      }

      toast.success(`Invoice ${res.data?.data?.invoice?.invoice_number || ''} generated successfully!`);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // View details
  const handleOpenDetails = async (invoice) => {
    try {
      setSelectedInvoice(invoice);
      setIsDetailOpen(true);

      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/billing/invoices/${invoice.id}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/billing/invoices/${invoice.id}`, { headers });
      }

      if (res.data?.data?.invoice) {
        setSelectedInvoice(res.data.data.invoice);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const balance = Number(invoice.balance_amount || 0);
    setPaymentAmount(balance > 0 ? balance.toFixed(2) : '');
    setPaymentMethod('upi');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentError('');
    setIsPaymentOpen(true);
  };

  // Validate and submit payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    const numAmt = Number(paymentAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setPaymentError('Payment amount must be greater than zero');
      return;
    }

    const currentBalance = Number(selectedInvoice?.balance_amount || 0);
    if (numAmt > currentBalance) {
      setPaymentError(`Amount cannot exceed the balance due of ₹${currentBalance.toFixed(2)}`);
      return;
    }

    try {
      setSubmittingPayment(true);
      const headers = getAuthHeaders();
      const payload = {
        amount: numAmt,
        payment_method: paymentMethod,
        transaction_reference: paymentReference.trim(),
        notes: paymentNotes.trim()
      };

      let res;
      try {
        res = await axios.post(
          `${API_BASE_URL}/api/v1/lab/billing/invoices/${selectedInvoice.id}/payments`,
          payload,
          { headers }
        );
      } catch (e) {
        res = await axios.post(
          `/api/v1/lab/billing/invoices/${selectedInvoice.id}/payments`,
          payload,
          { headers }
        );
      }

      toast.success(`Payment of ₹${numAmt.toFixed(2)} recorded successfully!`);
      setIsPaymentOpen(false);

      if (isDetailOpen && res.data?.data?.invoice) {
        setSelectedInvoice(res.data.data.invoice);
      }
      fetchData();
    } catch (err) {
      console.error('Error recording payment:', err);
      const msg = err.response?.data?.message || 'Failed to record payment';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // PDF Download handler
  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      toast.loading('Generating official PDF invoice...', { id: 'pdf-dl' });
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/billing/invoices/${invoiceId}/pdf`, {
          headers,
          responseType: 'blob'
        });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/billing/invoices/${invoiceId}/pdf`, {
          headers,
          responseType: 'blob'
        });
      }

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice PDF downloaded successfully', { id: 'pdf-dl' });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate invoice PDF', { id: 'pdf-dl' });
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Partially Paid
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3 h-3 text-blue-600" /> Payment Due
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Laboratory Billing & Invoicing
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Generate tax invoices from laboratory orders, track settlements, and record payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageBilling && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{Number(summary.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all active non-cancelled invoices</p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Settled Amount
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            ₹{Number(summary.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total payments collected & verified</p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            ₹{Number(summary.pending_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Outstanding patient / client balances</p>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoices
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_invoices || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.status_counts?.paid || 0} paid • {summary.status_counts?.partially_paid || 0} partial • {summary.status_counts?.issued || 0} due
          </p>
        </div>
      </div>

      {/* Main Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Search & Status Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Invoices' },
              { id: 'issued', label: 'Payment Due' },
              { id: 'partially_paid', label: 'Partially Paid' },
              { id: 'paid', label: 'Fully Paid' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => {
              const count = summary.status_counts?.[tab.id] ?? 0;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                  {count > 0 && tab.id !== 'all' && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice, order, or patient..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading laboratory billing records...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">No Invoices Found</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? `No billing records match "${searchTerm}". Try another search term.`
                  : 'No invoices match the selected filter. Click "Generate Invoice" to bill an order.'}
              </p>
              {canManageBilling && (
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Generate First Invoice
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Invoice / Date</th>
                  <th className="py-3 px-4">Patient / MRN</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isFullyPaid = inv.status === 'paid' || Number(inv.balance_amount || 0) <= 0;
                  const isCancelled = inv.status === 'cancelled';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenDetails(inv)}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 text-left"
                        >
                          {inv.invoice_number}
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{inv.patient_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                            {inv.patient_code || 'N/A'}
                          </span>
                          {inv.patient_phone && <span>• {inv.patient_phone}</span>}
                        </div>
                      </td>

                      {/* Order Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {inv.order_number}
                        </span>
                        {inv.clinic_name && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]" title={inv.clinic_name}>
                            {inv.clinic_name}
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{Number(inv.total_amount || 0).toFixed(2)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        ₹{Number(inv.paid_amount || 0).toFixed(2)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={Number(inv.balance_amount || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          ₹{Number(inv.balance_amount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(inv)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canManageBilling && !isFullyPaid && !isCancelled && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                              title="Record Payment"
                            >
                              <DollarSign className="w-3 h-3" /> Pay
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Invoice from Eligible Lab Order */}
      <ModalPortal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full my-auto flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Generate Laboratory Invoice</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreateInvoiceSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Order Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Select Unbilled Laboratory Order <span className="text-red-500">*</span>
                </label>
                {loadingOrders ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                    Fetching eligible orders...
                  </div>
                ) : eligibleOrders.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                    <Info className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    All active laboratory orders have already been invoiced!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {eligibleOrders.map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      const patName = `${ord.patient?.first_name || ''} ${ord.patient?.last_name || ''}`.trim() || 'Patient';

                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs">{ord.order_number}</span>
                              <span className="text-[11px] font-semibold text-slate-800">• {patName}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                {ord.patient?.patient_code || 'N/A'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {ord.items?.length || 0} test item(s) • Order Date:{' '}
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-indigo-700">
                              ₹{Number(ord.total_amount || 0).toFixed(2)}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 ml-auto mt-0.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Items Preview */}
              {selectedOrder && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Included Test Line Items</span>
                    <span className="text-[11px] text-slate-400 font-mono">Order: {selectedOrder.order_number}</span>
                  </div>

                  <div className="divide-y divide-slate-200/70 border-t border-b border-slate-200">
                    {(selectedOrder.items || []).map((itm, i) => (
                      <div key={itm.id || i} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-800">
                            {itm.item_name || itm.test_name || itm.package_name || 'Test Item'}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {itm.item_code || 'CODE'}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700">
                          ₹{Number(itm.price || itm.package_price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Adjustment: Discount & Tax */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                        Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                        Tax / GST Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxVal}
                        onChange={(e) => setTaxVal(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Computed Net Total */}
                  <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950 font-bold">
                    <span>Net Invoice Total:</span>
                    <span className="text-base text-indigo-700">
                      ₹{Math.max(
                        0,
                        Number(selectedOrder.total_amount || 0) - Number(discountVal || 0) + Number(taxVal || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice Notes / Remarks</label>
                <textarea
                  rows="2"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Optional terms, payment instructions, or patient notes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOrder || creatingInvoice}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingInvoice && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* MODAL 2: Comprehensive Invoice Details */}
      {isDetailOpen && selectedInvoice && (
        <ModalPortal isOpen={Boolean(isDetailOpen && selectedInvoice)} onClose={() => setIsDetailOpen(false)}>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full my-auto flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedInvoice.invoice_number}</span>
                    {getStatusBadge(selectedInvoice.status)}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Issued on {new Date(selectedInvoice.issued_at || selectedInvoice.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Patient & Order Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Billed To (Patient)
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoice.patient_name}</div>
                  <div className="text-slate-600 mt-0.5">
                    MRN: <span className="font-mono">{selectedInvoice.patient_code || 'N/A'}</span>
                    {selectedInvoice.patient_gender && ` • ${selectedInvoice.patient_gender}`}
                  </div>
                  {selectedInvoice.patient_phone && (
                    <div className="text-slate-500 mt-0.5">Phone: {selectedInvoice.patient_phone}</div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Order Reference & Referral
                  </span>
                  <div className="font-mono font-bold text-slate-800">
                    Order: {selectedInvoice.order_number}
                  </div>
                  {selectedInvoice.clinic_name && (
                    <div className="text-slate-600 mt-0.5">Clinic: {selectedInvoice.clinic_name}</div>
                  )}
                  {selectedInvoice.doctor_name && (
                    <div className="text-slate-600 mt-0.5">Doctor: {selectedInvoice.doctor_name}</div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">Itemized Diagnostic Services</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Service / Test Description</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedInvoice.items || []).map((itm, idx) => (
                        <tr key={itm.id || idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {itm.item_name || 'Laboratory Test'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {itm.item_code || 'LAB'}
                          </td>
                          <td className="py-2.5 px-3 text-center">{itm.quantity || 1}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ₹{Number(itm.unit_price || itm.price || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            ₹{Number(itm.total_price || itm.unit_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown & Summary Box */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">
                      ₹{Number(selectedInvoice.subtotal || selectedInvoice.total_amount).toFixed(2)}
                    </span>
                  </div>

                  {Number(selectedInvoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">- ₹{Number(selectedInvoice.discount).toFixed(2)}</span>
                    </div>
                  )}

                  {Number(selectedInvoice.tax || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST:</span>
                      <span className="font-mono">+ ₹{Number(selectedInvoice.tax).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-sm text-indigo-700">
                      ₹{Number(selectedInvoice.total_amount || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Amount Paid:</span>
                    <span className="font-mono">₹{Number(selectedInvoice.paid_amount || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹{Number(selectedInvoice.balance_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Receipts History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs">Payment Receipts Log</h4>
                  {canManageBilling &&
                    selectedInvoice.status !== 'paid' &&
                    selectedInvoice.status !== 'cancelled' && (
                      <button
                        onClick={() => handleOpenPaymentModal(selectedInvoice)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    )}
                </div>

                {Array.isArray(selectedInvoice.payments) && selectedInvoice.payments.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Receipt / Ref #</th>
                          <th className="py-2.5 px-3">Payment Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">
                              {p.payment_number}
                              {p.transaction_reference && (
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  Ref: {p.transaction_reference}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {new Date(p.payment_date).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-slate-700 font-semibold">
                              {p.payment_method}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                              ₹{Number(p.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    No payment transactions recorded for this invoice yet.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </button>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* MODAL 3: Record Payment */}
      {isPaymentOpen && selectedInvoice && (
        <ModalPortal isOpen={Boolean(isPaymentOpen && selectedInvoice)} onClose={() => setIsPaymentOpen(false)}>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full my-auto flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Record Invoice Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Invoice Summary Pill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient:</span>
                  <span className="font-semibold text-slate-800">{selectedInvoice.patient_name}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₹{Number(selectedInvoice.balance_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedInvoice.balance_amount || 0)}
                  required
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    setPaymentError('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Support full or partial settlement. Max allowed: ₹
                  {Number(selectedInvoice.balance_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'card', label: 'Card' },
                    { id: 'bank_transfer', label: 'Bank' },
                    { id: 'cheque', label: 'Cheque' },
                    { id: 'other', label: 'Other' }
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Transaction / Reference ID (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI-REF-98124802"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid at laboratory reception desk"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Inline Error */}
              {paymentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-1.5 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !paymentAmount}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingPayment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
