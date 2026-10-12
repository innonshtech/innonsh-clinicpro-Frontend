'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { formatTitleCase } from '@/utils/nameFormatting';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  isLabAdmin,
  isPathologist,
  isTechnician,
  hasLabPermission,
  LAB_PERMISSIONS,
  resolveLabPortalRole
} from '@/constants/labRoles';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  ClipboardList,
  TestTube,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  User,
  UserCheck,
  Stethoscope,
  Truck,
  RotateCcw,
  FileCheck,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Calendar,
  Lock
} from 'lucide-react';
import { getPriorityBadge } from '@/components/LabOrdersManagement';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
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

const getStatusBadge = (status) => {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'accepted':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Accepted
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Rejected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending
        </span>
      );
  }
};

const getSampleStatusBadge = (status) => {
  const s = (status || 'collected').toLowerCase();
  switch (s) {
    case 'received':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          At Bench
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Rejected
        </span>
      );
    case 'recollection_requested':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Recollection
        </span>
      );
    case 'collected':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Collected
        </span>
      );
  }
};


/* =========================================================================
   1. LAB ADMIN DASHBOARD (Preserved Exactly As Existing)
   ========================================================================= */
function LabAdminDashboard({ labUser }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoadingOrders(true);
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
      console.error('Error fetching dashboard lab orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length;
  const acceptedOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'accepted').length;
  const rejectedOrders = orders.filter((o) => (o.status || '').toLowerCase() === 'rejected').length;

  const labName = labUser?.labName || labUser?.name || 'Diagnostic Laboratory';
  const displayName = formatTitleCase(labName);
  const status = labUser?.status?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Section Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
              <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Facility Status: {status}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Here&apos;s an overview of your laboratory operations.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15 text-xs space-y-1">
            <p className="font-semibold text-white/90">Portal Role</p>
            <p className="text-teal-100 font-mono">Independent Diagnostic Laboratory</p>
          </div>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards (4 Live Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loadingOrders ? '...' : totalOrders}
            </p>
            <span className="inline-block mt-1 text-[11px] text-teal-600 font-medium">All Incoming Orders</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loadingOrders ? '...' : pendingOrders}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-medium ${pendingOrders > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {pendingOrders > 0 ? `${pendingOrders} Action Required` : 'Awaiting New Orders'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Accepted Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accepted Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loadingOrders ? '...' : acceptedOrders}
            </p>
            <span className="inline-block mt-1 text-[11px] text-emerald-600 font-medium">In Diagnostic Workflow</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Rejected Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loadingOrders ? '...' : rejectedOrders}
            </p>
            <span className="inline-block mt-1 text-[11px] text-red-600 font-medium">Declined Orders</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Recent Lab Orders Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Lab Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">Incoming diagnostic orders across clinics & doctors</p>
          </div>
          <Link
            href="/lab/orders"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-14 text-center">
            <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-xs text-slate-400">Loading recent orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No lab orders yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Orders from doctors and receptionists will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => {
              const itemCount = Array.isArray(order.items) ? order.items.length : 0;
              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 text-[11px]">
                          {order.order_number}
                        </span>
                        {getPriorityBadge(order.priority)}
                        <span className="font-semibold text-slate-900">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3 h-3 text-teal-600" />
                          {order.clinic?.clinic_name || 'Independent Practice'}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          {order.ordering_type === 'doctor' ? (
                            <>
                              <Stethoscope className="w-3 h-3 text-blue-600" />
                              <span>Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name || ''}`.trim() : 'Doctor'}</span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
                                Doctor
                              </span>
                            </>
                          ) : order.ordering_type === 'receptionist' ? (
                            <>
                              <UserCheck className="w-3 h-3 text-purple-600" />
                              <span>{order.receptionist ? `${order.receptionist.first_name} ${order.receptionist.last_name || ''}`.trim() : 'Receptionist'}</span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 leading-none">
                                Receptionist
                              </span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 text-slate-600" />
                              <span>{order.clinic?.clinic_name || 'Clinic'}</span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 leading-none">
                                Clinic
                              </span>
                            </>
                          )}
                        </span>

                        <span className="text-slate-400">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Pending Actions Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pending Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Operational tasks requiring immediate attention</p>
          </div>
        </div>

        {pendingOrders > 0 ? (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{pendingOrders} Lab {pendingOrders === 1 ? 'Order' : 'Orders'} Awaiting Decision</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              You have pending diagnostic test orders that require confirmation (acceptance or rejection).
            </p>
            <Link
              href="/lab/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
            >
              <span>Review Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No pending actions</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
              All incoming orders have been reviewed.
            </p>
          </div>
        )}
      </div>

      {/* 5. Lab Account Details */}
      <div id="account-details" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm scroll-mt-20">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
          <ShieldCheck className="w-5 h-5 text-teal-600 mr-2" />
          Lab Account Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="block text-xs text-slate-400 font-medium">Registered Facility</span>
              <span className="font-semibold text-slate-800">{displayName}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Login Email</span>
              <span className="font-medium text-slate-700">{labUser?.email || labUser?.loginEmail || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-xs text-slate-400 font-medium">Facility ID</span>
              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {labUser?.id || labUser?._id || 'Registered via SuperAdmin'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Accreditation & Operations</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 mt-0.5">
                <CheckCircle className="w-3 h-3 text-teal-600" />
                Active Diagnostic Provider
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. LAB TECHNICIAN DASHBOARD
   ========================================================================= */
function LabTechnicianDashboard({ labUser }) {
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [eligibleSamplesForEntry, setEligibleSamplesForEntry] = useState([]);
  const [validationQueue, setValidationQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTechnicianData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Parallel fetching from tenant endpoints
      const [ordRes, smpRes, eligRes, eligSmpRes, valRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/v1/lab/orders`, { headers }).catch(() => axios.get('/api/v1/lab/orders', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/samples`, { headers }).catch(() => axios.get('/api/v1/lab/samples', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/samples/eligible-orders`, { headers }).catch(() => axios.get('/api/v1/lab/samples/eligible-orders', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/results/eligible-samples`, { headers }).catch(() => axios.get('/api/v1/lab/results/eligible-samples', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/results/validation-queue`, { headers }).catch(() => axios.get('/api/v1/lab/results/validation-queue', { headers }))
      ]);

      if (ordRes.status === 'fulfilled') {
        const fetched = ordRes.value?.data?.data?.orders || ordRes.value?.data?.orders || [];
        setOrders(Array.isArray(fetched) ? fetched : []);
      }
      if (smpRes.status === 'fulfilled') {
        const fetched = smpRes.value?.data?.data?.samples || smpRes.value?.data?.samples || [];
        setSamples(Array.isArray(fetched) ? fetched : []);
      }
      if (eligRes.status === 'fulfilled') {
        const fetched = eligRes.value?.data?.data?.orders || eligRes.value?.data?.orders || [];
        setEligibleOrders(Array.isArray(fetched) ? fetched : []);
      }
      if (eligSmpRes.status === 'fulfilled') {
        const fetched = eligSmpRes.value?.data?.data?.samples || eligSmpRes.value?.data?.samples || [];
        setEligibleSamplesForEntry(Array.isArray(fetched) ? fetched : []);
      }
      if (valRes.status === 'fulfilled') {
        const fetched = valRes.value?.data?.data?.queue || valRes.value?.data?.queue || [];
        setValidationQueue(Array.isArray(fetched) ? fetched : []);
      }
    } catch (err) {
      console.error('Error fetching technician dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianData();
  }, []);

  // 1. Orders awaiting processing (accepted or pending orders in diagnostic workflow)
  const ordersAwaitingProcessing = orders.filter((o) =>
    ['pending', 'accepted', 'in_progress'].includes((o.status || '').toLowerCase())
  ).length;

  // 2. Samples pending collection (eligible orders waiting for collection)
  const samplesPendingCollection = eligibleOrders.length;

  // 3. Samples collected or in-transit
  const samplesCollected = samples.filter((s) =>
    (s.collection_status || '').toLowerCase() === 'collected'
  ).length;

  // 4. Rejected samples and recollections required
  const recollectionsRequired = samples.filter((s) => {
    const st = (s.collection_status || '').toLowerCase();
    return st === 'rejected' || st === 'recollection_requested' || s.is_recollection;
  }).length;

  // 5. Results pending entry:
  // Calculated using actual result/sample relationships from eligible-samples service.
  // Filters for samples needing parameter entry (entry_status === 'pending_entry' or results_count === 0).
  const resultsPendingEntry = eligibleSamplesForEntry.length > 0
    ? eligibleSamplesForEntry.filter((s) =>
        (s.entry_status || '').toLowerCase() === 'pending_entry' ||
        (s.entry_status || '').toLowerCase() === 'in_progress' ||
        (s.results_count || 0) === 0
      ).length
    : samples.filter((s) => (s.collection_status || '').toLowerCase() === 'received' && (!s.results_count || s.results_count === 0)).length;

  // 6. Results entered and awaiting validation
  const resultsAwaitingValidation = validationQueue.length;

  const technicianName = labUser?.name || labUser?.full_name || 'Lab Technician';
  const displayName = formatTitleCase(technicianName);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Workstation Status: Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Specimen collection, tracking, and diagnostic result entry workstation.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15 text-xs space-y-1">
            <p className="font-semibold text-white/90">Portal Role</p>
            <p className="text-teal-100 font-mono">Lab Technician / Bench Operations</p>
          </div>
        </div>
      </div>

      {/* Technician KPI Cards (6 Key Operational Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* KPI 1: Orders Awaiting Processing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders Awaiting Processing</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : ordersAwaitingProcessing}
            </p>
            <span className="inline-block mt-1 text-[11px] text-teal-600 font-medium">Approved clinical orders</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Samples Pending Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Collection</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : samplesPendingCollection}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-medium ${samplesPendingCollection > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {samplesPendingCollection > 0 ? `${samplesPendingCollection} Specimen Draws Ready` : 'No Draws Pending'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TestTube className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Samples In-Transit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected / In-Transit</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : samplesCollected}
            </p>
            <span className="inline-block mt-1 text-[11px] text-blue-600 font-medium">Awaiting bench accession</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Recollections Required */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recollections Needed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : recollectionsRequired}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-medium ${recollectionsRequired > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
              {recollectionsRequired > 0 ? 'Specimen Quality Failure' : 'Zero Specimen Rejections'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Results Pending Entry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Results Pending Entry</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : resultsPendingEntry}
            </p>
            <span className="inline-block mt-1 text-[11px] text-orange-600 font-medium">Specimens awaiting entry</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 6: Results Awaiting Validation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Validation</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : resultsAwaitingValidation}
            </p>
            <span className="inline-block mt-1 text-[11px] text-purple-600 font-medium">Submitted for signoff</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Technician Quick Actions (Permitted Operations Only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Technician Quick Actions</h3>
        <p className="text-xs text-slate-500 mb-4">Direct access to permitted specimen and bench workflows</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/lab/sample-collection"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors shrink-0">
              <TestTube className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Sample Collection
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Collect & barcode specimens for eligible orders.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/sample-tracking"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Sample Tracking
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Receive in-transit specimens at laboratory bench.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/recollections"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Rejections & Recollections
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Manage quality failures and request recollections.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/result-entry"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Result Entry
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Enter parameters & findings for received samples.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Pending Operational Tasks Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Pending Operational Tasks</h3>
        <p className="text-xs text-slate-500 mb-4">Urgent technical activities awaiting action</p>

        {samplesPendingCollection > 0 || recollectionsRequired > 0 || resultsPendingEntry > 0 ? (
          <div className="space-y-3">
            {samplesPendingCollection > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <TestTube className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {samplesPendingCollection} Approved {samplesPendingCollection === 1 ? 'Order' : 'Orders'} Awaiting Specimen Draw
                    </p>
                    <p className="text-[11px] text-amber-700">Patient samples have not yet been collected or barcoded.</p>
                  </div>
                </div>
                <Link
                  href="/lab/sample-collection"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>Collect Samples</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {recollectionsRequired > 0 && (
              <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">
                      {recollectionsRequired} Specimen {recollectionsRequired === 1 ? 'Quality Failure' : 'Quality Failures'} Requiring Recollection
                    </p>
                    <p className="text-[11px] text-red-700">Specimens marked hemolyzed, clotted, or insufficient volume.</p>
                  </div>
                </div>
                <Link
                  href="/lab/recollections"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>Review Recollections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {resultsPendingEntry > 0 && (
              <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-900">
                      {resultsPendingEntry} {resultsPendingEntry === 1 ? 'Specimen' : 'Specimens'} Received At Bench Awaiting Result Entry
                    </p>
                    <p className="text-[11px] text-orange-700">Enter laboratory parameters and observation values.</p>
                  </div>
                </div>
                <Link
                  href="/lab/result-entry"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>Enter Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">All workstation tasks up to date</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
              No pending collections, specimen rejections, or unentered results.
            </p>
          </div>
        )}
      </div>

      {/* Recent Sample & Order Activity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Specimen Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Recently collected, accessioned, and processing specimens</p>
          </div>
          <Link
            href="/lab/sample-tracking"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            <span>Track all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-14 text-center">
            <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-xs text-slate-400">Loading recent specimens...</p>
          </div>
        ) : samples.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <TestTube className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No specimen records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Specimens collected from approved orders will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {samples.slice(0, 5).map((sample) => (
              <div
                key={sample.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 text-[11px]">
                        {sample.barcode || sample.id?.slice(0, 8)}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {sample.order?.patient?.first_name ? `${sample.order.patient.first_name} ${sample.order.patient.last_name || ''}` : sample.patient_name || 'Patient'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <TestTube className="w-3 h-3 text-teal-600" />
                        {sample.sample_type || 'Blood'}
                      </span>
                      <span className="text-slate-400">
                        Order #{sample.order?.order_number || sample.order_number || 'N/A'}
                      </span>
                      <span className="text-slate-400">
                        {formatDateTime(sample.collected_at || sample.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                  {getSampleStatusBadge(sample.collection_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   3. PATHOLOGIST / VALIDATOR DASHBOARD
   ========================================================================= */
function LabPathologistDashboard({ labUser }) {
  const [validationQueue, setValidationQueue] = useState([]);
  const [validatedResults, setValidatedResults] = useState([]);
  const [criticalResults, setCriticalResults] = useState([]);
  const [eligibleReports, setEligibleReports] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPathologistData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Parallel fetching from tenant endpoints
      const [valRes, histRes, critRes, repEligRes, repRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/v1/lab/results/validation-queue`, { headers }).catch(() => axios.get('/api/v1/lab/results/validation-queue', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/results?status=validated`, { headers }).catch(() => axios.get('/api/v1/lab/results?status=validated', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/results/critical`, { headers }).catch(() => axios.get('/api/v1/lab/results/critical', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/reports/eligible-orders`, { headers }).catch(() => axios.get('/api/v1/lab/reports/eligible-orders', { headers })),
        axios.get(`${API_BASE_URL}/api/v1/lab/reports`, { headers }).catch(() => axios.get('/api/v1/lab/reports', { headers }))
      ]);

      if (valRes.status === 'fulfilled') {
        const fetched = valRes.value?.data?.data?.queue || valRes.value?.data?.queue || [];
        setValidationQueue(Array.isArray(fetched) ? fetched : []);
      }
      if (histRes.status === 'fulfilled') {
        const fetched = histRes.value?.data?.data?.results || histRes.value?.data?.results || [];
        setValidatedResults(Array.isArray(fetched) ? fetched : []);
      }
      if (critRes.status === 'fulfilled') {
        const fetched = critRes.value?.data?.data?.criticalResults || critRes.value?.data?.criticalResults || [];
        setCriticalResults(Array.isArray(fetched) ? fetched : []);
      }
      if (repEligRes.status === 'fulfilled') {
        const fetched = repEligRes.value?.data?.data?.eligibleOrders || repEligRes.value?.data?.eligibleOrders || [];
        setEligibleReports(Array.isArray(fetched) ? fetched : []);
      }
      if (repRes.status === 'fulfilled') {
        const fetched = repRes.value?.data?.data?.reports || repRes.value?.data?.reports || [];
        setReports(Array.isArray(fetched) ? fetched : []);
      }
    } catch (err) {
      console.error('Error fetching pathologist dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPathologistData();
  }, []);

  // 1. Results Pending Validation
  const resultsPendingValidation = validationQueue.length;

  // 2. Results Validated (Filter out superseded and corrected records to avoid duplicate counts!)
  const resultsValidated = validatedResults.filter((r) =>
    r.is_superseded !== true &&
    r.is_corrected !== true &&
    (r.status || '').toLowerCase() !== 'superseded' &&
    ['validated', 'completed'].includes((r.status || '').toLowerCase())
  ).length;

  // 3. Critical Findings (Active, non-superseded)
  const activeCriticalFindings = criticalResults.filter((r) =>
    r.is_superseded !== true &&
    (r.status || '').toLowerCase() !== 'superseded'
  );
  const criticalFindingsCount = activeCriticalFindings.length;
  const uncommunicatedCritical = activeCriticalFindings.filter((r) => !r.critical_acknowledged).length;

  // 4. Reports Eligible for Generation
  const reportsEligible = eligibleReports.length;

  // 5. Reports Issued
  const reportsIssued = reports.filter((rep) =>
    ['issued', 'final', 'completed'].includes((rep.report_status || rep.status || '').toLowerCase())
  ).length;

  const pathologistName = labUser?.name || labUser?.full_name || 'Medical Pathologist';
  const displayName = formatTitleCase(pathologistName);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Validation Authority: Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, Dr. {displayName}
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Authoritative result validation, critical findings oversight, and diagnostic report signoff.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/15 text-xs space-y-1">
            <p className="font-semibold text-white/90">Portal Role</p>
            <p className="text-teal-100 font-mono">Pathologist / Medical Validator</p>
          </div>
        </div>
      </div>

      {/* Pathologist KPI Metrics (5 Key Validator Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* KPI 1: Pending Validation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Validation</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : resultsPendingValidation}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-medium ${resultsPendingValidation > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {resultsPendingValidation > 0 ? 'Action Required' : 'Queue Clear'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Results Validated */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Results Validated</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : resultsValidated}
            </p>
            <span className="inline-block mt-1 text-[11px] text-emerald-600 font-medium">Signed findings</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Critical Panic Findings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Findings</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : criticalFindingsCount}
            </p>
            <span className={`inline-block mt-1 text-[11px] font-medium ${uncommunicatedCritical > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
              {uncommunicatedCritical > 0 ? `${uncommunicatedCritical} Urgent Alerts` : 'All Notified'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Reports Eligible */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports Ready</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : reportsEligible}
            </p>
            <span className="inline-block mt-1 text-[11px] text-blue-600 font-medium">Ready to issue</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Reports Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports Issued</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : reportsIssued}
            </p>
            <span className="inline-block mt-1 text-[11px] text-teal-600 font-medium">Finalized reports</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pathologist Quick Actions (Permitted Workflows & Read-Only Specimen Tracking) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Pathologist Quick Actions</h3>
        <p className="text-xs text-slate-500 mb-4">Direct access to clinical validation and reporting workflows</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/lab/result-validation"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Result Validation
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Review, correct & electronically sign off findings.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/critical-results"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Critical Findings
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Oversee panic values and physician communication.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/report-generation"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Report Generation
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Compile & issue verified diagnostic reports.
              </p>
            </div>
          </Link>

          <Link
            href="/lab/sample-tracking"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                Specimen Tracking
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Read-only specimen transit & accession monitoring.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Critical Panic Alerts Section (If Any) */}
      {criticalFindingsCount > 0 && (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="text-base font-bold">Critical Panic Findings Oversight</h3>
            </div>
            <Link
              href="/lab/critical-results"
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <span>Manage all alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeCriticalFindings.slice(0, 3).map((crit) => (
              <div
                key={crit.id}
                className="bg-white p-3.5 rounded-xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-700">
                      {crit.parameter_name || crit.test_name || 'Abnormal Parameter'}
                    </span>
                    <span className="font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {crit.result_value} {crit.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Patient: {crit.patient_name || crit.patient?.first_name || 'Patient Record'} • Sample #{crit.sample_barcode || crit.barcode || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {crit.critical_acknowledged ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Physician Communicated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300 gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      Pending Communication
                    </span>
                  )}
                  <Link
                    href="/lab/critical-results"
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                  >
                    Acknowledge
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Validation Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Diagnostic test batches entered by technicians awaiting medical review</p>
          </div>
          <Link
            href="/lab/result-validation"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            <span>Open queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-14 text-center">
            <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-xs text-slate-400">Loading validation queue...</p>
          </div>
        ) : validationQueue.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Validation queue is clear</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All entered diagnostic test results have been authorized or no new results are pending.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {validationQueue.slice(0, 5).map((group, idx) => {
              const resultCount = Array.isArray(group.results) ? group.results.length : 0;
              const hasCritical = Array.isArray(group.results) && group.results.some((r) => r.is_critical);

              return (
                <div
                  key={group.sample_id || idx}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 text-[11px]">
                          {group.sample_barcode || 'Sample'}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {group.patient ? `${group.patient.first_name || ''} ${group.patient.last_name || ''}`.trim() : 'Patient'}
                        </span>
                        {hasCritical && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                            CRITICAL
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">
                          {group.sample_type || 'Blood'} Specimen
                        </span>
                        <span className="text-slate-400">
                          {resultCount} {resultCount === 1 ? 'parameter' : 'parameters'} ready
                        </span>
                        <span className="text-slate-400">
                          Order #{group.order?.order_number || group.order_number || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                    <Link
                      href="/lab/result-validation"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
                    >
                      <span>Review & Sign Off</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   4. RESTRICTED / UNASSIGNED STAFF FALLBACK DASHBOARD
   ========================================================================= */
function StaffRestrictedDashboard({ labUser }) {
  const staffName = labUser?.name || labUser?.full_name || 'Staff Member';
  const displayName = formatTitleCase(staffName);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Staff Role Configuration Required
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Welcome, {displayName}. Your laboratory staff account is authenticated, but your specific role (Technician or Pathologist) has not yet been assigned or your permissions are restricted.
        </p>
        <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
          Please contact your Laboratory Director or Administrator to configure your role and permissions.
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   ROOT LAB DASHBOARD PAGE (Role Dispatcher)
   ========================================================================= */
export default function LabDashboardPage() {
  const [labUser, setLabUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setLabUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Error loading lab user from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading laboratory workstation...</p>
      </div>
    );
  }

  // Safe and strict role determination
  const portalRole = resolveLabPortalRole(labUser);

  if (portalRole === 'technician') {
    return <LabTechnicianDashboard labUser={labUser} />;
  }

  if (portalRole === 'pathologist') {
    return <LabPathologistDashboard labUser={labUser} />;
  }

  if (portalRole === 'lab_admin') {
    return <LabAdminDashboard labUser={labUser} />;
  }

  // Safe restricted view for staff with missing or unrecognized roles
  return <StaffRestrictedDashboard labUser={labUser} />;
}
