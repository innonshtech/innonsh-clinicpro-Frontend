'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  FileCheck,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  User,
  FlaskConical,
  RefreshCw,
  X,
  QrCode,
  Calendar,
  ArrowRight,
  ClipboardList,
  ShieldAlert,
  TestTube,
  CheckSquare,
  ChevronRight,
  Trash2
} from 'lucide-react';

const COMMON_UNITS = [
  'g/dL',
  'mg/dL',
  'cells/mcL',
  '10^3/mcL',
  '10^6/mcL',
  'mmol/L',
  'mEq/L',
  'U/L',
  'IU/mL',
  'ng/mL',
  'pg/mL',
  '%',
  'seconds',
  'ratio',
  'index'
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

export default function ResultEntryPage() {
  const searchParams = useSearchParams();
  const preselectedSampleId = searchParams.get('sampleId');

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Entry Modal State
  const [activeSample, setActiveSample] = useState(null);
  const [parameterRows, setParameterRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [focusParamId, setFocusParamId] = useState(null);

  // Fetch received samples eligible for result entry
  const fetchEligibleSamples = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/results/eligible-samples`, { headers });
      } catch (e) {
        res = await axios.get('/api/v1/lab/results/eligible-samples', { headers });
      }

      const fetched = res.data?.data?.samples || res.data?.samples || [];
      setSamples(Array.isArray(fetched) ? fetched : []);

      // If URL has sampleId, open entry modal immediately
      if (preselectedSampleId && Array.isArray(fetched)) {
        const target = fetched.find((s) => s.id === preselectedSampleId);
        if (target) {
          openEntryModal(target);
        }
      }
    } catch (err) {
      console.error('Error fetching eligible samples for results:', err);
      toast.error(err.response?.data?.message || 'Failed to load eligible samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleSamples();
  }, [preselectedSampleId]);

  // Open Result Entry Modal
  const openEntryModal = (sample) => {
    setActiveSample(sample);

    // If sample already has existing entered results, load them for editing
    if (sample.results && sample.results.length > 0) {
      // Deduplicate by test + parameter identity key to ensure clean display
      const seen = new Set();
      const uniqueResults = [];
      for (const r of sample.results) {
        const key = `${r.order_item_id || r.test_id || r.test_code || (r.test_name || '').trim().toLowerCase()}:::${(r.parameter_name || '').trim().toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(r);
        }
      }

      const rows = uniqueResults.map((r) => ({
        id: r.id,
        order_item_id: r.order_item_id || null,
        test_id: r.test_id || null,
        test_name: r.test_name,
        test_code: r.test_code || null,
        parameter_name: r.parameter_name,
        result_value: r.result_value,
        unit: r.unit || 'g/dL',
        reference_range: r.reference_range || '',
        reference_min: r.reference_min !== null && r.reference_min !== undefined ? r.reference_min : '',
        reference_max: r.reference_max !== null && r.reference_max !== undefined ? r.reference_max : '',
        interpretation: r.interpretation || 'normal',
        is_critical: Boolean(r.is_critical),
        critical_threshold_rule: r.critical_threshold_rule || '',
        technician_remarks: r.technician_remarks || ''
      }));
      setParameterRows(rows);
    } else {
      // Initialize default parameter row based on test or generic
      setParameterRows([
        {
          id: 'temp-' + Date.now(),
          test_id: null,
          test_name: sample.sample_type ? `${sample.sample_type} Diagnostic Panel` : 'Diagnostic Analysis',
          test_code: null,
          parameter_name: sample.sample_type === 'Blood' ? 'Hemoglobin' : 'Primary Parameter',
          result_value: '',
          unit: 'g/dL',
          reference_range: '12.0 - 16.0',
          reference_min: 12.0,
          reference_max: 16.0,
          interpretation: 'normal',
          is_critical: false,
          critical_threshold_rule: '',
          technician_remarks: ''
        }
      ]);
    }
  };

  // Add parameter row at the top of the parameter list
  const addParameterRow = () => {
    const newId = 'temp-' + Date.now() + Math.random();
    setFocusParamId(newId);
    setParameterRows((prev) => [
      {
        id: newId,
        test_id: null,
        test_name: activeSample?.sample_type ? `${activeSample.sample_type} Diagnostic Panel` : 'Diagnostic Test',
        test_code: null,
        parameter_name: '',
        result_value: '',
        unit: 'mg/dL',
        reference_range: '',
        reference_min: '',
        reference_max: '',
        interpretation: 'normal',
        is_critical: false,
        critical_threshold_rule: '',
        technician_remarks: ''
      },
      ...prev
    ]);
  };

  // Remove parameter row
  const removeParameterRow = (index) => {
    if (parameterRows.length <= 1) {
      toast.error('At least one parameter is required');
      return;
    }
    setParameterRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update row field
  const updateRowField = (index, field, value) => {
    setParameterRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Auto-evaluate interpretation if numeric and reference ranges provided
      if (field === 'result_value') {
        const num = parseFloat(value);
        const min = parseFloat(next[index].reference_min);
        const max = parseFloat(next[index].reference_max);

        if (!isNaN(num) && !isNaN(min) && !isNaN(max)) {
          if (num < min) {
            next[index].interpretation = 'abnormal';
          } else if (num > max) {
            next[index].interpretation = 'abnormal';
          } else {
            next[index].interpretation = 'normal';
          }
        }
      }

      return next;
    });
  };

  // Submit Results
  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!activeSample) return;

    // Validate rows
    for (let i = 0; i < parameterRows.length; i++) {
      const row = parameterRows[i];
      if (!row.parameter_name.trim()) {
        toast.error(`Parameter name is required for row #${i + 1}`);
        return;
      }
      if (!String(row.result_value).trim()) {
        toast.error(`Result value is required for "${row.parameter_name || `row #${i + 1}`}"`);
        return;
      }
    }

    setSubmitting(true);
    const headers = getAuthHeaders();

    const payload = {
      sample_id: activeSample.id,
      order_id: activeSample.order_id,
      results: parameterRows.map((r) => ({
        id: r.id && !String(r.id).startsWith('temp-') ? r.id : undefined,
        order_item_id: r.order_item_id || null,
        test_id: r.test_id || null,
        test_name: r.test_name || 'Diagnostic Test',
        test_code: r.test_code || null,
        parameter_name: r.parameter_name.trim(),
        result_value: String(r.result_value).trim(),
        unit: r.unit ? r.unit.trim() : null,
        reference_range: r.reference_range ? r.reference_range.trim() : null,
        reference_min: r.reference_min !== '' && !isNaN(parseFloat(r.reference_min)) ? parseFloat(r.reference_min) : null,
        reference_max: r.reference_max !== '' && !isNaN(parseFloat(r.reference_max)) ? parseFloat(r.reference_max) : null,
        interpretation: r.interpretation,
        is_critical: Boolean(r.is_critical),
        critical_threshold_rule: r.critical_threshold_rule ? r.critical_threshold_rule.trim() : null,
        technician_remarks: r.technician_remarks ? r.technician_remarks.trim() : null
      }))
    };

    try {
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/results/entry`, payload, { headers });
      } catch (beErr) {
        res = await axios.post('/api/v1/lab/results/entry', payload, { headers });
      }

      toast.success('Results entered and saved successfully! Sent to validation review queue.');
      setActiveSample(null);
      await fetchEligibleSamples();
    } catch (err) {
      console.error('Error saving results:', err);
      toast.error(err.response?.data?.message || 'Failed to save results');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      if (statusFilter !== 'all' && (s.entry_status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const bCode = (s.barcode || '').toLowerCase();
        const oNum = (s.order?.order_number || s.order_number || '').toLowerCase();
        const pName = `${s.order?.patient?.first_name || s.patient_name || ''} ${s.order?.patient?.last_name || ''}`.toLowerCase();
        const sType = (s.sample_type || '').toLowerCase();
        return bCode.includes(q) || oNum.includes(q) || pName.includes(q) || sType.includes(q);
      }
      return true;
    });
  }, [samples, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const total = samples.length;
    const pending = samples.filter((s) => s.entry_status === 'pending_entry').length;
    const awaitingVal = samples.filter((s) => s.entry_status === 'awaiting_validation').length;
    const validated = samples.filter((s) => s.entry_status === 'validated').length;
    return { total, pending, awaitingVal, validated };
  }, [samples]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Result Entry</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accession received specimens, enter diagnostic test parameter values, and flag critical findings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/lab/result-validation"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
            <span>Validation Queue</span>
          </Link>

          <Link
            href="/lab/critical-results"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Critical Findings</span>
          </Link>
        </div>
      </div>

      {/* Quick stats tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Received Specimens ({counts.total})
        </button>
        <button
          onClick={() => setStatusFilter('pending_entry')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'pending_entry'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          Pending Entry ({counts.pending})
        </button>
        <button
          onClick={() => setStatusFilter('awaiting_validation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'awaiting_validation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          Awaiting Validation ({counts.awaitingVal})
        </button>
        <button
          onClick={() => setStatusFilter('validated')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'validated'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Validated ({counts.validated})
        </button>
      </div>

      {/* Search Bar */}
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

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading received specimens...</p>
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TestTube className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Eligible Received Specimens</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Specimens must be checked in as "Received at Bench" under Sample Tracking before results can be entered.
            </p>
            <div className="mt-4">
              <Link
                href="/lab/sample-tracking"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Go to Sample Tracking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Specimen Barcode</th>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Sample Type</th>
                  <th className="py-3.5 px-4">Bench Check-In</th>
                  <th className="py-3.5 px-4">Results Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSamples.map((sample) => {
                  const hasCritical = sample.has_critical;
                  const isPending = sample.entry_status === 'pending_entry';
                  const isAwaitingVal = sample.entry_status === 'awaiting_validation';
                  const isValidated = sample.entry_status === 'validated';

                  return (
                    <tr key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {sample.barcode}
                          </span>
                        </div>
                        {hasCritical && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" />
                            <span>CRITICAL FINDING</span>
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
                        <span className="text-[11px] text-slate-400">
                          {sample.order?.patient?.gender || ''} • {sample.order?.patient?.phone_number || ''}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {sample.sample_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {formatDate(sample.received_at || sample.collected_at)}
                      </td>
                      <td className="py-4 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending Entry
                          </span>
                        ) : isAwaitingVal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Awaiting Validation ({sample.results_count})
                          </span>
                        ) : isValidated ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Validated ({sample.results_count})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openEntryModal(sample)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Enter Results' : 'Edit / Add Results'}</span>
                        </button>
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
      {/* RESULT ENTRY MODAL                                        */}
      {/* ========================================================= */}
      {activeSample && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Enter Diagnostic Results</h3>
                  <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {activeSample.barcode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order: <span className="font-semibold text-slate-700">{activeSample.order?.order_number || activeSample.order_number}</span> • Patient:{' '}
                  <span className="font-semibold text-slate-700">
                    {activeSample.order?.patient?.first_name || activeSample.patient_name} {activeSample.order?.patient?.last_name || ''}
                  </span>{' '}
                  • Specimen: <span className="font-semibold text-slate-700">{activeSample.sample_type}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSample(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResults} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Test Parameters ({parameterRows.length})
                </span>
                <button
                  type="button"
                  onClick={addParameterRow}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors inline-flex items-center gap-1 border border-teal-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>

              <div className="space-y-3">
                {parameterRows.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      row.is_critical
                        ? 'bg-red-50/50 border-red-300 ring-1 ring-red-300'
                        : row.interpretation === 'abnormal'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Parameter Name */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Parameter Name *
                        </label>
                        <input
                          ref={(el) => {
                            if (el && focusParamId === row.id) {
                              el.focus();
                              setFocusParamId(null);
                            }
                          }}
                          type="text"
                          placeholder="e.g. Hemoglobin, WBC"
                          value={row.parameter_name}
                          onChange={(e) => updateRowField(idx, 'parameter_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
                          required
                        />
                      </div>

                      {/* Result Value */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Result Value *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 14.2"
                          value={row.result_value}
                          onChange={(e) => updateRowField(idx, 'result_value', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-bold text-slate-900"
                          required
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          list={`units-list-${idx}`}
                          placeholder="e.g. g/dL"
                          value={row.unit}
                          onChange={(e) => updateRowField(idx, 'unit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                        <datalist id={`units-list-${idx}`}>
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </div>

                      {/* Reference Range */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Reference Range
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 13.0 - 17.0"
                          value={row.reference_range}
                          onChange={(e) => updateRowField(idx, 'reference_range', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Interpretation */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Interpretation
                        </label>
                        <select
                          value={row.interpretation}
                          onChange={(e) => updateRowField(idx, 'interpretation', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical_low">Critical Low</option>
                          <option value="critical_high">Critical High</option>
                          <option value="inconclusive">Inconclusive</option>
                        </select>
                      </div>

                      {/* Delete button */}
                      <div className="sm:col-span-1 pt-6 text-right">
                        <button
                          type="button"
                          onClick={() => removeParameterRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove Parameter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Secondary Row: Critical Flag & Remarks */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`crit-check-${idx}`}
                          checked={row.is_critical}
                          onChange={(e) => updateRowField(idx, 'is_critical', e.target.checked)}
                          className="w-3.5 h-3.5 text-red-600 rounded focus:ring-red-500 border-slate-300"
                        />
                        <label htmlFor={`crit-check-${idx}`} className="font-semibold text-red-700 flex items-center gap-1 cursor-pointer">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flag as Critical Panic Finding</span>
                        </label>
                      </div>

                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Optional remarks (e.g. verified on automated analyzer)"
                          value={row.technician_remarks}
                          onChange={(e) => updateRowField(idx, 'technician_remarks', e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informational callout */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Entered results are submitted to the <strong>Result Validation Queue</strong>. Validating users (Pathologists or Lab Directors) will review and approve results before diagnostic reports can be generated.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveSample(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Save Results & Queue for Validation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
