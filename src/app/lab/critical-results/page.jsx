'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  User,
  FlaskConical,
  RefreshCw,
  X,
  QrCode,
  ShieldAlert,
  PhoneCall,
  Settings,
  Plus,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

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

export default function CriticalResultsPage() {
  const [criticalResults, setCriticalResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unacknowledged' | 'acknowledged'

  // Acknowledgment Modal
  const [acknowledgingResult, setAcknowledgingResult] = useState(null);
  const [ackForm, setAckForm] = useState({
    physician_name: '',
    notes: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Critical Rules Configuration Modal
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    parameter_name: '',
    test_code: '',
    critical_low: '',
    critical_high: '',
    unit: 'mg/dL'
  });

  // Fetch critical results
  const fetchCriticalResults = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/results/critical?status=${statusFilter}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/results/critical?status=${statusFilter}`, { headers });
      }

      const fetched = res.data?.data?.criticalResults || res.data?.criticalResults || [];
      setCriticalResults(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching critical results:', err);
      toast.error(err.response?.data?.message || 'Failed to load critical findings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch critical rules
  const fetchCriticalRules = async () => {
    try {
      setLoadingRules(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/results/critical-rules`, { headers });
      } catch (e) {
        res = await axios.get('/api/v1/lab/results/critical-rules', { headers });
      }
      setRules(res.data?.data?.rules || res.data?.rules || []);
    } catch (err) {
      console.error('Error fetching critical rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchCriticalResults();
  }, [statusFilter]);

  // Open Acknowledgment Modal
  const openAckModal = (result) => {
    setAcknowledgingResult(result);
    setAckForm({
      physician_name: result.order?.doctor ? `Dr. ${result.order.doctor.first_name || ''} ${result.order.doctor.last_name || ''}`.trim() : '',
      notes: ''
    });
  };

  // Submit Acknowledgment
  const handleSubmitAcknowledgment = async (e) => {
    e.preventDefault();
    if (!acknowledgingResult) return;

    setSubmittingAction(true);
    const headers = getAuthHeaders();

    const noteText = `Physician Contacted: ${ackForm.physician_name || 'Ordering Clinician'}. ${ackForm.notes ? 'Details: ' + ackForm.notes.trim() : 'Critical value communicated directly by phone.'}`;

    try {
      let res;
      try {
        res = await axios.post(
          `${API_BASE_URL}/api/v1/lab/results/${acknowledgingResult.id}/acknowledge`,
          { notes: noteText },
          { headers }
        );
      } catch (beErr) {
        res = await axios.post(
          `/api/v1/lab/results/${acknowledgingResult.id}/acknowledge`,
          { notes: noteText },
          { headers }
        );
      }

      toast.success(`Critical finding acknowledged and clinical notification logged.`);
      setAcknowledgingResult(null);
      await fetchCriticalResults();
    } catch (err) {
      console.error('Error acknowledging critical result:', err);
      toast.error(err.response?.data?.message || 'Failed to acknowledge critical finding');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit new Critical Rule
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.parameter_name.trim()) {
      toast.error('Parameter name is required');
      return;
    }

    const headers = getAuthHeaders();
    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/lab/results/critical-rules`,
        {
          parameter_name: ruleForm.parameter_name.trim(),
          test_code: ruleForm.test_code.trim() || null,
          critical_low: ruleForm.critical_low !== '' ? parseFloat(ruleForm.critical_low) : null,
          critical_high: ruleForm.critical_high !== '' ? parseFloat(ruleForm.critical_high) : null,
          unit: ruleForm.unit.trim()
        },
        { headers }
      );

      toast.success('Critical threshold rule saved');
      setRuleForm({ parameter_name: '', test_code: '', critical_low: '', critical_high: '', unit: 'mg/dL' });
      await fetchCriticalRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rule');
    }
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return criticalResults;
    const q = searchTerm.trim().toLowerCase();
    return criticalResults.filter((r) => {
      const bCode = (r.sample?.barcode || r.sample_barcode || '').toLowerCase();
      const oNum = (r.order?.order_number || r.order_number || '').toLowerCase();
      const pName = (r.patient_name || '').toLowerCase();
      const pParam = (r.parameter_name || '').toLowerCase();
      return bCode.includes(q) || oNum.includes(q) || pName.includes(q) || pParam.includes(q);
    });
  }, [criticalResults, searchTerm]);

  const counts = useMemo(() => {
    const total = criticalResults.length;
    const unack = criticalResults.filter((r) => !r.critical_acknowledged).length;
    const ack = criticalResults.filter((r) => r.critical_acknowledged).length;
    return { total, unack, ack };
  }, [criticalResults]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Critical Panic Findings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
              Urgent Alert
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immediate physician notification log and critical diagnostic thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowRulesModal(true);
              fetchCriticalRules();
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Threshold Rules</span>
          </button>

          <Link
            href="/lab/result-entry"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Result Entry</span>
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Critical Results ({counts.total})
        </button>

        <button
          onClick={() => setStatusFilter('unacknowledged')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
            statusFilter === 'unacknowledged'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
          <span>Pending Acknowledgment ({counts.unack})</span>
        </button>

        <button
          onClick={() => setStatusFilter('acknowledged')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'acknowledged'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Acknowledged ({counts.ack})
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by parameter, patient, order, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 shadow-xs"
          />
        </div>
      </div>

      {/* Main Critical Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading critical findings log...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Critical Panic Findings</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              All measured values are within safe physiological limits or all panic values have been communicated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-red-50/70 text-red-900 text-xs font-bold uppercase tracking-wider border-b border-red-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Critical Parameter</th>
                  <th className="py-3.5 px-4">Panic Value</th>
                  <th className="py-3.5 px-4">Specimen / Order</th>
                  <th className="py-3.5 px-4">Patient Details</th>
                  <th className="py-3.5 px-4">Threshold Applied</th>
                  <th className="py-3.5 px-4">Flagged At</th>
                  <th className="py-3.5 px-4">Physician Contact</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredResults.map((result) => {
                  const isAck = result.critical_acknowledged;

                  return (
                    <tr key={result.id} className={!isAck ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-slate-50'}>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                          <span className="font-bold text-slate-900 text-xs">{result.parameter_name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block ml-4">{result.test_name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-black text-red-700 bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-300">
                          {result.result_value} {result.unit || ''}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block max-w-fit mb-1">
                          {result.sample?.barcode || result.sample_barcode || '—'}
                        </span>
                        <span className="font-mono text-[11px] text-teal-700">
                          {result.order?.order_number || result.order_number || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block">
                          {result.order?.patient?.first_name || result.patient_name || 'Patient'} {result.order?.patient?.last_name || ''}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Dr. {result.order?.doctor?.first_name || 'Ordering Clinician'} {result.order?.doctor?.last_name || ''}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {result.critical_threshold_rule || (
                          <span className="text-slate-400 italic">Manual Alert (no rule configured)</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500">{formatDate(result.critical_flagged_at || result.entered_at)}</td>
                      <td className="py-4 px-4">
                        {isAck ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Acknowledged
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              By {result.critical_acknowledged_by} ({formatDate(result.critical_acknowledged_at)})
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            Pending Call / Contact
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {!isAck ? (
                          <button
                            onClick={() => openAckModal(result)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Log Contact</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Logged</span>
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

      {/* ========================================================= */}
      {/* ACKNOWLEDGE CRITICAL MODAL                                */}
      {/* ========================================================= */}
      {acknowledgingResult && (
        <ModalPortal isOpen={Boolean(acknowledgingResult)} onClose={() => setAcknowledgingResult(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] my-auto overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Acknowledge Critical Finding</h3>
                    <p className="text-xs text-slate-500">Record physician contact audit</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAcknowledgingResult(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl text-xs space-y-1 text-red-900">
                <p>
                  Parameter: <strong>{acknowledgingResult?.parameter_name}</strong>
                </p>
                <p>
                  Panic Value:{' '}
                  <strong className="font-mono text-sm">
                    {acknowledgingResult?.result_value} {acknowledgingResult?.unit || ''}
                  </strong>
                </p>
                <p>
                  Patient: <strong>{acknowledgingResult?.order?.patient?.first_name || acknowledgingResult?.patient_name} {acknowledgingResult?.order?.patient?.last_name || ''}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmitAcknowledgment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physician / Care Team Contacted *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kapoor / Ward 3 Lead"
                    value={ackForm.physician_name}
                    onChange={(e) => setAckForm((prev) => ({ ...prev, physician_name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Communication Details / Read-Back Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Phoned Dr. Kapoor at 14:15. Critical value read back and verified."
                    value={ackForm.notes}
                    onChange={(e) => setAckForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAcknowledgingResult(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                  >
                    {submittingAction && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Clinical Contact</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================= */}
      {/* CONFIGURE CRITICAL THRESHOLDS MODAL                       */}
      {/* ========================================================= */}
      <ModalPortal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 max-h-[88vh] my-auto overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configured Critical Threshold Rules</h3>
                  <p className="text-xs text-slate-500">Automated panic triggers for diagnostic analyzers</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Rules List */}
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {loadingRules ? (
                <div className="p-4 text-center text-slate-400">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <p className="font-semibold text-slate-600">No automated critical thresholds configured.</p>
                  <p className="text-[11px] mt-1">
                    Results are flagged manually unless thresholds are configured below.
                  </p>
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="p-3 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">{rule.parameter_name}</strong>
                      <span className="text-slate-400 text-[11px] ml-2">({rule.unit})</span>
                    </div>
                    <div className="font-mono text-red-700 font-semibold">
                      {rule.critical_low !== null && `Low: < ${rule.critical_low} `}
                      {rule.critical_high !== null && `High: > ${rule.critical_high} `}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Rule Form */}
            <form onSubmit={handleSaveRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Add Critical Threshold
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Parameter (e.g. Potassium)"
                    value={ruleForm.parameter_name}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, parameter_name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Crit Low (<)"
                    value={ruleForm.critical_low}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, critical_low: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Crit High (>)"
                    value={ruleForm.critical_high}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, critical_high: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save Threshold</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
