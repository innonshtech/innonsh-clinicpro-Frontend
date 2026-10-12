'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ModalPortal from '@/components/ModalPortal';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  X,
  Filter,
  RefreshCw,
  AlertCircle,
  User,
  UserCheck,
  Building2,
  Stethoscope,
  Calendar,
  Package,
  FileText,
  DollarSign,
  TestTube
} from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

const PRIORITY_RANK = {
  critical: 3,
  stat: 3,
  urgent: 2,
  routine: 1
};

export const getPriorityRank = (p) => PRIORITY_RANK[(p || 'routine').toLowerCase()] || 1;

export const getPriorityBadge = (priority) => {
  const p = (priority || 'routine').toLowerCase();
  switch (p) {
    case 'critical':
    case 'stat':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
          Critical / STAT
        </span>
      );
    case 'urgent':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Urgent
        </span>
      );
    case 'routine':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Routine
        </span>
      );
  }
};

export default function LabOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [actionOrder, setActionOrder] = useState(null); // { order, action: 'accept' | 'reject' }
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/orders`, { headers });
      } catch (beErr) {
        res = await axios.get('/api/v1/lab/orders', { headers });
      }

      const fetched = res.data?.data?.orders || res.data?.orders || [];
      setOrders(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching lab orders:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load lab orders';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      // Status filter
      if (statusFilter !== 'all' && (o.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const num = (o.order_number || '').toLowerCase();
        const pName = `${o.patient?.first_name || ''} ${o.patient?.last_name || ''}`.toLowerCase();
        const docName = `${o.doctor?.first_name || ''} ${o.doctor?.last_name || ''}`.toLowerCase();
        const recName = `${o.receptionist?.first_name || ''} ${o.receptionist?.last_name || ''}`.toLowerCase();
        const clinicName = (o.clinic?.clinic_name || '').toLowerCase();
        const role = (o.ordering_type || '').toLowerCase();
        const prio = (o.priority || 'routine').toLowerCase();
        if (
          !num.includes(q) &&
          !pName.includes(q) &&
          !docName.includes(q) &&
          !recName.includes(q) &&
          !clinicName.includes(q) &&
          !role.includes(q) &&
          !prio.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const rankDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, statusFilter, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length;
    const accepted = orders.filter((o) => (o.status || '').toLowerCase() === 'accepted').length;
    const rejected = orders.filter((o) => (o.status || '').toLowerCase() === 'rejected').length;
    return { total, pending, accepted, rejected };
  }, [orders]);

  // Handle Accept or Reject
  const handleConfirmAction = async () => {
    if (!actionOrder) return;
    const { order, action } = actionOrder;
    setSubmittingAction(true);
    const headers = getAuthHeaders();

    const targetStatus = action === 'accept' ? 'accepted' : 'rejected';
    const payload = {
      status: targetStatus,
      rejection_reason: action === 'reject' ? rejectionReason.trim() : null
    };

    try {
      try {
        await axios.put(`${API_BASE_URL}/api/v1/lab/orders/${order.id}/status`, payload, { headers });
      } catch (beErr) {
        await axios.put(`/api/v1/lab/orders/${order.id}/status`, payload, { headers });
      }

      toast.success(
        `Order ${order.order_number} has been ${action === 'accept' ? 'accepted' : 'rejected'} successfully`
      );
      setActionOrder(null);
      setRejectionReason('');
      if (viewingOrder && viewingOrder.id === order.id) {
        setViewingOrder(null);
      }
      await fetchOrders();
    } catch (err) {
      console.error(`Error updating order status:`, err);
      const msg = err.response?.data?.message || err.message || `Failed to update order status`;
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Inbound Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage incoming diagnostic orders requested by Doctors and Clinics.
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-orders"
              type="text"
              placeholder="Search by Order #, Patient name, or Doctor/Clinic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
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

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Orders</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Pending</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800">
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Accepted</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800">
                {counts.accepted}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-red-50 text-red-700 border border-red-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Rejected</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800">
                {counts.rejected}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading lab orders...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Error Loading Orders</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No lab orders found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No orders match your filter criteria. Try resetting filters.'
                : 'Your laboratory has not received any diagnostic orders yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order ID</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Ordering Clinic</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4">Tests / Package</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                  const isPending = (order.status || 'pending').toLowerCase() === 'pending';

                  return (
                    <tr
                      key={order.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for order ${order.order_number}`}
                      onClick={() => setViewingOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setViewingOrder(order);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-slate-50/90 focus:ring-1 focus:ring-teal-500/30"
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 sm:px-6 font-medium whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/70 inline-block">
                          {order.order_number}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPriorityBadge(order.priority)}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 text-xs">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </span>
                      </td>

                      {/* Ordering Clinic */}
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className="font-semibold text-slate-800 block truncate max-w-[180px]"
                          title={order.clinic?.clinic_name || 'Independent Practice'}
                        >
                          {order.clinic?.clinic_name || 'Independent Practice'}
                        </span>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Tests / Package Compact Layout */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 max-w-[240px]">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 shrink-0">
                            <FlaskConical className="w-3 h-3 text-teal-600" />
                            {itemCount} {itemCount === 1 ? 'Test' : 'Tests'}
                          </span>
                          {itemCount > 0 && (
                            <div className="min-w-0 flex-1 flex items-center gap-1.5">
                              <span
                                className="text-xs font-semibold text-slate-900 truncate"
                                title={(order.items || []).map((it) => it.item_name).join(', ')}
                              >
                                {order.items[0]?.item_name}
                              </span>
                              {itemCount > 1 && (
                                <span
                                  className="text-[10px] font-medium text-teal-700 bg-teal-50/80 px-1.5 py-0.5 rounded border border-teal-200/50 shrink-0"
                                  title={(order.items || []).slice(1).map((it) => it.item_name).join(', ')}
                                >
                                  +{itemCount - 1} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {/* Accept (if pending) */}
                          {isPending && (
                            <>
                              <button
                                id={`btn-accept-${order.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOrder({ order, action: 'accept' });
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Accept Order"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              <button
                                id={`btn-reject-${order.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOrder({ order, action: 'reject' });
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject Order"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Collect Sample (if accepted or sample_collected) */}
                          {((order.status || '').toLowerCase() === 'accepted' || (order.status || '').toLowerCase() === 'sample_collected') && (
                            <Link
                              href={`/lab/sample-collection?orderId=${order.id}`}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                              title="Collect / View Samples for this Order"
                            >
                              <TestTube className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Collect Sample</span>
                            </Link>
                          )}
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

      {/* ========================================================= */}
      {/* 4. VIEW ORDER DETAILS MODAL                               */}
      {/* ========================================================= */}
      {viewingOrder && (
        <ModalPortal isOpen={Boolean(viewingOrder)} onClose={() => setViewingOrder(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Order Details</h2>
                    <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      {viewingOrder?.order_number}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Status, Priority and Total Banner */}
                <div className="flex items-center justify-between p-4 bg-teal-50/70 border border-teal-200/70 rounded-xl">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Order Status</div>
                    <div className="mt-1">{getStatusBadge(viewingOrder?.status)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Order Priority</div>
                    <div className="mt-1">{getPriorityBadge(viewingOrder?.priority)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-teal-800 font-medium">Total Amount</div>
                    <div className="text-xl font-extrabold text-teal-950">
                      ₹{Number(viewingOrder?.total_amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

              {/* Patient, Clinic, and Creator Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Patient Info */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Patient Details</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 text-sm">
                      {viewingOrder.patient?.first_name} {viewingOrder.patient?.last_name}
                    </p>
                    <p className="text-slate-600">
                      Phone: <span className="font-medium">{viewingOrder.patient?.phone_number || 'N/A'}</span>
                    </p>
                    <p className="text-slate-600">
                      Gender: <span className="font-medium capitalize">{viewingOrder.patient?.gender || 'N/A'}</span>
                    </p>
                    {viewingOrder.patient?.patient_code && (
                      <p className="text-slate-500 text-[11px]">
                        ID: <span className="font-mono">{viewingOrder.patient.patient_code}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Ordering Clinic */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2 text-teal-700">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Ordering Clinic</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 text-sm">
                      {viewingOrder.clinic?.clinic_name || 'Independent Practice'}
                    </p>
                    <p className="text-slate-600">
                      Phone: <span className="font-medium">{viewingOrder.clinic?.phone || 'N/A'}</span>
                    </p>
                    <p className="text-slate-600 truncate" title={viewingOrder.clinic?.email || 'N/A'}>
                      Email: <span className="font-medium">{viewingOrder.clinic?.email || 'N/A'}</span>
                    </p>
                    <span className="inline-block mt-1 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 font-semibold">
                      Facility
                    </span>
                  </div>
                </div>

                {/* Created By & Role */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2 text-indigo-700">
                    {(viewingOrder.ordering_type === 'doctor' || viewingOrder.doctor) ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider">Order Creator</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {(viewingOrder.ordering_type === 'doctor' || viewingOrder.doctor) ? (
                      <>
                        <p className="font-bold text-slate-900 text-sm">
                          Dr. {viewingOrder.doctor ? `${viewingOrder.doctor.first_name || ''} ${viewingOrder.doctor.last_name || ''}`.trim() : 'Doctor'}
                        </p>
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="text-slate-500">Role:</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            Doctor
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Specialty: <span className="font-medium">{viewingOrder.doctor?.specialty || 'General Practitioner'}</span>
                        </p>
                        <p className="text-slate-600 truncate" title={viewingOrder.doctor?.email || 'N/A'}>
                          Email: <span className="font-medium">{viewingOrder.doctor?.email || 'N/A'}</span>
                        </p>
                        {viewingOrder.doctor?.phone && (
                          <p className="text-slate-600">
                            Phone: <span className="font-medium">{viewingOrder.doctor.phone}</span>
                          </p>
                        )}
                      </>
                    ) : (viewingOrder.ordering_type === 'receptionist' || viewingOrder.receptionist) ? (
                      <>
                        <p className="font-bold text-slate-900 text-sm">
                          {viewingOrder.receptionist ? `${viewingOrder.receptionist.first_name || ''} ${viewingOrder.receptionist.last_name || ''}`.trim() : 'Receptionist'}
                        </p>
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="text-slate-500">Role:</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                            Receptionist
                          </span>
                        </div>
                        <p className="text-slate-600 truncate" title={viewingOrder.receptionist?.email || 'N/A'}>
                          Email: <span className="font-medium">{viewingOrder.receptionist?.email || 'N/A'}</span>
                        </p>
                        <p className="text-slate-600">
                          Phone: <span className="font-medium">{viewingOrder.receptionist?.phone || 'N/A'}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-slate-900 text-sm">
                          {viewingOrder.created_by_user?.name || viewingOrder.clinic?.clinic_name || 'Clinic Staff'}
                        </p>
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="text-slate-500">Role:</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {viewingOrder.ordering_type ? viewingOrder.ordering_type.toUpperCase() : 'Clinic'}
                          </span>
                        </div>
                        {viewingOrder.clinic?.email && (
                          <p className="text-slate-600 truncate" title={viewingOrder.clinic.email}>
                            Email: <span className="font-medium">{viewingOrder.clinic.email}</span>
                          </p>
                        )}
                        <p className="text-slate-600">
                          Phone: <span className="font-medium">{viewingOrder.clinic?.phone || 'N/A'}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Specimen / Barcode Info (if already available on the order record) */}
              {((Array.isArray(viewingOrder.samples) && viewingOrder.samples.length > 0) ||
                viewingOrder.sample ||
                viewingOrder.sample_barcode ||
                viewingOrder.barcode) && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <TestTube className="w-3.5 h-3.5 text-teal-600" />
                      Specimen & Barcode Details
                    </span>
                    {(viewingOrder.sample_barcode || viewingOrder.barcode || viewingOrder.sample?.barcode) && (
                      <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Barcode: {viewingOrder.sample_barcode || viewingOrder.barcode || viewingOrder.sample?.barcode}
                      </span>
                    )}
                  </div>

                  {Array.isArray(viewingOrder.samples) && viewingOrder.samples.length > 0 ? (
                    <div className="divide-y divide-slate-200/60">
                      {viewingOrder.samples.map((s, idx) => (
                        <div key={s.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {s.barcode && (
                              <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                {s.barcode}
                              </span>
                            )}
                            <span className="font-medium text-slate-800">{s.sample_type || 'Sample'}</span>
                            {s.collection_status && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 capitalize">
                                {s.collection_status}
                              </span>
                            )}
                          </div>
                          {s.collected_at && (
                            <span className="text-[11px] text-slate-500">
                              Collected: {formatDate(s.collected_at)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : viewingOrder.sample ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {viewingOrder.sample.barcode && (
                          <span className="font-mono text-[10px] font-bold bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            {viewingOrder.sample.barcode}
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{viewingOrder.sample.sample_type || 'Sample'}</span>
                        {viewingOrder.sample.collection_status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 capitalize">
                            {viewingOrder.sample.collection_status}
                          </span>
                        )}
                      </div>
                      {viewingOrder.sample.collected_at && (
                        <span className="text-[11px] text-slate-500">
                          Collected: {formatDate(viewingOrder.sample.collected_at)}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Clinical Notes (if any) */}
              {viewingOrder.clinical_notes && (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs">
                  <span className="font-semibold text-amber-900 block mb-1">Clinical Notes / Instructions:</span>
                  <p className="text-slate-700">{viewingOrder.clinical_notes}</p>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {viewingOrder.rejection_reason && (
                <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200/70 text-xs text-red-800">
                  <span className="font-bold block mb-1">Rejection Reason:</span>
                  <p>{viewingOrder.rejection_reason}</p>
                </div>
              )}

              {/* Included Diagnostic Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-teal-600" />
                  <span>Ordered Diagnostic Tests & Packages ({viewingOrder.items?.length || 0})</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {(viewingOrder.items || []).map((item, idx) => (
                    <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.item_code}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            Type: {item.item_type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-800">
                          ₹{Number(item.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created: {formatDate(viewingOrder.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated: {formatDate(viewingOrder.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                {(viewingOrder?.status || 'pending').toLowerCase() === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionOrder({ order: viewingOrder, action: 'accept' })}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Order</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionOrder({ order: viewingOrder, action: 'reject' })}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Order</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* ========================================================= */}
      {/* 5. ACCEPT / REJECT CONFIRMATION MODAL                     */}
      {/* ========================================================= */}
      {actionOrder && (
        <ModalPortal isOpen={Boolean(actionOrder)} onClose={() => setActionOrder(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto flex flex-col my-auto animate-in zoom-in-95 duration-200">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                  actionOrder?.action === 'accept' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {actionOrder?.action === 'accept' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  {actionOrder?.action === 'accept' ? 'Accept Lab Order?' : 'Reject Lab Order?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  {actionOrder?.action === 'accept'
                    ? `Accepting order ${actionOrder?.order?.order_number} confirms that your laboratory will process the diagnostic tests.`
                    : `Rejecting order ${actionOrder?.order?.order_number} notifies the ordering facility that the order cannot be fulfilled.`}
                </p>
              </div>

              {actionOrder?.action === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Reason <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Sample equipment unavailable or missing clinical details..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionOrder(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-action"
                  onClick={handleConfirmAction}
                  disabled={submittingAction}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 ${
                    actionOrder?.action === 'accept'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingAction && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{actionOrder?.action === 'accept' ? 'Confirm Acceptance' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
