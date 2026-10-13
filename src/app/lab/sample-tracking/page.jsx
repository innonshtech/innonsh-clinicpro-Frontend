'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ModalPortal from '@/components/ModalPortal';
import { getPriorityBadge } from '@/components/LabOrdersManagement';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  QrCode,
  X,
  AlertTriangle,
  Building2,
  User,
  FlaskConical,
  ArrowRight,
  ShieldAlert,
  TestTube,
  FileCheck
} from 'lucide-react';

const REJECTION_CATEGORIES = [
  'Hemolyzed Specimen',
  'Insufficient Volume (QNS)',
  'Clotted Sample',
  'Improper Container / Tube',
  'Labeling / ID Discrepancy',
  'Temperature / Transit Delay',
  'Contaminated Sample',
  'Other Quality Failure'
];

const formatDate = (dateStr) => {
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
  const s = (status || 'collected').toLowerCase();
  switch (s) {
    case 'received':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          At Bench / Received
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Rejected
        </span>
      );
    case 'recollection_requested':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Recollection Pending
        </span>
      );
    case 'collected':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Collected (In-Transit)
        </span>
      );
  }
};

export default function SampleTrackingPage() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [viewingSample, setViewingSample] = useState(null);
  const [rejectingSample, setRejectingSample] = useState(null);
  const [rejectForm, setRejectForm] = useState({
    rejection_category: 'Hemolyzed Specimen',
    rejection_reason: '',
    notes: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Samples
  const fetchSamples = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/samples`, { headers });
      } catch (e) {
        res = await axios.get('/api/v1/lab/samples', { headers });
      }
      const fetched = res.data?.data?.samples || res.data?.samples || [];
      setSamples(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching sample tracking data:', err);
      toast.error(err.response?.data?.message || 'Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  // Filter & Search
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      if (statusFilter !== 'all' && (s.collection_status || 'collected').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const bcode = (s.barcode || '').toLowerCase();
        const oNum = (s.order?.order_number || s.order_number || '').toLowerCase();
        const pName = `${s.order?.patient?.first_name || s.patient_name || ''} ${s.order?.patient?.last_name || ''}`.toLowerCase();
        const sType = (s.sample_type || '').toLowerCase();
        if (!bcode.includes(q) && !oNum.includes(q) && !pName.includes(q) && !sType.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [samples, statusFilter, searchTerm]);

  // Tab counts
  const counts = useMemo(() => {
    const total = samples.length;
    const collected = samples.filter((s) => (s.collection_status || '').toLowerCase() === 'collected').length;
    const received = samples.filter((s) => (s.collection_status || '').toLowerCase() === 'received').length;
    const rejected = samples.filter((s) => {
      const st = (s.collection_status || '').toLowerCase();
      return st === 'rejected' || st === 'recollection_requested';
    }).length;
    return { total, collected, received, rejected };
  }, [samples]);

  // Mark Received (Bench Check-In)
  const handleMarkReceived = async (sample) => {
    setSubmittingAction(true);
    const headers = getAuthHeaders();
    try {
      try {
        await axios.put(`${API_BASE_URL}/api/v1/lab/samples/${sample.id}/receive`, {}, { headers });
      } catch (e) {
        await axios.put(`/api/v1/lab/samples/${sample.id}/receive`, {}, { headers });
      }

      toast.success(`Specimen ${sample.barcode} checked in and marked Received at bench`);
      if (viewingSample && viewingSample.id === sample.id) {
        setViewingSample(null);
      }
      await fetchSamples();
    } catch (err) {
      console.error('Error receiving sample:', err);
      toast.error(err.response?.data?.message || 'Failed to check in specimen');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Rejection
  const handleSubmitRejection = async (e) => {
    e.preventDefault();
    if (!rejectingSample) return;

    if (!rejectForm.rejection_reason.trim()) {
      toast.error('Rejection reason is mandatory');
      return;
    }

    setSubmittingAction(true);
    const headers = getAuthHeaders();
    const payload = {
      rejection_category: rejectForm.rejection_category,
      rejection_reason: rejectForm.rejection_reason.trim(),
      notes: rejectForm.notes.trim() || null
    };

    try {
      try {
        await axios.put(`${API_BASE_URL}/api/v1/lab/samples/${rejectingSample.id}/reject`, payload, { headers });
      } catch (e) {
        await axios.put(`/api/v1/lab/samples/${rejectingSample.id}/reject`, payload, { headers });
      }

      toast.success(`Specimen ${rejectingSample.barcode} marked as Rejected`);
      setRejectingSample(null);
      if (viewingSample && viewingSample.id === rejectingSample.id) {
        setViewingSample(null);
      }
      await fetchSamples();
    } catch (err) {
      console.error('Error rejecting sample:', err);
      toast.error(err.response?.data?.message || 'Failed to reject specimen');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <Truck className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Specimen Lifecycle</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sample Tracking</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor physical specimen status from phlebotomy collection to bench receiving and processing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/lab/sample-collection"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <TestTube className="w-3.5 h-3.5" />
            <span>Collect New Sample</span>
          </Link>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Barcode, Patient Name, Order #, or Sample Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
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
              <span>All Specimens</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('collected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'collected'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>In-Transit ({counts.collected})</span>
            </button>

            <button
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'received'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Received at Bench ({counts.received})</span>
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
              <span>Rejected ({counts.rejected})</span>
            </button>
          </div>

          {counts.rejected > 0 && (
            <Link
              href="/lab/recollections"
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Manage Recollections ({counts.rejected})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Samples Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading tracking data...</p>
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Specimens Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No specimens match your search or filter criteria.'
                : 'No diagnostic samples have been logged in your laboratory yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Barcode / Label</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSamples.map((sample) => {
                  const isCollected = (sample.collection_status || '').toLowerCase() === 'collected';
                  const isReceived = (sample.collection_status || '').toLowerCase() === 'received';
                  const isRejected = (sample.collection_status || '').toLowerCase() === 'rejected';

                  return (
                    <tr
                      key={sample.id}
                      onClick={() => setViewingSample(sample)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setViewingSample(sample);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View specimen ${sample.barcode} details`}
                      className="cursor-pointer hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                          <span
                            className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 break-all select-all hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                            title="Click to view specimen details"
                          >
                            {sample.barcode}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getPriorityBadge(sample.order?.priority || sample.priority)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {sample.order?.patient?.first_name || sample.patient_name || 'Patient'} {sample.order?.patient?.last_name || ''}
                        </span>
                        {sample.order?.clinic?.clinic_name && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={sample.order.clinic.clinic_name}>
                            {sample.order.clinic.clinic_name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {sample.sample_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Coll:</span>
                            <span>{formatDate(sample.collected_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Bench:</span>
                            {sample.received_at ? (
                              <span className="text-emerald-700 font-medium">{formatDate(sample.received_at)}</span>
                            ) : (
                              <span className="text-slate-400 italic">Pending receipt</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(sample.collection_status)}
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Check-In at Bench (if collected) */}
                          {isCollected && (
                            <button
                              id={`btn-receive-${sample.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkReceived(sample);
                              }}
                              disabled={submittingAction}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs"
                              title="Mark Specimen Received at Bench"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Enter Results (if received at bench) */}
                          {isReceived && (
                            <Link
                              href={`/lab/result-entry?sampleId=${sample.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs"
                              title="Enter Diagnostic Results for this Specimen"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Enter Results</span>
                            </Link>
                          )}

                          {/* Reject (if not already rejected) */}
                          {(isCollected || isReceived) && (
                            <button
                              id={`btn-reject-sample-${sample.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectingSample(sample);
                                setRejectForm({
                                  rejection_category: 'Hemolyzed Specimen',
                                  rejection_reason: '',
                                  notes: ''
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Specimen (Quality Failure)"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Recollection link if rejected */}
                          {isRejected && (
                            <Link
                              href="/lab/recollections"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 border border-purple-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Recollect</span>
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

      {/* View Sample Details Modal */}
      {viewingSample && (
        <ModalPortal isOpen={Boolean(viewingSample)} onClose={() => setViewingSample(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto flex flex-col my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Specimen Details</h3>
              </div>
              <button
                onClick={() => setViewingSample(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingSample && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Tracking Barcode</span>
                    <span className="font-mono text-sm font-bold text-teal-800 break-all">{viewingSample.barcode}</span>
                  </div>
                  <div>{getStatusBadge(viewingSample.collection_status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {viewingSample.order?.patient?.first_name || viewingSample.patient_name || 'Patient'} {viewingSample.order?.patient?.last_name || ''}
                    </span>
                    {(viewingSample.order?.patient?.patient_code || viewingSample.patient_code) && (
                      <span className="text-slate-500 font-mono text-[10px] block mt-0.5">
                        ID: {viewingSample.order?.patient?.patient_code || viewingSample.patient_code}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order & Priority</span>
                    <span className="font-mono font-semibold text-teal-700 mt-0.5 block">
                      {viewingSample.order?.order_number || viewingSample.order_number || 'N/A'}
                    </span>
                    <div className="mt-1">
                      {getPriorityBadge(viewingSample.order?.priority || viewingSample.priority)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sample Type</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{viewingSample.sample_type}</span>
                </div>

              {/* Chain of Custody */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">Chain of Custody</h4>
                <div className="divide-y divide-slate-200/60 text-[11px]">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Collected At:</span>
                    <span className="font-medium text-slate-800">{formatDate(viewingSample.collected_at)}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Collected By:</span>
                    <span className="font-medium text-slate-800">{viewingSample.collected_by || 'Staff'}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Bench Check-In:</span>
                    <span className="font-medium text-slate-800">{formatDate(viewingSample.received_at)}</span>
                  </div>
                  {viewingSample.received_by && (
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500">Received By:</span>
                      <span className="font-medium text-slate-800">{viewingSample.received_by}</span>
                    </div>
                  )}
                  {viewingSample.rejected_at && (
                    <div className="py-1.5 flex justify-between text-red-700">
                      <span className="font-semibold">Rejected At:</span>
                      <span>{formatDate(viewingSample.rejected_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection notice if present */}
              {viewingSample.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Rejection Reason: {viewingSample.rejection_category || 'Quality Failure'}</span>
                  </div>
                  <p>{viewingSample.rejection_reason}</p>
                </div>
              )}

              {viewingSample.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold block text-slate-700 mb-0.5">Notes:</span>
                  <p>{viewingSample.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {viewingSample && (viewingSample.collection_status || '').toLowerCase() === 'collected' && (
                <button
                  type="button"
                  onClick={() => handleMarkReceived(viewingSample)}
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Check In at Bench</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingSample(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Reject Specimen Modal */}
      {rejectingSample && (
        <ModalPortal isOpen={Boolean(rejectingSample)} onClose={() => setRejectingSample(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] overflow-y-auto flex flex-col my-auto animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center shrink-0">
                <h3 className="text-base font-bold text-slate-900">Reject Specimen</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Rejecting specimen <span className="font-mono font-bold text-slate-800">{rejectingSample?.barcode}</span> stops testing and allows recollection.
                </p>
              </div>

            <form onSubmit={handleSubmitRejection} className="space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quality Failure Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectForm.rejection_category}
                  onChange={(e) => setRejectForm(prev => ({ ...prev, rejection_category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                >
                  {REJECTION_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specific Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Gross hemolysis present; cannot perform potassium analysis accurately..."
                  value={rejectForm.rejection_reason}
                  onChange={(e) => setRejectForm(prev => ({ ...prev, rejection_reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Internal Quality Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional technician notes..."
                  value={rejectForm.notes}
                  onChange={(e) => setRejectForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingSample(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-sample-reject"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {submittingAction && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Confirm Rejection</span>
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
