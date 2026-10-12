'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  History,
  Search,
  RefreshCw,
  Eye,
  Download,
  Printer,
  FileText,
  User,
  FlaskConical,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  X,
  Phone
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { extractPatientDetails } from '@/utils/labPatientDetails';
import ModalPortal from '@/components/ModalPortal';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function ReportHistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // View Details Modal
  const [viewingReport, setViewingReport] = useState(null);

  // Reissue Modal
  const [reissuingReport, setReissuingReport] = useState(null);
  const [reissueReason, setReissueReason] = useState('');
  const [reissuing, setReissuing] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports?status=${statusFilter}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/reports?status=${statusFilter}`, { headers });
      }

      const fetched = res.data?.data?.reports || res.data?.reports || [];
      setReports(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching reports history:', err);
      toast.error(err.response?.data?.message || 'Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  // Download PDF
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

  // Submit Reissue
  const handleReissueReport = async (e) => {
    e.preventDefault();
    if (!reissuingReport) return;

    if (!reissueReason.trim() || reissueReason.trim().length < 5) {
      toast.error('A detailed reason for report reissue (minimum 5 characters) is required');
      return;
    }

    try {
      setReissuing(true);
      const headers = getAuthHeaders();
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/lab/reports/${reissuingReport.id}/reissue`,
        { reissue_reason: reissueReason.trim() },
        { headers }
      );

      toast.success('Diagnostic report successfully reissued with new amendment number');
      setReissuingReport(null);
      setReissueReason('');
      await fetchReports();
    } catch (err) {
      console.error('Error reissuing report:', err);
      toast.error(err.response?.data?.message || 'Failed to reissue report');
    } finally {
      setReissuing(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const q = searchTerm.trim().toLowerCase();
    return reports.filter((r) => {
      const pInfo = extractPatientDetails(r);
      const rNum = (r.report_number || '').toLowerCase();
      const pName = pInfo.name.toLowerCase();
      const pCode = pInfo.mrn.toLowerCase();
      const phone = (pInfo.phone || '').toLowerCase();
      const oNum = (r.order_number || r.order?.order_number || r.report_data?.order?.order_number || '').toLowerCase();
      const bCode = (r.sample_barcode || r.sample?.barcode || r.report_data?.sample?.barcode || '').toLowerCase();
      return (
        rNum.includes(q) ||
        pName.includes(q) ||
        pCode.includes(q) ||
        phone.includes(q) ||
        oNum.includes(q) ||
        bCode.includes(q)
      );
    });
  }, [reports, searchTerm]);

  const modalPatient = viewingReport ? extractPatientDetails(viewingReport) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Report History & Archives</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse all previously issued diagnostic reports, download verified PDFs, and track amendment records.
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
            placeholder="Search report ID, patient, MRN, phone, order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'issued', label: 'Issued (Active)' },
            { id: 'reissued', label: 'Reissued / Amended' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading report archives...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Reports Issued Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'No matching reports found for your search.'
              : 'Diagnostic reports issued from validated results will be archived here for historical lookup and retrieval.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Report Number</th>
                  <th className="py-3 px-4">Patient / MRN</th>
                  <th className="py-3 px-4">Order / Specimen</th>
                  <th className="py-3 px-4">Issued Timestamp</th>
                  <th className="py-3 px-4">Validated By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r) => {
                  const pInfo = extractPatientDetails(r);
                  const oNum = r.order_number || r.order?.order_number || r.report_data?.order?.order_number || 'N/A';
                  const bCode = r.sample_barcode || r.sample?.barcode || r.report_data?.sample?.barcode || 'N/A';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {r.report_number}
                        {r.is_reissue && (
                          <span className="block text-[10px] text-amber-600 font-sans font-medium">
                            Amended Reissue
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{pInfo.name}</p>
                        <p className="text-[11px] font-mono text-slate-600">MRN: {pInfo.mrn}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{oNum}</p>
                        <p className="text-[11px] font-mono text-teal-600">{bCode}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{new Date(r.generated_at).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">{new Date(r.generated_at).toLocaleTimeString()}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          {r.validated_by || 'Pathologist'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {r.report_status === 'issued' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Issued
                          </span>
                        ) : r.report_status === 'reissued' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Reissued
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {r.report_status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReport(r)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View Report Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(r.id, r.report_number)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {r.report_status === 'issued' && !r.is_reissue && (
                            <button
                              onClick={() => {
                                setReissuingReport(r);
                                setReissueReason('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                              title="Reissue / Amend Report"
                            >
                              <RotateCcw className="w-4 h-4" />
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
        </div>
      )}

      {/* View Details Modal (Consistent with Patient Reports) */}
      {viewingReport && modalPatient && (
        <ModalPortal isOpen={!!viewingReport && !!modalPatient} onClose={() => setViewingReport(null)}>
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full my-auto flex flex-col max-h-[88vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Diagnostic Report: {viewingReport.report_number}
                </h3>
                <p className="text-[11px] text-slate-500">Issued on {new Date(viewingReport.generated_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-slate-800 text-white flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">{viewingReport.report_data?.lab?.lab_name || 'Diagnostic Laboratory'}</h4>
                  <p className="text-[11px] text-slate-300">
                    Laboratory Diagnostic Report Archives
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-teal-400">{viewingReport.report_number}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{viewingReport.report_status.toUpperCase()}</p>
                </div>
              </div>

              {/* Patient & Accession Info Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Details</h4>
                  <p className="font-bold text-slate-900 text-base">{modalPatient.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">MRN:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">{modalPatient.mrn}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Gender / Age:</span> {modalPatient.gender} • {modalPatient.ageDisplay} {modalPatient.dob ? `(${modalPatient.dob})` : ''}
                  </p>
                  {modalPatient.phone && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Contact:</span> {modalPatient.phone}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Accession / Specimen</h4>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Order #:</span>{' '}
                    <span className="font-mono text-slate-800">{viewingReport.report_data?.order?.order_number || viewingReport.order_number || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Specimen Barcode:</span>{' '}
                    <span className="font-mono font-semibold text-teal-700">{viewingReport.report_data?.sample?.barcode || viewingReport.sample_barcode || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Sample Type:</span> {viewingReport.report_data?.sample?.sample_type || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Generated:</span> {viewingReport.generated_at ? new Date(viewingReport.generated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Test Parameter</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingReport.report_data?.results?.map((r, i) => (
                      <tr key={i} className={r.is_critical ? 'bg-red-50/50' : 'bg-white'}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.parameter_name}</td>
                        <td className={`py-2 px-3 font-bold ${r.is_critical ? 'text-red-600' : 'text-slate-900'}`}>{r.result_value}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{r.reference_range || '-'}</td>
                        <td className="py-2 px-3 text-slate-500">{r.unit || '-'}</td>
                        <td className="py-2 px-3">
                          {r.is_critical ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">NORMAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signoff */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-[11px]">
                <p className="font-semibold text-slate-800">
                  Electronically Verified by: <span className="font-bold text-teal-700">{viewingReport.validated_by || 'Pathologist'}</span>
                </p>
                <p className="text-slate-500">
                  Validation Remarks: {viewingReport.report_data?.validation?.validation_remarks || 'Correlates with clinical findings.'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>

              <button
                onClick={() => handleDownloadPdf(viewingReport.id, viewingReport.report_number)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Verified PDF</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Reissue Modal */}
      {reissuingReport && (
        <ModalPortal isOpen={!!reissuingReport} onClose={() => setReissuingReport(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4 max-h-[88vh] my-auto overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Reissue / Amend Diagnostic Report</h3>
              </div>
              <button
                onClick={() => setReissuingReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Clinical Audit Notice:</p>
              <p>
                Reissuing will archive report <strong>{reissuingReport.report_number}</strong> with status &quot;reissued&quot; and issue a newly numbered amended diagnostic report referencing the original accession.
              </p>
            </div>

            <form onSubmit={handleReissueReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Amendment / Reissue <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reissueReason}
                  onChange={(e) => setReissueReason(e.target.value)}
                  placeholder="Enter detailed clinical or administrative justification (min 5 characters)..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReissuingReport(null)}
                  disabled={reissuing}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reissuing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  {reissuing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Issue Amendment</span>
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
