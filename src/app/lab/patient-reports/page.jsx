'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Download,
  FileText,
  User,
  FlaskConical,
  ShieldCheck,
  Calendar,
  X,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { extractPatientDetails } from '@/utils/labPatientDetails';
import ModalPortal from '@/components/ModalPortal';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function PatientReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);

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
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/reports`, { headers });
      }

      const fetched = res.data?.data?.reports || res.data?.reports || [];
      setReports(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error(err.response?.data?.message || 'Failed to load patient reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Group reports by patient using unified extractPatientDetails
  const patientsWithReports = useMemo(() => {
    const map = new Map();

    reports.forEach((rep) => {
      const pInfo = extractPatientDetails(rep);
      const p = rep.report_data?.patient || rep.patient || {};
      const patientKey = rep.patient_id || p.id || (pInfo.mrn !== 'N/A' ? pInfo.mrn : pInfo.name);

      if (!map.has(patientKey)) {
        map.set(patientKey, {
          patientKey,
          name: pInfo.name,
          mrn: pInfo.mrn,
          gender: pInfo.gender,
          age: pInfo.ageDisplay,
          dob: pInfo.dob,
          phone: pInfo.phone,
          reports: []
        });
      }

      map.get(patientKey).reports.push(rep);
    });

    // Convert map to array and sort reports inside each patient by generated_at desc
    const list = Array.from(map.values()).map((p) => {
      p.reports.sort((a, b) => new Date(b.generated_at || 0) - new Date(a.generated_at || 0));
      return p;
    });

    // Filter by search term
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term) ||
      (p.phone && p.phone.toLowerCase().includes(term)) ||
      p.reports.some((r) =>
        (r.report_number && r.report_number.toLowerCase().includes(term)) ||
        (r.report_data?.sample?.barcode && r.report_data.sample.barcode.toLowerCase().includes(term)) ||
        (r.sample_barcode && r.sample_barcode.toLowerCase().includes(term)) ||
        (r.report_data?.order?.order_number && r.report_data.order.order_number.toLowerCase().includes(term)) ||
        (r.order_number && r.order_number.toLowerCase().includes(term))
      )
    );
  }, [reports, searchTerm]);

  // Handle PDF Download
  const handleDownloadPdf = async (report) => {
    try {
      toast.loading(`Preparing PDF for ${report.report_number}...`, { id: 'pdf-dl' });
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/reports/${report.id}/pdf`, {
          headers,
          responseType: 'blob'
        });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/reports/${report.id}/pdf`, {
          headers,
          responseType: 'blob'
        });
      }

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.report_number || 'diagnostic-report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report PDF downloaded successfully', { id: 'pdf-dl' });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download report PDF', { id: 'pdf-dl' });
    }
  };

  const modalPatient = viewingReport ? extractPatientDetails(viewingReport) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-600" />
            Patient Diagnostic Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Patient-indexed directory of verified laboratory diagnostic reports and historical archives.
          </p>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients with Reports</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{patientsWithReports.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Diagnostic Reports</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">{reports.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Search Matches</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {searchTerm.trim() ? patientsWithReports.length : 'All Patients'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Patient Name, MRN/Code, Phone, Report Number, or Specimen Barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Patients List with Expandable Reports Accordion */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600 mb-3"></div>
          <p className="text-slate-500 font-medium">Loading patient reports index...</p>
        </div>
      ) : patientsWithReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No Patient Reports Found</h3>
          <p className="text-slate-500 text-sm max-w-md mt-1">
            {searchTerm
              ? 'No patients or diagnostic reports match your search query.'
              : 'No diagnostic reports have been generated yet. Eligible orders can be issued from Report Generation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patientsWithReports.map((patient) => {
            const isExpanded = selectedPatientId === patient.patientKey || patientsWithReports.length === 1;

            return (
              <div
                key={patient.patientKey}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all"
              >
                {/* Patient Summary Header */}
                <div
                  onClick={() => setSelectedPatientId(isExpanded ? null : patient.patientKey)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition border-b border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-base">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-base">{patient.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200/80">
                          MRN: {patient.mrn}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>
                          {patient.gender} • {patient.age} {patient.dob ? `(${patient.dob})` : ''}
                        </span>
                        {patient.phone && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {patient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                      {patient.reports.length} {patient.reports.length === 1 ? 'Report' : 'Reports'}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Patient Reports Table (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                            <th className="p-3">Report Number</th>
                            <th className="p-3">Order / Accession</th>
                            <th className="p-3">Specimen</th>
                            <th className="p-3">Validated Tests</th>
                            <th className="p-3">Generated Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {patient.reports.map((report) => {
                            const sample = report.report_data?.sample || {};
                            const order = report.report_data?.order || {};
                            const results = report.report_data?.results || [];

                            return (
                              <tr key={report.id} className="hover:bg-slate-50/80 transition">
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-teal-600" />
                                    <span className="font-mono font-semibold text-teal-800 text-xs">
                                      {report.report_number}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-xs text-slate-600">
                                  {order.order_number || report.order_number || 'N/A'}
                                </td>
                                <td className="p-3">
                                  <div className="font-mono text-xs text-slate-800 font-medium">
                                    {sample.barcode || report.sample_barcode || 'N/A'}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {sample.sample_type || 'Specimen'}
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-slate-700">
                                  <span className="font-medium text-slate-900">{results.length}</span> parameters
                                </td>
                                <td className="p-3 text-xs text-slate-500">
                                  {report.generated_at
                                    ? new Date(report.generated_at).toLocaleString()
                                    : 'N/A'}
                                </td>
                                <td className="p-3">
                                  {report.report_status === 'final' || report.report_status === 'issued' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      <ShieldCheck className="w-3 h-3" /> Final Issued
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      Amended Reissue
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setViewingReport(report)}
                                      className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-teal-700 bg-white border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded shadow-2xs font-medium transition"
                                      title="View Report Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleDownloadPdf(report)}
                                      className="inline-flex items-center gap-1 text-xs text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1 rounded shadow-2xs font-medium transition"
                                      title="Download PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      PDF
                                    </button>
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
              </div>
            );
          })}
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && modalPatient && (
        <ModalPortal isOpen={!!viewingReport && !!modalPatient} onClose={() => setViewingReport(null)}>
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] my-auto flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-800">
                  Diagnostic Report: {viewingReport.report_number}
                </h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
              {/* Lab & Patient Banner */}
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

              {/* Validated Results Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Validated Diagnostic Results
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="p-2.5">Test / Parameter</th>
                        <th className="p-2.5">Result Value</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Reference Range</th>
                        <th className="p-2.5">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingReport.report_data?.results || []).map((r, i) => (
                        <tr key={i} className={r.is_critical ? 'bg-rose-50/50' : ''}>
                          <td className="p-2.5 font-medium text-slate-900">{r.parameter_name}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{r.result_value}</td>
                          <td className="p-2.5 text-slate-500">{r.unit || '—'}</td>
                          <td className="p-2.5 text-slate-600">{r.reference_range || '—'}</td>
                          <td className="p-2.5">
                            {r.is_critical ? (
                              <span className="text-rose-700 font-semibold px-2 py-0.5 bg-rose-100 rounded text-[10px]">
                                CRITICAL: {r.interpretation || r.interpretation_flag || 'ABNORMAL'}
                              </span>
                            ) : (
                              <span className="text-slate-600">{r.interpretation || r.interpretation_flag || 'Normal'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation & Signoff details */}
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Verified & Electronically Authorized
                  </p>
                  <p className="text-emerald-800 mt-0.5">
                    Validated by: <span className="font-medium">{viewingReport.validated_by || viewingReport.report_data?.validation?.validated_by || 'Authorized Pathologist'}</span>
                  </p>
                  {viewingReport.report_data?.validation?.validation_remarks && (
                    <p className="text-emerald-700 mt-0.5 italic">
                      Remarks: &quot;{viewingReport.report_data.validation.validation_remarks}&quot;
                    </p>
                  )}
                </div>
                <div className="text-right text-emerald-800">
                  <p>Validation Date: {viewingReport.validated_at || viewingReport.report_data?.validation?.validated_at ? new Date(viewingReport.validated_at || viewingReport.report_data.validation.validated_at).toLocaleDateString() : 'Recorded'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium transition"
              >
                Close
              </button>

              <button
                onClick={() => handleDownloadPdf(viewingReport)}
                className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium text-sm transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
