'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  X,
  User,
  Stethoscope,
  HeartPulse,
  BedDouble,
  LogOut,
  Calendar,
  Clock,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function ClinicIpdPage() {
  const router = useRouter();
  const [clinicId, setClinicId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isIpdEnabled, setIsIpdEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'admitted' | 'discharged'

  // Discharge Modal
  const [dischargeModalAdmission, setDischargeModalAdmission] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const cId = user.id || user._id;
      setClinicId(cId);
      setClinicName(user.name || user.clinicName || 'Clinic');
      verifyAndLoad(cId);
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const verifyAndLoad = async (cId) => {
    setLoading(true);
    try {
      const pRes = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${cId}`, {
        headers: getAuthHeaders()
      });
      const pData = await pRes.json();
      const ipdActive = pData.data?.clinic?.modules?.ipd === true;
      setIsIpdEnabled(ipdActive);

      if (ipdActive) {
        await loadAdmissions(cId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying clinic IPD:', err);
      setLoading(false);
    }
  };

  const loadAdmissions = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAdmissions(data.data?.admissions || []);
      }
    } catch (e) {
      console.error('Failed to load admissions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!dischargeModalAdmission) return;
    setDischargeLoading(true);
    setModalError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${dischargeModalAdmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
          dischargeSummary
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to discharge patient');
      }

      setSuccessMessage(`Patient discharged successfully! Calendar Days: ${data.data?.result?.calendarDays || 1}, Total Bed Charges: ₹${data.data?.result?.totalBedCharge || 0}. Bed status is now CLEANING.`);
      setTimeout(() => setSuccessMessage(''), 6000);
      setDischargeModalAdmission(null);
      setDischargeSummary('');
      await loadAdmissions(clinicId);
    } catch (err) {
      setModalError(err.message || 'Discharge failed');
    } finally {
      setDischargeLoading(false);
    }
  };

  const filteredAdmissions = admissions.filter(a => {
    const matchesSearch =
      (a.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.admission_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patientPhone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && isIpdEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading IPD records...</p>
      </div>
    );
  }

  if (isIpdEnabled === false) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">IPD Module Not Enabled</h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            Inpatient department (IPD) admissions are disabled for this clinic.
          </p>
          <Link
            href="/clinic"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IPD Inpatient Admissions</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Active inpatients, assigned doctors, nursing allocation, and admission history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/clinic/beds"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BedDouble className="h-4 w-4 text-blue-600" />
            Manage Beds
          </Link>
          <Link
            href="/clinic/nurses"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HeartPulse className="h-4 w-4 text-blue-600" />
            Manage Nurses
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, admission #, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors \${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({admissions.length})
          </button>
          <button
            onClick={() => setStatusFilter('admitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors \${
              statusFilter === 'admitted'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({admissions.filter(a => a.status === 'admitted').length})
          </button>
          <button
            onClick={() => setStatusFilter('discharged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors \${
              statusFilter === 'discharged'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Discharged ({admissions.filter(a => a.status === 'discharged').length})
          </button>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span className="text-sm">Loading inpatient admissions...</span>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No inpatient admissions found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Doctors can admit registered patients into available beds from the Doctor Inpatients dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Admitting Doctor</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assigned Nurse</th>
                  <th className="py-3 px-4">Admitted On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => {
                  const isActive = adm.status === 'admitted';
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {adm.admission_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{adm.patientName}</div>
                        {adm.patientPhone && <div className="text-[11px] text-slate-400">{adm.patientPhone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{adm.admittingDoctorName}</div>
                        {adm.consultingDoctors && adm.consultingDoctors.length > 0 && (
                          <span className="text-[10px] text-indigo-600 block">
                            +{adm.consultingDoctors.length} consulting doctor(s)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{adm.bedNumber}</div>
                        <div className="text-[11px] text-slate-500">{adm.wardName} &bull; Room {adm.roomNumber}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {adm.assignedNurseName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{new Date(adm.admission_date).toLocaleDateString()}</div>
                        <div className="text-[10px]">{new Date(adm.admission_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border \${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isActive ? 'Inpatient (Active)' : 'Discharged'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <button
                            onClick={() => {
                              setDischargeModalAdmission(adm);
                              setDischargeSummary('');
                              setModalError('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            <LogOut className="h-3 w-3" />
                            Discharge
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {adm.calendar_days || 1} day(s) &bull; &#8377;{Number(adm.total_bed_charge || 0).toFixed(0)}
                          </span>
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

      {/* Discharge Modal */}
      {dischargeModalAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <LogOut className="h-4 w-4" />
                Discharge Inpatient
              </div>
              <button onClick={() => setDischargeModalAdmission(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDischarge} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {modalError}
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient:</span>
                  <span className="font-bold text-slate-900">{dischargeModalAdmission.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Admission #:</span>
                  <span className="font-mono text-slate-700">{dischargeModalAdmission.admission_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bed Location:</span>
                  <span className="text-slate-800">{dischargeModalAdmission.wardName} &bull; {dischargeModalAdmission.bedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Daily Bed Rate:</span>
                  <span className="font-semibold text-slate-800">&#8377;{Number(dischargeModalAdmission.bed_daily_rate || 500).toFixed(0)}/day</span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-[11px] space-y-1 leading-relaxed">
                <p className="font-bold">&bull; Required Discharge Workflow:</p>
                <p>Upon discharge, the bed will transition to <strong>CLEANING</strong> status (not Available).</p>
                <p>Housekeeping staff must complete cleaning before the bed becomes Available.</p>
                <p>&bull; Billing calculation: Calendar-day formula applied automatically.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discharge Summary &amp; Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Patient recovered well, vital signs stable, discharged with oral medications."
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setDischargeModalAdmission(null)}
                  className="px-3.5 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dischargeLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-60"
                >
                  {dischargeLoading ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
