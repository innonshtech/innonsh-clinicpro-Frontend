'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  FlaskConical,
  RefreshCw,
  X,
  QrCode,
  Lock,
  Edit3,
  ShieldCheck,
  ArrowRight,
  FileCheck,
  FileText
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

export default function ResultValidationPage() {
  const [queue, setQueue] = useState([]);
  const [validatedHistory, setValidatedHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [reviewingGroup, setReviewingGroup] = useState(null);
  const [validationRemarks, setValidationRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Correction Modal state
  const [correctingResult, setCorrectingResult] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    new_result_value: '',
    correction_reason: '',
    technician_remarks: ''
  });

  // Fetch validation queue & history
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // 1. Fetch review queue (entered / corrected)
      let qRes;
      try {
        qRes = await axios.get(`${API_BASE_URL}/api/v1/lab/results/validation-queue`, { headers });
      } catch (e) {
        qRes = await axios.get('/api/v1/lab/results/validation-queue', { headers });
      }
      const fetchedQueue = qRes.data?.data?.queue || qRes.data?.queue || [];
      setQueue(Array.isArray(fetchedQueue) ? fetchedQueue : []);

      // 2. Fetch validated history
      let hRes;
      try {
        hRes = await axios.get(`${API_BASE_URL}/api/v1/lab/results?status=validated`, { headers });
      } catch (e) {
        hRes = await axios.get('/api/v1/lab/results?status=validated', { headers });
      }
      const fetchedHistory = hRes.data?.data?.results || hRes.data?.results || [];
      setValidatedHistory(Array.isArray(fetchedHistory) ? fetchedHistory : []);
    } catch (err) {
      console.error('Error fetching validation data:', err);
      toast.error(err.response?.data?.message || 'Failed to load validation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Validation Signoff
  const handleValidateGroup = async (group) => {
    if (!group || !group.results || group.results.length === 0) return;

    setSubmittingAction(true);
    const headers = getAuthHeaders();
    const resultIds = group.results.map((r) => r.id);

    try {
      let res;
      try {
        res = await axios.post(
          `${API_BASE_URL}/api/v1/lab/results/validate`,
          {
            result_ids: resultIds,
            validation_remarks: validationRemarks.trim() || null
          },
          { headers }
        );
      } catch (beErr) {
        res = await axios.post(
          '/api/v1/lab/results/validate',
          {
            result_ids: resultIds,
            validation_remarks: validationRemarks.trim() || null
          },
          { headers }
        );
      }

      toast.success(`Successfully validated ${resultIds.length} result parameters for ${group.sample_barcode}`);
      setReviewingGroup(null);
      setValidationRemarks('');
      await fetchData();
    } catch (err) {
      console.error('Error validating results:', err);
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Result Correction
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctingResult) return;

    if (!correctionForm.correction_reason.trim() || correctionForm.correction_reason.trim().length < 5) {
      toast.error('A detailed correction reason (min 5 characters) is required');
      return;
    }
    if (!correctionForm.new_result_value.trim()) {
      toast.error('New result value is required');
      return;
    }

    setSubmittingAction(true);
    const headers = getAuthHeaders();

    try {
      let res;
      try {
        res = await axios.post(
          `${API_BASE_URL}/api/v1/lab/results/${correctingResult.id}/correct`,
          {
            new_result_value: correctionForm.new_result_value.trim(),
            correction_reason: correctionForm.correction_reason.trim(),
            technician_remarks: correctionForm.technician_remarks.trim() || null
          },
          { headers }
        );
      } catch (beErr) {
        res = await axios.post(
          `/api/v1/lab/results/${correctingResult.id}/correct`,
          {
            new_result_value: correctionForm.new_result_value.trim(),
            correction_reason: correctionForm.correction_reason.trim(),
            technician_remarks: correctionForm.technician_remarks.trim() || null
          },
          { headers }
        );
      }

      toast.success('Result corrected and queued for re-validation signoff');
      setCorrectingResult(null);
      setCorrectionForm({ new_result_value: '', correction_reason: '', technician_remarks: '' });
      await fetchData();
    } catch (err) {
      console.error('Error submitting correction:', err);
      toast.error(err.response?.data?.message || 'Failed to correct result');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Search filtered queue
  const filteredQueue = useMemo(() => {
    if (!searchTerm.trim()) return queue;
    const q = searchTerm.trim().toLowerCase();
    return queue.filter((g) => {
      const bCode = (g.sample_barcode || '').toLowerCase();
      const oNum = (g.order_number || '').toLowerCase();
      const pName = (g.patient_name || '').toLowerCase();
      return bCode.includes(q) || oNum.includes(q) || pName.includes(q);
    });
  }, [queue, searchTerm]);

  // Search filtered history
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return validatedHistory;
    const q = searchTerm.trim().toLowerCase();
    return validatedHistory.filter((r) => {
      const bCode = (r.sample?.barcode || r.sample_barcode || '').toLowerCase();
      const oNum = (r.order?.order_number || r.order_number || '').toLowerCase();
      const pName = (r.patient_name || '').toLowerCase();
      const pParam = (r.parameter_name || '').toLowerCase();
      return bCode.includes(q) || oNum.includes(q) || pName.includes(q) || pParam.includes(q);
    });
  }, [validatedHistory, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Result Validation & Signoff</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pathology Review
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review entered diagnostic values, verify reference ranges, and authorize clinical signoff.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/lab/result-entry"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Enter Results</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Awaiting Validation Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Validated Archive ({validatedHistory.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by barcode, order number, or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 shadow-xs"
          />
        </div>
      </div>

      {/* TAB 1: VALIDATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-slate-500 font-medium">Loading review queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 px-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Queue is Clear</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                All entered diagnostic results have been authorized and signed off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredQueue.map((group) => (
                <div
                  key={group.sample_id || group.order_id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                    group.has_critical ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {group.sample_barcode}
                          </span>
                          <span className="text-xs font-semibold text-teal-700 font-mono">
                            {group.order_number}
                          </span>
                          {group.has_critical && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" />
                              <span>CRITICAL ALERT</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Patient: <strong className="text-slate-800">{group.patient_name}</strong> • Specimen:{' '}
                          <span className="font-medium text-slate-700">{group.sample_type}</span> • Entered by:{' '}
                          <span className="text-slate-700">{group.entered_by}</span> ({formatDate(group.entered_at)})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewingGroup(group)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Review & Sign Off</span>
                      </button>
                    </div>
                  </div>

                  {/* Parameter Preview Table */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Test Parameter</th>
                          <th className="py-2 px-3">Measured Value</th>
                          <th className="py-2 px-3">Unit</th>
                          <th className="py-2 px-3">Reference Range</th>
                          <th className="py-2 px-3">Interpretation</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.results.map((r) => (
                          <tr key={r.id} className={r.is_critical ? 'bg-red-50/40' : ''}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{r.parameter_name}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 font-mono text-xs">{r.result_value}</td>
                            <td className="py-2 px-3 text-slate-500">{r.unit || '—'}</td>
                            <td className="py-2 px-3 text-slate-500">{r.reference_range || '—'}</td>
                            <td className="py-2 px-3">
                              {r.interpretation === 'critical_high' || r.interpretation === 'critical_low' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  {r.interpretation.replace('_', ' ').toUpperCase()}
                                </span>
                              ) : r.interpretation === 'abnormal' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  ABNORMAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                                  NORMAL
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                                Awaiting Validation
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VALIDATED ARCHIVE */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-slate-500 font-medium">Loading validated archive...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Validated Records Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Authorized results will appear in this permanent diagnostic archive.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Specimen Barcode</th>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Parameter</th>
                    <th className="py-3.5 px-4">Value</th>
                    <th className="py-3.5 px-4">Validated By</th>
                    <th className="py-3.5 px-4">Validation Time</th>
                    <th className="py-3.5 px-4 text-right">Lock / Correct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHistory.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-mono font-bold text-slate-900">
                        {r.sample?.barcode || r.sample_barcode || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-700 font-semibold">
                        {r.order?.order_number || r.order_number || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {r.order?.patient?.first_name || r.patient_name || 'Patient'} {r.order?.patient?.last_name || ''}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.parameter_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.result_value} <span className="font-normal text-slate-500 text-[11px]">{r.unit || ''}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-800 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{r.validated_by || 'Pathologist'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(r.validated_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className="p-1.5 text-slate-400 bg-slate-100 rounded-lg inline-flex items-center"
                            title="Validated Result Locked from Direct Overwrite"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </span>

                          <button
                            onClick={() => {
                              setCorrectingResult(r);
                              setCorrectionForm({
                                new_result_value: r.result_value,
                                correction_reason: '',
                                technician_remarks: ''
                              });
                            }}
                            className="px-2.5 py-1 text-slate-700 hover:text-amber-700 bg-white border border-slate-200 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                            title="Issue Clinical Correction (creates auditable revision)"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Correct</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* REVIEW & SIGNOFF MODAL                                    */}
      {/* ========================================================= */}
      {reviewingGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Authorize & Sign Off Results</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {reviewingGroup.sample_barcode} • Order {reviewingGroup.order_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewingGroup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <p>
                Patient: <strong className="text-slate-800">{reviewingGroup.patient_name}</strong>
              </p>
              <p>
                Specimen Type: <strong className="text-slate-800">{reviewingGroup.sample_type}</strong>
              </p>
              <p>
                Entered By: <strong className="text-slate-800">{reviewingGroup.entered_by}</strong> ({formatDate(reviewingGroup.entered_at)})
              </p>
            </div>

            {/* Parameters list */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {reviewingGroup.results.map((r) => (
                <div key={r.id} className="p-3 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-bold text-slate-900">{r.parameter_name}</span>
                    <span className="text-slate-400 block text-[11px]">
                      Ref Range: {r.reference_range || 'Standard'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-slate-900 block">
                      {r.result_value} {r.unit || ''}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase">{r.interpretation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pathologist / Validation Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Findings correlate with clinical presentation. Approved for reporting."
                value={validationRemarks}
                onChange={(e) => setValidationRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewingGroup(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleValidateGroup(reviewingGroup)}
                disabled={submittingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                {submittingAction && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Clinical Signoff</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESULT CORRECTION MODAL                                   */}
      {/* ========================================================= */}
      {correctingResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clinical Result Correction</h3>
                  <p className="text-xs text-slate-500">{correctingResult.parameter_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCorrectingResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>
                Previous Validated Value:{' '}
                <strong className="text-slate-900 font-mono">
                  {correctingResult.result_value} {correctingResult.unit || ''}
                </strong>
              </p>
              <p className="text-slate-500">
                Preserves audit history: original record remains linked and flagged as superseded.
              </p>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Measured Value *
                </label>
                <input
                  type="text"
                  required
                  value={correctionForm.new_result_value}
                  onChange={(e) => setCorrectionForm((prev) => ({ ...prev, new_result_value: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Correction Reason * (min 5 characters)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Dilution calculation correction verified on rerun."
                  value={correctionForm.correction_reason}
                  onChange={(e) => setCorrectionForm((prev) => ({ ...prev, correction_reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingResult(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                >
                  {submittingAction && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Issue Correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
