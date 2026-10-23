'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  X,
  User,
  BedDouble,
  LogOut,
  RefreshCw,
  HeartPulse,
  Eye
} from 'lucide-react';

export default function ClinicIpdAdmissionsPage() {
  const router = useRouter();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isIpdEnabled, setIsIpdEnabled] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, admitted, discharged
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Discharge modal state
  const [dischargeModalAdmission, setDischargeModalAdmission] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const clinicId = user.id || user._id || user.clinicId;

      if (!clinicId) {
        setIsIpdEnabled(true);
        loadAdmissions();
        return;
      }

      fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${clinicId}`, {
        headers: getAuthHeaders()
      })
        .then((res) => res.json())
        .then((data) => {
          const clinic = data.data?.clinic;
          const ipdActive = clinic?.modules ? clinic.modules.ipd === true : false;
          setIsIpdEnabled(ipdActive);
          if (ipdActive) {
            loadAdmissions();
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to verify clinic IPD module:', err);
          setIsIpdEnabled(true);
          loadAdmissions();
        });
    } catch (_) {
      router.push('/login');
    }
  }, []);

  const loadAdmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.admissions)) {
        setAdmissions(data.data.admissions);
      } else {
        setError(data.message || 'Failed to load inpatient admissions');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to IPD service');
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
      const res = await fetch(
        `${API_BASE_URL}/api/v1/ipd/admissions/${dischargeModalAdmission.id}/discharge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            dischargeSummary: dischargeSummary.trim(),
            dischargeCondition: 'recovered'
          })
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to discharge patient');
      }

      setSuccessMessage(
        `Patient ${dischargeModalAdmission.patientName} discharged successfully. Bed ${dischargeModalAdmission.bedNumber} is now in CLEANING status.`
      );
      setDischargeModalAdmission(null);
      setDischargeSummary('');
      loadAdmissions();
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err) {
      setModalError(err.message || 'Failed to complete discharge');
    } finally {
      setDischargeLoading(false);
    }
  };

  const filteredAdmissions = admissions.filter((adm) => {
    if (statusFilter !== 'all' && adm.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchPatient = (adm.patientName || '').toLowerCase().includes(term);
      const cleanNum = (adm.admission_number || '').replace(/^#+/, '').toLowerCase();
      const matchNum = cleanNum.includes(term);
      const matchPhone = (adm.patientPhone || '').includes(term);
      const matchDoc = (adm.admittingDoctorName || '').toLowerCase().includes(term);
      const matchNurse = (
        adm.nurseName ||
        adm.nurse_name ||
        adm.assignedNurseName ||
        adm.assigned_nurse_name ||
        ''
      )
        .toLowerCase()
        .includes(term);
      return matchPatient || matchNum || matchPhone || matchDoc || matchNurse;
    }
    return true;
  });

  if (loading && isIpdEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying IPD configuration...</p>
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
            Inpatient department (IPD) admissions are disabled for this clinic account.
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section — Matches Bed & Ward Management & Lab Orders */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">IPD / INPATIENT ADMISSIONS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IPD Inpatient Admissions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Active inpatients, assigned medical care team, location hierarchy, and admission status
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start sm:self-auto">
          <Link
            href="/clinic/beds"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs gap-2"
          >
            <BedDouble className="h-4 w-4 text-blue-600" />
            <span>Manage Beds</span>
          </Link>
          <Link
            href="/clinic/nurses"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm gap-2"
          >
            <HeartPulse className="h-4 w-4" />
            <span>Manage Nurses</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, admission ID, doctor, nurse, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
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

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            All ({admissions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('admitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'admitted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            Active Inpatients ({admissions.filter((a) => a.status === 'admitted').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('discharged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'discharged'
                ? 'bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            Discharged ({admissions.filter((a) => a.status === 'discharged').length})
          </button>
          <button
            onClick={loadAdmissions}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0 ml-1"
            title="Refresh admissions list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Admissions Table — Aligned with Bed & Ward Management Container Width */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading inpatient admissions...</span>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
              <ClipboardList className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No inpatient admissions found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'Doctors can admit registered patients into available beds from the Doctor Inpatients dashboard.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-6">Admission ID</th>
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Care Team (Doctor &amp; Nurse)</th>
                  <th className="py-3 px-6">Location Hierarchy</th>
                  <th className="py-3 px-6">Admitted On</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => {
                  const isActive = adm.status === 'admitted';
                  const cleanAdmId = (adm.admission_number || adm.admissionNumber || '').replace(/^#+/, '');
                  const nurseName =
                    adm.nurseName ||
                    adm.nurse_name ||
                    adm.assignedNurseName ||
                    adm.assigned_nurse_name ||
                    null;

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Admission ID without # */}
                      <td className="py-4 px-6 font-mono font-bold text-blue-600 text-xs sm:text-sm">
                        {cleanAdmId}
                      </td>

                      {/* Patient Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">{adm.patientName}</div>
                        {adm.patientPhone && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{adm.patientPhone}</div>
                        )}
                      </td>

                      {/* Doctor & Nurse — Combined cleanly without separate Assigned Nurse heading and NO initials avatar */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-xs">
                          {adm.admittingDoctorName || adm.doctor_name || 'Attending Physician'}
                        </div>
                        {nurseName ? (
                          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                            <span className="text-slate-400">Nurse:</span>
                            <span className="text-slate-800 font-semibold">{nurseName}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">Nurse: Unassigned</div>
                        )}
                        {adm.consultingDoctors && adm.consultingDoctors.length > 0 && (
                          <span className="text-[10px] text-indigo-600 block mt-0.5 font-medium">
                            +{adm.consultingDoctors.length} consulting doctor(s)
                          </span>
                        )}
                      </td>

                      {/* Location: Complete Hierarchy Bed • Room, Ward • Floor • Building */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <BedDouble className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span>Bed {adm.bedNumber || adm.bed_number || 'N/A'}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-700 font-medium">
                              Room {adm.roomNumber || adm.room_number || '-'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
                            <span className="font-medium text-slate-700">
                              {adm.wardName || adm.ward_name || 'Ward'}
                            </span>
                            {(adm.floorNumber || adm.floor_number) && (
                              <>
                                <span className="text-slate-300">&bull;</span>
                                <span>Floor {adm.floorNumber || adm.floor_number}</span>
                              </>
                            )}
                            {(adm.buildingName || adm.building_name) && (
                              <>
                                <span className="text-slate-300">&bull;</span>
                                <span>{adm.buildingName || adm.building_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Admitted On */}
                      <td className="py-4 px-6 text-slate-500">
                        <div className="font-medium text-slate-700">
                          {new Date(adm.admission_date || adm.admissionDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(adm.admission_date || adm.admissionDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5 border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isActive ? 'Active Inpatient' : 'Discharged'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {isActive ? (
                          <button
                            onClick={() => {
                              setDischargeModalAdmission(adm);
                              setDischargeSummary('');
                              setModalError('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Discharge</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {adm.calendar_days || 1} day(s) &bull; &#8377;
                            {Number(adm.total_bed_charge || 0).toFixed(0)}
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

      {/* 4. Discharge Modal */}
      {dischargeModalAdmission && (
        <div 
          onClick={() => setDischargeModalAdmission(null)}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <LogOut className="h-4 w-4" />
                <span>Discharge Inpatient</span>
              </div>
              <button
                onClick={() => setDischargeModalAdmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDischarge} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient:</span>
                  <span className="font-bold text-slate-900">{dischargeModalAdmission.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Admission ID:</span>
                  <span className="font-mono text-slate-700">
                    {(dischargeModalAdmission.admission_number || '').replace(/^#+/, '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bed Location:</span>
                  <span className="text-slate-800">
                    {dischargeModalAdmission.wardName} &bull; Bed {dischargeModalAdmission.bedNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Daily Bed Rate:</span>
                  <span className="font-semibold text-slate-800">
                    &#8377;{Number(dischargeModalAdmission.bed_daily_rate || 500).toFixed(0)}/day
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-[11px] space-y-1 leading-relaxed">
                <p className="font-bold">&bull; Automatic Bed Status Transition:</p>
                <p>Upon discharge, the bed transitions immediately to <strong>CLEANING</strong> status.</p>
                <p>Housekeeping must mark the bed cleaned before it can be assigned to another inpatient.</p>
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDischargeModalAdmission(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dischargeLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  {dischargeLoading && <RefreshCw className="animate-spin h-3.5 w-3.5" />}
                  <span>Confirm Discharge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
