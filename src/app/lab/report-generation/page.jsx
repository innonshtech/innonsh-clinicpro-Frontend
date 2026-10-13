'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FlaskConical,
  User,
  Calendar,
  ShieldCheck,
  X,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function ReportGenerationPage() {
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, ready, awaiting_validation, reported

  // Preview & Generation Modal
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchEligibleOrders = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports/eligible-orders?status=${statusFilter}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/reports/eligible-orders?status=${statusFilter}`, { headers });
      }

      const fetched = res.data?.data?.eligibleOrders || res.data?.eligibleOrders || [];
      setEligibleOrders(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching eligible orders:', err);
      toast.error(err.response?.data?.message || 'Failed to load eligible orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleOrders();
  }, [statusFilter]);

  // Open Preview Modal
  const handleOpenPreview = async (item) => {
    try {
      setPreviewLoading(true);
      setGeneratedReport(null);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports/preview?orderId=${item.order_id}&sampleId=${item.sample_id}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/reports/preview?orderId=${item.order_id}&sampleId=${item.sample_id}`, { headers });
      }

      const preview = res.data?.data?.preview || res.data?.preview;
      setPreviewData(preview);
    } catch (err) {
      console.error('Error opening report preview:', err);
      toast.error(err.response?.data?.message || 'Failed to compile report preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Generate & Issue Report
  const handleGenerateReport = async () => {
    if (!previewData || !previewData.order?.id) return;

    try {
      setGenerating(true);
      const headers = getAuthHeaders();
      const payload = {
        order_id: previewData.order.id,
        sample_id: previewData.sample?.id
      };

      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/reports/generate`, payload, { headers });
      } catch (e) {
        res = await axios.post(`/api/v1/lab/reports/generate`, payload, { headers });
      }

      const result = res.data?.data || res.data;
      setGeneratedReport(result);
      toast.success(res.data?.message || `Diagnostic Report ${result.report_number} issued successfully!`);
      await fetchEligibleOrders();
    } catch (err) {
      console.error('Error issuing report:', err);
      toast.error(err.response?.data?.message || 'Failed to issue diagnostic report');
    } finally {
      setGenerating(false);
    }
  };

  // Trigger PDF Download
  const handleDownloadPdf = async (reportId, reportNumber) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports/${reportId}/pdf`, {
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report-${reportNumber || 'diagnostic'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report PDF downloaded successfully');
    } catch (err) {
      console.error('Error downloading report PDF:', err);
      toast.error('Failed to download report PDF');
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return eligibleOrders;
    const q = searchTerm.trim().toLowerCase();
    return eligibleOrders.filter((item) => {
      const pName = (item.patient_name || '').toLowerCase();
      const pCode = (item.patient_code || '').toLowerCase();
      const oNum = (item.order_number || '').toLowerCase();
      const bCode = (item.sample_barcode || '').toLowerCase();
      const rNum = (item.active_report_number || '').toLowerCase();
      return pName.includes(q) || pCode.includes(q) || oNum.includes(q) || bCode.includes(q) || rNum.includes(q);
    });
  }, [eligibleOrders, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Report Generation</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review clinically validated specimens, preview formatted diagnostic releases, and generate official PDF reports.
          </p>
        </div>
      </div>

      {/* Controls & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, order, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'ready', label: 'Ready for Report' },
            { id: 'awaiting_validation', label: 'Awaiting Validation' },
            { id: 'reported', label: 'Already Reported' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Eligible Specimens Grid / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Scanning validated laboratory accessions...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Specimens Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'No matching orders found. Try adjusting your search criteria.'
              : statusFilter === 'ready'
              ? 'No specimens are currently pending report generation. Validate test results in the Result Validation queue first.'
              : 'No diagnostic specimens found in this status.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient / MRN</th>
                  <th className="py-3 px-4">Order / Barcode</th>
                  <th className="py-3 px-4">Specimen Type</th>
                  <th className="py-3 px-4">Results Status</th>
                  <th className="py-3 px-4">Report Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((item) => (
                  <tr key={item.sample_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {item.patient_name ? item.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.patient_name}</p>
                          <p className="text-[11px] text-slate-500">MRN: {item.patient_code}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{item.order_number}</p>
                      <p className="text-[11px] font-mono text-teal-600">{item.sample_barcode}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                        {item.sample_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.is_eligible_for_report ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Validated ({item.results_count})
                        </span>
                      ) : item.eligibility === 'awaiting_validation' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Awaiting Validation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                          No Results
                        </span>
                      )}
                      {item.has_critical && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          PANIC
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.active_report_number ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <FileCheck className="w-3 h-3" />
                            {item.active_report_number}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(item.active_report_generated_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Unissued</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.active_report_id && (
                          <button
                            onClick={() => handleDownloadPdf(item.active_report_id, item.active_report_number)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            title="Download Issued PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPreview(item)}
                          disabled={!item.is_eligible_for_report}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1 ${
                            item.is_eligible_for_report
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.active_report_id ? 'Preview / Reissue' : 'Preview & Issue'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnostic Report Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Diagnostic Report Preview</h3>
                  <p className="text-[11px] text-slate-500">
                    Official Diagnostic Laboratory Release - Verify details before final issuance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Official Report Canvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-[#fdfdfd]">
              {/* Report Header Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-800 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-teal-200">Diagnostic Laboratory Network</p>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">{previewData.lab?.lab_name || previewData.lab?.name || 'ClinicPro Laboratory'}</h2>
                  <p className="text-[11px] text-teal-100 mt-0.5">
                    {[previewData.lab?.address, previewData.lab?.phone, previewData.lab?.email].filter(Boolean).join(' | ')}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider mb-1">
                    {previewData.report_status === 'draft' ? 'Pre-Issuance Preview' : 'Issued Report'}
                  </span>
                  <p className="font-mono text-xs font-semibold text-white/90">ID: {previewData.report_number}</p>
                </div>
              </div>

              {/* Patient & Accession Info Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Information */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">{previewData.patient?.first_name} {previewData.patient?.last_name}</span>
                    <span className="text-slate-500">MRN / Code:</span>
                    <span className="font-mono font-semibold text-slate-800">{previewData.patient?.patient_code}</span>
                    <span className="text-slate-500">Gender / DOB:</span>
                    <span className="text-slate-800 font-medium">
                      {previewData.patient?.gender ? previewData.patient.gender.toUpperCase() : 'N/A'} {previewData.patient?.date_of_birth ? `(${previewData.patient.date_of_birth})` : ''}
                    </span>
                    <span className="text-slate-500">Contact:</span>
                    <span className="text-slate-800 font-medium">{previewData.patient?.phone_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Specimen & Order Information */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    Specimen & Order Information
                  </h4>
                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                    <span className="text-slate-500">Order Number:</span>
                    <span className="font-semibold text-slate-800">{previewData.order?.order_number}</span>
                    <span className="text-slate-500">Specimen Barcode:</span>
                    <span className="font-mono font-bold text-teal-600">{previewData.sample?.barcode}</span>
                    <span className="text-slate-500">Specimen Type:</span>
                    <span className="font-semibold text-slate-800">{previewData.sample?.sample_type}</span>
                    <span className="text-slate-500">Referring Physician:</span>
                    <span className="text-slate-800 font-medium">
                      {previewData.order?.doctor ? `Dr. ${previewData.order.doctor.first_name || ''} ${previewData.order.doctor.last_name || ''}`.trim() : 'Attending Physician'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Results Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-800 text-white p-2.5 font-bold text-[11px] flex justify-between items-center">
                  <span>Diagnostic Findings & Parameter Results</span>
                  <span className="text-[10px] font-normal text-slate-300">
                    Validated on {new Date(previewData.validation?.validated_at).toLocaleString()}
                  </span>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 px-3">Test / Parameter</th>
                      <th className="py-2 px-3">Result Value</th>
                      <th className="py-2 px-3">Reference Range</th>
                      <th className="py-2 px-3">Units</th>
                      <th className="py-2 px-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.results?.map((r, i) => (
                      <tr key={r.id || i} className={r.is_critical ? 'bg-red-50/50' : i % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.parameter_name}</td>
                        <td className={`py-2.5 px-3 font-bold ${r.is_critical ? 'text-red-600 text-sm' : 'text-slate-900'}`}>
                          {r.result_value}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{r.reference_range || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{r.unit || '-'}</td>
                        <td className="py-2.5 px-3">
                          {r.is_critical ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL PANIC</span>
                          ) : r.interpretation === 'abnormal' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">ABNORMAL</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">NORMAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Signoff Box */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Pathology Review & Electronic Signoff</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Authorized Signatory: <strong>{previewData.validation?.validated_by}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    "{previewData.validation?.validation_remarks || 'Correlates with clinical history. Approved for release.'}"
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="px-2 py-1 rounded bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Electronically Authorized
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Signoff: {new Date(previewData.validation?.validated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Preview</span>
                </button>

                {generatedReport ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(generatedReport.report_id, generatedReport.report_number)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Issued PDF</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {generating ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{generating ? 'Issuing Report...' : 'Issue Final Diagnostic Report'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
