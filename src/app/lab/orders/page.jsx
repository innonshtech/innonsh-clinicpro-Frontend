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
  TestTube,
  Radio,
  Eye,
  Upload,
  ShieldCheck,
  ExternalLink,
  FileCheck2,
  Paperclip
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

  // Category Switcher: 'pathology' | 'radiology'
  const [activeCategory, setActiveCategory] = useState('pathology');

  // Radiology Orders State
  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [loadingRadiology, setLoadingRadiology] = useState(false);
  const [radiologyFilter, setRadiologyFilter] = useState('ALL');
  const [radiologySearch, setRadiologySearch] = useState('');
  const [attachingReportOrder, setAttachingReportOrder] = useState(null);
  const [viewingRadiologyReport, setViewingRadiologyReport] = useState(null);
  const [statusUpdatingOrderId, setStatusUpdatingOrderId] = useState(null);

  const [reportForm, setReportForm] = useState({
    findings: '',
    impression: '',
    recommendations: '',
    critical_findings: false,
    file_url: '',
    file_name: '',
    file_size: null,
    mime_type: ''
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Current logged in user context for RBAC
  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (_) {
      return {};
    }
  }, []);

  const isTechnician = currentUser.role === 'technician' || currentUser.labRole === 'technician';
  const hasIssueReportsPerm = (currentUser.permissions || []).includes('issue_reports') || (currentUser.permissions || []).includes('validate_results');
  const canIssueReport = !isTechnician || hasIssueReportsPerm || currentUser.role === 'admin' || currentUser.labRole === 'pathologist' || currentUser.labRole === 'radiologist' || currentUser.labRole === 'lab_admin';

  const fetchRadiologyOrders = async () => {
    try {
      setLoadingRadiology(true);
      const headers = getAuthHeaders();
      let ipdList = [];
      try {
        const resIpd = await axios.get(`${API_BASE_URL}/api/v1/ipd/radiology/orders`, { headers });
        ipdList = (resIpd.data?.data?.orders || []).map(o => {
          const amt = (o.price !== undefined && o.price !== null)
            ? Number(o.price)
            : (o.total_amount !== undefined && o.total_amount !== null)
            ? Number(o.total_amount)
            : (o.amount !== undefined && o.amount !== null)
            ? Number(o.amount)
            : null;
          return {
            ...o,
            originType: 'IPD',
            order_number: o.order_number || o.orderNumber || (o.id ? `RAD-${o.id.slice(0, 6)}` : 'RAD-IPD'),
            patient_name: o.patient_name || o.patientName || (o.patient ? `${o.patient.first_name || ''} ${o.patient.last_name || ''}`.trim() : '') || 'Inpatient',
            patient_code: o.patient_code || o.patientCode,
            admission_number: o.admission_number || o.admissionNumber || (o.admission_id ? o.admission_id.slice(0, 8) : ''),
            doctor_name: o.doctor_name || o.doctorName || (o.doctor ? `Dr. ${o.doctor.first_name || ''} ${o.doctor.last_name || ''}`.trim() : '') || 'Attending Physician',
            total_amount: amt,
            price: amt,
            amount: amt,
            status: (o.status || 'ORDERED').toUpperCase()
          };
        });
      } catch (errIpd) {
        try {
          const resFallback = await axios.get('/api/v1/ipd/radiology/orders', { headers });
          ipdList = (resFallback.data?.data?.orders || []).map(o => {
            const amt = (o.price !== undefined && o.price !== null)
              ? Number(o.price)
              : (o.total_amount !== undefined && o.total_amount !== null)
              ? Number(o.total_amount)
              : (o.amount !== undefined && o.amount !== null)
              ? Number(o.amount)
              : null;
            return {
              ...o,
              originType: 'IPD',
              order_number: o.order_number || o.orderNumber || (o.id ? `RAD-${o.id.slice(0, 6)}` : 'RAD-IPD'),
              patient_name: o.patient_name || o.patientName || (o.patient ? `${o.patient.first_name || ''} ${o.patient.last_name || ''}`.trim() : '') || 'Inpatient',
              patient_code: o.patient_code || o.patientCode,
              admission_number: o.admission_number || o.admissionNumber || (o.admission_id ? o.admission_id.slice(0, 8) : ''),
              doctor_name: o.doctor_name || o.doctorName || (o.doctor ? `Dr. ${o.doctor.first_name || ''} ${o.doctor.last_name || ''}`.trim() : '') || 'Attending Physician',
              total_amount: amt,
              price: amt,
              amount: amt,
              status: (o.status || 'ORDERED').toUpperCase()
            };
          });
        } catch (innerErr) {
          console.error('Failed to load IPD radiology orders:', errIpd?.response?.data || errIpd?.message || errIpd);
        }
      }

      let opdList = [];
      try {
        let resOpd;
        try {
          resOpd = await axios.get(`${API_BASE_URL}/api/v1/lab/orders`, { headers });
        } catch (_) {
          resOpd = await axios.get('/api/v1/lab/orders', { headers });
        }
        const allOpd = resOpd.data?.data?.orders || resOpd.data?.orders || [];
        opdList = allOpd
          .filter(o => o.category === 'radiology' || o.has_radiology || o.items?.some(i => i.item_type === 'radiology'))
          .map(o => {
            const radItem = o.items?.find(i => i.item_type === 'radiology') || o.items?.[0] || {};
            const pName = o.patient ? `${o.patient.first_name || ''} ${o.patient.last_name || ''}`.trim() : 'OPD Patient';
            const amt = (radItem.price !== undefined && radItem.price !== null)
              ? Number(radItem.price)
              : (o.total_amount !== undefined && o.total_amount !== null)
              ? Number(o.total_amount)
              : null;
            return {
              ...o,
              originType: 'OPD',
              study_name: radItem.study_name || radItem.item_name || 'Radiology Investigation',
              investigation_type: radItem.modality || 'X-Ray',
              clinical_indication: radItem.clinical_indication || o.clinical_notes || 'OPD Diagnostic Requisition',
              priority: o.priority || 'routine',
              transport_mode: 'ambulatory',
              patient_name: pName,
              patientName: pName,
              patient_code: o.patient?.patient_code || o.patient_id?.slice(0, 8),
              doctor_name: o.doctor ? `Dr. ${o.doctor.first_name || ''} ${o.doctor.last_name || ''}`.trim() : 'Attending Physician',
              total_amount: amt,
              price: amt,
              amount: amt,
              status: (o.status || 'pending').toUpperCase()
            };
          });
      } catch (errOpd) {
        console.error('Failed to load OPD radiology orders:', errOpd?.response?.data || errOpd?.message || errOpd);
      }

      // Deduplicate to prevent duplicate entries
      const seenIds = new Set();
      const deduped = [];
      for (const item of [...ipdList, ...opdList]) {
        const key = item.id || item._id || item.order_number;
        if (key && !seenIds.has(key)) {
          seenIds.add(key);
          deduped.push(item);
        } else if (!key) {
          deduped.push(item);
        }
      }

      const combined = deduped.sort((a, b) => {
        const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
      });
      setRadiologyOrders(combined);
    } catch (err) {
      console.error('Error in fetchRadiologyOrders:', err);
    } finally {
      setLoadingRadiology(false);
    }
  };

  useEffect(() => {
    fetchRadiologyOrders();
  }, []);

  const handleStartImaging = async (order) => {
    try {
      setStatusUpdatingOrderId(order.id);
      const headers = getAuthHeaders();
      if (order.originType === 'OPD') {
        const res = await axios.put(
          `${API_BASE_URL}/api/v1/lab/orders/${order.id}/status`,
          { status: 'in_progress' },
          { headers }
        );
        toast.success(`OPD Order #${order.order_number} transitioned to IN_PROGRESS`);
        fetchRadiologyOrders();
        fetchOrders();
      } else {
        const admissionId = order.admission_id || order.admissionId;
        const res = await axios.patch(
          `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology/${order.id}/status`,
          {
            status: 'IN_PROGRESS',
            notes: 'Patient positioned in imaging suite; scan in progress'
          },
          { headers }
        );
        if (res.data?.success) {
          toast.success(`IPD Order #${order.order_number || order.id?.slice(0, 8)} transitioned to IN_PROGRESS`);
          fetchRadiologyOrders();
        }
      }
    } catch (err) {
      console.error('Error updating radiology status:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setStatusUpdatingOrderId(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      return;
    }

    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const res = await axios.post(`${API_BASE_URL}/api/v1/ipd/radiology/upload`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        toast.success('Imaging scan file uploaded successfully');
        setReportForm(prev => ({
          ...prev,
          file_url: res.data.data.file_url,
          file_name: res.data.data.file_name,
          file_size: res.data.data.file_size,
          mime_type: res.data.data.mime_type
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAttachReportSubmit = async (e) => {
    e.preventDefault();
    if (!attachingReportOrder) return;

    if (!canIssueReport) {
      toast.error('Authorization Denied: Technicians cannot finalize reports without report issuance authorization. An authorized Specialist must sign.');
      return;
    }

    if (!reportForm.findings.trim() || reportForm.findings.trim().length < 3) {
      toast.error('Radiological findings are mandatory (minimum 3 characters)');
      return;
    }
    if (!reportForm.impression.trim() || reportForm.impression.trim().length < 3) {
      toast.error('Diagnostic impression is mandatory (minimum 3 characters)');
      return;
    }

    try {
      setIsSubmittingReport(true);
      const headers = getAuthHeaders();
      let res;
      if (attachingReportOrder.originType === 'OPD') {
        res = await axios.post(
          `${API_BASE_URL}/api/v1/lab/orders/${attachingReportOrder.id}/report`,
          reportForm,
          { headers }
        );
      } else {
        const admissionId = attachingReportOrder.admission_id || attachingReportOrder.admissionId;
        res = await axios.post(
          `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology/${attachingReportOrder.id}/report`,
          reportForm,
          { headers }
        );
      }

      if (res.data?.success) {
        toast.success('Radiology report signed and attached successfully!');
        setAttachingReportOrder(null);
        setReportForm({
          findings: '',
          impression: '',
          recommendations: '',
          critical_findings: false,
          file_url: '',
          file_name: '',
          file_size: null,
          mime_type: ''
        });
        fetchRadiologyOrders();
      }
    } catch (err) {
      console.error('Error attaching report:', err);
      const errCode = err.response?.data?.errorCode || err.response?.data?.error?.code;
      if (errCode === 'FORBIDDEN_REPORT_ISSUANCE') {
        toast.error('Access Denied: Technicians cannot finalize reports without report issuance authorization. An authorized Specialist must sign.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to attach radiology report');
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      // Exclude radiology orders from Pathology / Normal Lab worklist
      if (o.category === 'radiology' || o.has_radiology || o.items?.some(i => i.item_type === 'radiology')) {
        return false;
      }
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
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
    });
  }, [orders, statusFilter, searchTerm]);

  // Counts for tabs (Pathology only)
  const counts = useMemo(() => {
    const pathOrders = orders.filter(
      (o) => o.category !== 'radiology' && !o.has_radiology && !o.items?.some((i) => i.item_type === 'radiology')
    );
    const total = pathOrders.length;
    const pending = pathOrders.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length;
    const accepted = pathOrders.filter((o) => (o.status || '').toLowerCase() === 'accepted').length;
    const rejected = pathOrders.filter((o) => (o.status || '').toLowerCase() === 'rejected').length;
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
            <span className="text-xs font-semibold uppercase tracking-wider">Inbound Diagnostic Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Requisitions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage incoming laboratory test orders and IPD radiology imaging requisitions.
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-center">
          <button
            type="button"
            id="tab-diagnostic-pathology"
            onClick={() => setActiveCategory('pathology')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'pathology'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Pathology / Lab</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-50 text-teal-700 font-mono">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-diagnostic-radiology"
            onClick={() => {
              setActiveCategory('radiology');
              fetchRadiologyOrders();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'radiology'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>IPD Radiology</span>
            {radiologyOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-mono font-bold">
                {radiologyOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      
      {/* 2. PATHOLOGY ORDERS SECTION */}
      {activeCategory === 'pathology' && (
        <>
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
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100/90 text-slate-900 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6 text-slate-900 font-bold">Order ID</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Priority</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Patient</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Ordering Clinic</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Order Date</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Tests / Package</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Status</th>
                  <th className="py-3.5 px-4 text-right text-slate-900 font-bold">Actions</th>
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
                        <button
                          type="button"
                          id={`btn-order-path-${order.id || order._id || order.order_number}`}
                          data-testid={`btn-order-${order.order_number || order.orderNumber || (order.id ? 'ORD-' + String(order.id).slice(0, 8) : 'ORD-LAB')}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingOrder(order);
                          }}
                          className="font-mono text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-900 px-2.5 py-1 rounded-md border border-teal-200/70 inline-block transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-teal-500"
                          title="Click to view order details"
                        >
                          {order.order_number || order.orderNumber || (order.id ? 'ORD-' + String(order.id).slice(0, 8) : 'ORD-LAB')}
                        </button>
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

      
        </>
      )}

      {/* 3. IPD RADIOLOGY & IMAGING REQUISITIONS SECTION */}
      {activeCategory === 'radiology' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order #, Patient name, Admission #, or Study..."
                  value={radiologySearch}
                  onChange={(e) => setRadiologySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-colors"
                />
                {radiologySearch && (
                  <button
                    type="button"
                    onClick={() => setRadiologySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRadiologyOrders}
                  disabled={loadingRadiology}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRadiology ? 'animate-spin text-sky-600' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-3">
              {[
                { id: 'ALL', label: 'All Orders', count: radiologyOrders.length },
                { id: 'ORDERED', label: 'Ordered / Pending', count: radiologyOrders.filter(o => ['ORDERED', 'PENDING'].includes((o.status || '').toUpperCase())).length },
                { id: 'IN_PROGRESS', label: 'In Progress / Scanning', count: radiologyOrders.filter(o => ['IN_PROGRESS', 'IN PROGRESS'].includes((o.status || '').toUpperCase())).length },
                { id: 'COMPLETED', label: 'Completed & Signed', count: radiologyOrders.filter(o => (o.status || '').toUpperCase() === 'COMPLETED').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRadiologyFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    radiologyFilter === tab.id
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table of Radiology Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingRadiology ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-sm text-slate-500 font-medium">Loading IPD radiology orders...</p>
              </div>
            ) : radiologyOrders.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Radio className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">No IPD Radiology Orders</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  No inpatient imaging orders (X-Ray, Ultrasound, CT, MRI) currently pending.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100/90 text-slate-900 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Order # & Date/Time</th>
                      <th className="py-3.5 px-4 font-bold">Modality & Study</th>
                      <th className="py-3.5 px-4 font-bold">Patient & Admission</th>
                      <th className="py-3.5 px-4 font-bold">Priority</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 text-right font-bold">Workflow Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {radiologyOrders
                      .filter(o => {
                        const s = (o.status || '').toUpperCase();
                        if (radiologyFilter === 'ORDERED' && !['ORDERED', 'PENDING'].includes(s)) return false;
                        if (radiologyFilter === 'IN_PROGRESS' && !['IN_PROGRESS', 'IN PROGRESS'].includes(s)) return false;
                        if (radiologyFilter === 'COMPLETED' && s !== 'COMPLETED') return false;
                        if (radiologySearch.trim()) {
                          const q = radiologySearch.trim().toLowerCase();
                          const num = (o.order_number || o.orderNumber || o.id || '').toLowerCase();
                          const pName = (o.patient_name || o.patientName || '').toLowerCase();
                          const sName = (o.study_name || o.studyName || '').toLowerCase();
                          const adm = (o.admission_number || o.admission_id || o.admissionId || '').toLowerCase();
                          return num.includes(q) || pName.includes(q) || sName.includes(q) || adm.includes(q);
                        }
                        return true;
                      })
                      .map(order => {
                        const type = order.investigation_type || 'X-Ray';
                        let typeBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                        if (type === 'CT Scan') typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                        else if (type === 'Ultrasound') typeBadge = 'bg-teal-50 text-teal-700 border-teal-200';
                        else if (type === 'MRI') typeBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';

                        const priority = (order.priority || 'routine').toLowerCase();
                        let priorityBadge = 'bg-slate-100 text-slate-700';
                        if (priority.includes('stat') || priority === 'critical') {
                          priorityBadge = 'bg-rose-100 text-rose-800 font-bold';
                        } else if (priority === 'urgent') {
                          priorityBadge = 'bg-amber-100 text-amber-800 font-bold';
                        }

                        const status = order.status || 'ORDERED';
                        let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                        if (status === 'IN_PROGRESS') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                        else if (status === 'COMPLETED') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                        else if (status === 'CANCELLED') statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';

                        return (
                          <tr
                            key={order.id || order._id}
                            onClick={() => setViewingOrder(order)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  id={`btn-order-rad-${order.id || order._id || order.order_number}`}
                                  data-testid={`btn-order-${order.order_number || order.orderNumber || (order.id ? 'RAD-' + String(order.id).slice(0, 8) : 'RAD-IPD')}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingOrder(order);
                                  }}
                                  className="font-mono text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-900 px-2 py-0.5 rounded border border-sky-200/70 inline-block transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  title="Click to view order details"
                                >
                                  {order.order_number || order.orderNumber || (order.id ? 'RAD-' + String(order.id).slice(0, 8) : 'RAD-IPD')}
                                </button>
                                {order.originType === 'IPD' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    IPD
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    OPD
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">{formatDate(order.created_at || order.createdAt)}</span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeBadge}`}>
                                  {type}
                                </span>
                                <span className="font-semibold text-slate-900 text-xs">{order.study_name}</span>
                              </div>
                              {order.instructions && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                                  Note: {order.instructions}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 text-xs block">{order.patient_name || 'Inpatient'}</span>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                {order.originType === 'IPD' ? `Adm: ${order.admission_number || order.admission_id?.slice(0, 8) || 'Inpatient'}` : `Code: ${order.patient_code || 'OPD'}`}
                              </span>
                              {order.destination_lab_name && (
                                <span className="text-[10px] text-slate-500 block truncate max-w-[140px]" title={order.destination_lab_name}>
                                  Lab: {order.destination_lab_name}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${priorityBadge}`}>
                                {order.priority || 'routine'}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${statusBadge}`}>
                                {status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div
                                className="flex items-center justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >

                                {status === 'ORDERED' && (
                                  <button
                                    type="button"
                                    disabled={statusUpdatingOrderId === order.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartImaging(order);
                                    }}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Mark order as In-Progress"
                                  >
                                    {statusUpdatingOrderId === order.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    <span>Start Scan</span>
                                  </button>
                                )}

                                {(status === 'ORDERED' || status === 'IN_PROGRESS') && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAttachingReportOrder(order);
                                      setReportForm({
                                        findings: '',
                                        impression: '',
                                        recommendations: '',
                                        critical_findings: false,
                                        file_url: '',
                                        file_name: '',
                                        file_size: null,
                                        mime_type: ''
                                      });
                                    }}
                                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Attach Report</span>
                                  </button>
                                )}

                                {status === 'COMPLETED' && order.report && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRadiologyReport(order);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    title="View Finalized Report"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    <span>View Report</span>
                                  </button>
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
        </div>
      )}

      {/* MODAL: ATTACH RADIOLOGY REPORT (DIAGNOSTIC SPECIALIST) */}
      {attachingReportOrder && (
        <ModalPortal isOpen={Boolean(attachingReportOrder)} onClose={() => setAttachingReportOrder(null)}>
          <div 
            onClick={() => setAttachingReportOrder(null)}
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Attach Finalized Radiology Report
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Order #{attachingReportOrder.order_number || attachingReportOrder.id?.slice(0, 8)} • {attachingReportOrder.study_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachingReportOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Banner */}
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div>Patient: <strong className="text-slate-800">{attachingReportOrder.patient_name || 'Inpatient'}</strong></div>
                <div>Indication: <strong className="text-slate-800">{attachingReportOrder.clinical_indication}</strong></div>
              </div>

              {/* RBAC Notice for Technicians */}
              {!canIssueReport && (
                <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Role Policy:</strong> Technician accounts lack report issuance permission. A credentialed Radiologist, Pathologist, or Lab Admin must sign and attach finalized reports.
                  </span>
                </div>
              )}

              {/* Report Form */}
              <form onSubmit={handleAttachReportSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Radiological Findings <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reportForm.findings}
                    onChange={(e) => setReportForm(prev => ({ ...prev, findings: e.target.value }))}
                    placeholder="Document detailed radiological anatomy, observations, measurements, lung fields, bone alignment, soft tissues..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diagnostic Impression / Conclusion <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reportForm.impression}
                    onChange={(e) => setReportForm(prev => ({ ...prev, impression: e.target.value }))}
                    placeholder="Summary diagnosis (e.g. Right lower lobe pneumonia, no acute fracture identified)..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Recommendations & Follow-Up (Optional)
                  </label>
                  <input
                    type="text"
                    value={reportForm.recommendations}
                    onChange={(e) => setReportForm(prev => ({ ...prev, recommendations: e.target.value }))}
                    placeholder="e.g. Clinical correlation suggested; repeat X-Ray in 7 days after antibiotics"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* File Upload Attachment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attach Digital Scan / DICOM / PDF Report
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-300 transition-colors inline-flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{isUploadingFile ? 'Uploading...' : 'Choose Scan / PDF File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.dcm"
                        onChange={handleFileUpload}
                        disabled={isUploadingFile}
                        className="hidden"
                      />
                    </label>

                    {reportForm.file_name && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-medium">{reportForm.file_name}</span>
                        {reportForm.file_size && (
                          <span className="text-[10px] text-emerald-600">({Math.round(reportForm.file_size / 1024)} KB)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supported formats: PDF, PNG, JPG, DICOM (Max 20MB)
                  </p>
                </div>

                {/* Critical Findings Checkbox */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cb-critical-findings"
                    checked={reportForm.critical_findings}
                    onChange={(e) => setReportForm(prev => ({ ...prev, critical_findings: e.target.checked }))}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="cb-critical-findings" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Flag as Critical / Urgent Finding (notifies attending physician immediately)
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAttachingReportOrder(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport || !canIssueReport}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Signing & Attaching...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign & Finalize Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: VIEW RADIOLOGY REPORT (DIAGNOSTIC STAFF) */}
      {viewingRadiologyReport && (
        <ModalPortal isOpen={Boolean(viewingRadiologyReport)} onClose={() => setViewingRadiologyReport(null)}>
          <div 
            onClick={() => setViewingRadiologyReport(null)}
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{viewingRadiologyReport.study_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Order #{viewingRadiologyReport.order_number} • {viewingRadiologyReport.investigation_type}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRadiologyReport(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {viewingRadiologyReport.report ? (
                  <>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <strong>Final Diagnostic Report Signed:</strong> Verified by{' '}
                      <span className="font-semibold">{viewingRadiologyReport.report.uploaded_by?.name || 'Diagnostic Specialist'}</span>
                      {viewingRadiologyReport.report.finalized_at && ` on ${formatDate(viewingRadiologyReport.report.finalized_at)}`}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Findings</h4>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {viewingRadiologyReport.report.findings}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Impression</h4>
                      <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 whitespace-pre-wrap font-medium text-emerald-950 leading-relaxed">
                        {viewingRadiologyReport.report.impression}
                      </div>
                    </div>

                    {viewingRadiologyReport.report.recommendations && (
                      <div>
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">Recommendations</h4>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          {viewingRadiologyReport.report.recommendations}
                        </div>
                      </div>
                    )}

                    {viewingRadiologyReport.report.file_url && (
                      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                        <span className="font-medium text-sky-900">{viewingRadiologyReport.report.file_name || 'Attached Scan'}</span>
                        <a
                          href={viewingRadiologyReport.report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-sky-600 text-white rounded-lg font-semibold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Scan</span>
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">No report attached yet.</p>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewingRadiologyReport(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
{/* ========================================================= */}
      {/* 4. VIEW ORDER DETAILS MODAL                               */}
      {/* ========================================================= */}
      {viewingOrder && (
        <ModalPortal isOpen={Boolean(viewingOrder)} onClose={() => setViewingOrder(null)}>
          <div 
            onClick={() => setViewingOrder(null)}
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Order Details</h2>
                    <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      {viewingOrder?.order_number || viewingOrder?.orderNumber || (viewingOrder?.id ? (viewingOrder.originType === 'IPD' ? 'RAD-' : 'ORD-') + String(viewingOrder.id).slice(0, 8) : 'Order Details')}
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
                      {(viewingOrder?.total_amount !== null && viewingOrder?.total_amount !== undefined) || (viewingOrder?.price !== null && viewingOrder?.price !== undefined) ? (
                        `₹${Number(viewingOrder.total_amount ?? viewingOrder.price).toLocaleString('en-IN')}`
                      ) : (
                        <span className="text-sm font-semibold text-slate-500 italic">Tariff Not Set</span>
                      )}
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
                      {(viewingOrder.patient && (viewingOrder.patient.first_name || viewingOrder.patient.last_name))
                        ? `${viewingOrder.patient.first_name || ''} ${viewingOrder.patient.last_name || ''}`.trim()
                        : (viewingOrder.patient_name || viewingOrder.patientName || (typeof viewingOrder.patient === 'string' ? viewingOrder.patient : 'Patient'))}
                    </p>
                    <p className="text-slate-600">
                      Phone: <span className="font-medium">{viewingOrder.patient?.phone_number || viewingOrder.patient_phone || viewingOrder.phone || 'N/A'}</span>
                    </p>
                    <p className="text-slate-600">
                      Gender: <span className="font-medium capitalize">{viewingOrder.patient?.gender || viewingOrder.gender || 'N/A'}</span>
                    </p>
                    {(viewingOrder.patient?.patient_code || viewingOrder.patient_code || viewingOrder.patientCode || viewingOrder.admission_number || viewingOrder.admission_id) && (
                      <p className="text-slate-500 text-[11px]">
                        {viewingOrder.admission_number || viewingOrder.admission_id ? 'Adm #:' : 'ID:'} <span className="font-mono">{viewingOrder.patient?.patient_code || viewingOrder.patient_code || viewingOrder.patientCode || viewingOrder.admission_number || viewingOrder.admission_id}</span>
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
                    {(viewingOrder.ordering_type === 'doctor' || viewingOrder.doctor || viewingOrder.doctor_name || viewingOrder.doctorName) ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider">Order Creator</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {(viewingOrder.ordering_type === 'doctor' || viewingOrder.doctor || viewingOrder.doctor_name || viewingOrder.doctorName) ? (
                      <>
                        <p className="font-bold text-slate-900 text-sm">
                          {(() => {
                            if (viewingOrder.doctor && typeof viewingOrder.doctor === 'object') {
                              const docName = `${viewingOrder.doctor.first_name || ''} ${viewingOrder.doctor.last_name || ''}`.trim();
                              return docName ? (docName.startsWith('Dr.') ? docName : `Dr. ${docName}`) : (viewingOrder.doctor_name || viewingOrder.doctorName || 'Dr. Doctor');
                            }
                            if (viewingOrder.doctor_name || viewingOrder.doctorName) {
                              const name = viewingOrder.doctor_name || viewingOrder.doctorName;
                              return name.startsWith('Dr.') ? name : `Dr. ${name}`;
                            }
                            return 'Dr. Doctor';
                          })()}
                        </p>
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="text-slate-500">Role:</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            Doctor
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Specialty: <span className="font-medium">{viewingOrder.doctor?.specialty || viewingOrder.specialty || 'General Practitioner'}</span>
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

              {(() => {
                const radItems = (viewingOrder.items || []).filter(i => i.item_type === 'radiology');
                const standardItems = (viewingOrder.items || []).filter(i => i.item_type !== 'radiology');
                const isRadOrder = radItems.length > 0 || Boolean(viewingOrder.study_name || viewingOrder.modality || viewingOrder.investigation_type);

                return (
                  <div className="space-y-4">
                    {/* Radiology Investigations Card */}
                    {isRadOrder && (
                      <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-sky-700" />
                            <span className="font-bold text-sky-950 text-xs">
                              Radiology & Imaging Investigation
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                            {radItems[0]?.modality || viewingOrder.modality || viewingOrder.investigation_type || 'Radiology'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Study / Protocol:
                            </span>
                            <span className="font-semibold text-slate-900 block mt-0.5">
                              {radItems[0]?.study_name || viewingOrder.study_name || radItems[0]?.item_name || 'Radiology Study'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Clinical Indication:
                            </span>
                            <span className="text-slate-800 block mt-0.5">
                              {radItems[0]?.clinical_indication || viewingOrder.clinical_indication || viewingOrder.clinical_notes || 'Diagnostic Investigation'}
                            </span>
                          </div>

                          {(radItems[0]?.instructions || viewingOrder.instructions) && (
                            <div className="sm:col-span-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Instructions / Notes:
                              </span>
                              <span className="text-slate-700 italic block mt-0.5">
                                {radItems[0]?.instructions || viewingOrder.instructions}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Patient Context:
                            </span>
                            <span className="text-slate-800 block mt-0.5">
                              {viewingOrder.admission_id || viewingOrder.admission_number || viewingOrder.originType === 'IPD' ? (
                                <span className="font-semibold text-indigo-700">
                                  Inpatient (Admission: {viewingOrder.admission_number || viewingOrder.admission_id?.slice(0, 8)})
                                </span>
                              ) : (
                                <span className="text-slate-700">
                                  Outpatient (Code: {viewingOrder.patient?.patient_code || viewingOrder.patient_code || 'OPD'})
                                </span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Destination Lab:
                            </span>
                            <span className="text-slate-800 font-medium block mt-0.5">
                              {viewingOrder.lab?.lab_name || viewingOrder.destination_lab_name || viewingOrder.lab_name || 'Assigned Laboratory'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Investigation Tariff:
                            </span>
                            <span className="text-slate-900 font-bold block mt-0.5 font-mono">
                              {(viewingOrder.price !== null && viewingOrder.price !== undefined) || (viewingOrder.total_amount !== null && viewingOrder.total_amount !== undefined)
                                ? `₹${Number(viewingOrder.price ?? viewingOrder.total_amount).toLocaleString('en-IN')}`
                                : <span className="text-slate-500 italic font-normal font-sans">Tariff Not Set</span>}
                            </span>
                          </div>
                        </div>

                        {/* Finalized Radiology Diagnostic Report Details */}
                        {viewingOrder.report && (
                          <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                              <div className="flex items-center gap-1.5">
                                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                                <span className="font-bold text-emerald-950 text-xs">
                                  Finalized Diagnostic Radiology Report
                                </span>
                              </div>
                              {viewingOrder.report.critical_findings && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  Critical Alert
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Findings:</span>
                              <p className="text-xs text-slate-900 mt-0.5 bg-white p-2 rounded border border-emerald-100">
                                {viewingOrder.report.findings}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Specialist Impression:</span>
                              <p className="text-xs font-semibold text-emerald-950 mt-0.5 bg-white p-2 rounded border border-emerald-100">
                                {viewingOrder.report.impression}
                              </p>
                            </div>

                            {viewingOrder.report.recommendations && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommendations:</span>
                                <p className="text-xs text-slate-700 mt-0.5 bg-white p-2 rounded border border-emerald-100">
                                  {viewingOrder.report.recommendations}
                                </p>
                              </div>
                            )}

                            {viewingOrder.report.file_url && (
                              <div className="pt-1 flex justify-end">
                                <a
                                  href={viewingOrder.report.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Scan / Report File</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {radItems.length > 1 && (
                          <div className="pt-2 border-t border-sky-200/60 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-600 block">
                              Additional Ordered Imaging Studies ({radItems.length - 1}):
                            </span>
                            {radItems.slice(1).map((r, rIdx) => (
                              <div key={rIdx} className="p-2 bg-white rounded-lg border border-sky-100 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-900">{r.modality}: {r.study_name || r.item_name}</span>
                                  {r.clinical_indication && (
                                    <p className="text-[11px] text-slate-500">Indication: {r.clinical_indication}</p>
                                  )}
                                </div>
                                <span className="font-bold text-slate-800">₹{Number(r.price || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Pathology Tests & Packages (if any) */}
                    {standardItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-teal-600" />
                          <span>Ordered Pathology Tests & Packages ({standardItems.length})</span>
                        </h4>

                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {standardItems.map((item, idx) => (
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
                    )}
                  </div>
                );
              })()}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created: {formatDate(viewingOrder.created_at || viewingOrder.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated: {formatDate(viewingOrder.updated_at || viewingOrder.updatedAt || viewingOrder.created_at || viewingOrder.createdAt)}</span>
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
          <div 
            onClick={() => setActionOrder(null)}
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto flex flex-col my-auto animate-in zoom-in-95 duration-200"
            >
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
