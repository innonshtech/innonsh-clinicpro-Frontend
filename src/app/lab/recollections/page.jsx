'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  X,
  Truck,
  Building2,
  User,
  FlaskConical,
  ArrowRight,
  ShieldAlert,
  TestTube
} from 'lucide-react';

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

export default function RecollectionsPage() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Recollection modal state
  const [selectedSample, setSelectedSample] = useState(null);
  const [recollectForm, setRecollectForm] = useState({
    collected_by: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch rejected & recollection samples
  const fetchRecollectionData = async () => {
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
      // Filter for rejected or recollection_requested or replacement samples
      const filtered = (Array.isArray(fetched) ? fetched : []).filter(s => {
        const st = (s.collection_status || '').toLowerCase();
        return st === 'rejected' || st === 'recollection_requested' || s.is_recollection;
      });
      setSamples(filtered);
    } catch (err) {
      console.error('Error fetching recollections data:', err);
      toast.error(err.response?.data?.message || 'Failed to load recollection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecollectionData();
  }, []);

  // Filtered samples
  const filteredSamples = useMemo(() => {
    if (!searchTerm.trim()) return samples;
    const q = searchTerm.trim().toLowerCase();
    return samples.filter(s => {
      const bcode = (s.barcode || '').toLowerCase();
      const oNum = (s.order?.order_number || s.order_number || '').toLowerCase();
      const pName = `${s.order?.patient?.first_name || s.patient_name || ''} ${s.order?.patient?.last_name || ''}`.toLowerCase();
      const reason = (s.rejection_reason || '').toLowerCase();
      const cat = (s.rejection_category || '').toLowerCase();
      return bcode.includes(q) || oNum.includes(q) || pName.includes(q) || reason.includes(q) || cat.includes(q);
    });
  }, [samples, searchTerm]);

  // Open modal
  const openRecollectModal = (sample) => {
    let labUser = null;
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) labUser = JSON.parse(uStr);
    } catch (e) {}

    setSelectedSample(sample);
    setRecollectForm({
      collected_by: labUser?.name || 'Lab Phlebotomist',
      notes: ''
    });
  };

  // Submit recollection
  const handleSubmitRecollection = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    setSubmitting(true);
    const headers = getAuthHeaders();
    const payload = {
      collected_by: recollectForm.collected_by.trim() || 'Lab Phlebotomist',
      notes: recollectForm.notes.trim() || null
    };

    try {
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/samples/${selectedSample.id}/recollect`, payload, { headers });
      } catch (e) {
        res = await axios.post(`/api/v1/lab/samples/${selectedSample.id}/recollect`, payload, { headers });
      }

      const replacementBarcode = res.data?.data?.replacementSample?.barcode || 'Created';
      toast.success(
        `Recollection logged! New replacement specimen generated: ${replacementBarcode}`
      );
      setSelectedSample(null);
      await fetchRecollectionData();
    } catch (err) {
      console.error('Error requesting recollection:', err);
      toast.error(err.response?.data?.message || 'Failed to request recollection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-red-600 mb-1">
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Quality Assurance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sample Rejection & Recollection</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit rejected specimens, record quality failure reasons, and trigger re-draws with linked replacement barcodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/lab/sample-tracking"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Sample Tracking</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Barcode, Patient, Order #, or Rejection Reason..."
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

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading rejection records...</p>
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Rejected Specimens</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              All collected samples are healthy and in active diagnostic processing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Barcode / Label</th>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Specimen</th>
                  <th className="py-3.5 px-4">Failure Category</th>
                  <th className="py-3.5 px-4">Specific Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSamples.map((sample) => {
                  const isRejected = (sample.collection_status || '').toLowerCase() === 'rejected';
                  const isRecollectionRequested = (sample.collection_status || '').toLowerCase() === 'recollection_requested';
                  const isReplacement = sample.is_recollection;

                  return (
                    <tr key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-500" />
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {sample.barcode}
                          </span>
                        </div>
                        {isReplacement && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            Replacement Specimen
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-semibold text-teal-700">
                          {sample.order?.order_number || sample.order_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {sample.order?.patient?.first_name || sample.patient_name || 'Patient'} {sample.order?.patient?.last_name || ''}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {sample.sample_type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-red-700 text-xs">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                          <span>{sample.rejection_category || (isReplacement ? 'Recollected' : 'Quality Failure')}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 max-w-xs">
                        <p className="truncate" title={sample.rejection_reason || sample.notes || 'N/A'}>
                          {sample.rejection_reason || sample.notes || '—'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {isRejected ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Rejected
                          </span>
                        ) : isRecollectionRequested ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Recollection Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active Replacement
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isRejected ? (
                          <button
                            id={`btn-recollect-${sample.id}`}
                            onClick={() => openRecollectModal(sample)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request Recollection</span>
                          </button>
                        ) : (
                          <Link
                            href="/lab/sample-tracking"
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                          >
                            <span>Track Specimen</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recollect Action Modal */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center shrink-0">
              <h3 className="text-base font-bold text-slate-900">Request Sample Recollection</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatches a recollection request for rejected specimen <span className="font-mono font-bold text-slate-800">{selectedSample.barcode}</span>. A new tracking barcode will be linked while preserving the original rejection history.
              </p>
            </div>

            <form onSubmit={handleSubmitRecollection} className="space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
                <span className="font-bold text-red-900 block">Original Rejection Reason:</span>
                <p className="text-red-800">{selectedSample.rejection_reason}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsible Phlebotomist / Staff <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={recollectForm.collected_by}
                  onChange={(e) => setRecollectForm(prev => ({ ...prev, collected_by: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recollection Protocol Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Draw fasting specimen gently using 21G needle to avoid hemolysis..."
                  value={recollectForm.notes}
                  onChange={(e) => setRecollectForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSample(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-recollection"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Spawn Replacement Sample</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
