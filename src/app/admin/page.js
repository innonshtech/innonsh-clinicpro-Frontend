'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { formatTitleCase } from '@/utils/nameFormatting';
import { supabase } from '@/lib/supabase';
import ClinicDetailsModal from './clinics-manage/ClinicDetailsModal';
import {
  Users,
  UserPlus,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Plus,
  FlaskConical,
  Award,
  ExternalLink,
  X,
  FileText,
  Home
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const LAB_TYPE_LABELS = {
  diagnostic: 'Multi-disciplinary Diagnostic Center',
  pathology: 'Clinical Pathology Laboratory',
  radiology: 'Radiology & Imaging Center',
  molecular: 'Molecular Genetics & Microbiology',
  biochemistry: 'Clinical Biochemistry & Immunology'
};

const formatLabType = (type) => {
  if (!type) return 'Diagnostic Center';
  return LAB_TYPE_LABELS[type.toLowerCase()] || (type.charAt(0).toUpperCase() + type.slice(1));
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [clinicsCount, setClinicsCount] = useState(0);
  const [recentClinics, setRecentClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Labs state
  const [recentLabs, setRecentLabs] = useState([]);
  const [labsCount, setLabsCount] = useState(0);
  const [labsLoading, setLabsLoading] = useState(true);
  const [labsError, setLabsError] = useState('');
  const [selectedLab, setSelectedLab] = useState(null);

  const fetchLabs = async () => {
    try {
      setLabsLoading(true);
      setLabsError('');
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/v1/lab/fetchAll`, { headers });
      const rawLabs = res.data;
      const labs = rawLabs?.data?.labs || rawLabs?.labs || rawLabs?.data || (Array.isArray(rawLabs) ? rawLabs : []);
      const labList = Array.isArray(labs) ? labs : [];
      setLabsCount(labList.length);
      setRecentLabs(labList.slice(0, 4));
    } catch (err) {
      console.error('Error fetching labs:', err);
      setLabsError('Failed to load recent labs');
    } finally {
      setLabsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        // Run independent doctor, clinic, and lab requests in parallel
        const [doctorsRes, clinicsRes, labsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/v1/doctor/fetchAll`, { headers }),
          axios.get(`${API_BASE_URL}/api/v1/clinic/fetch-all-clinics`, { headers }),
          axios.get(`${API_BASE_URL}/api/v1/lab/fetchAll`, { headers })
        ]);

        if (doctorsRes.status === 'fulfilled') {
          const rawDocs = doctorsRes.value.data;
          const doctors = rawDocs?.data?.doctors || rawDocs?.doctors || rawDocs?.data || (Array.isArray(rawDocs) ? rawDocs : []);
          setDoctorsCount(Array.isArray(doctors) ? doctors.length : 0);
        } else {
          console.error('Error fetching doctors count:', doctorsRes.reason);
        }

        if (clinicsRes.status === 'fulfilled') {
          const rawClinics = clinicsRes.value.data;
          const clinics = rawClinics?.data?.clinics || rawClinics?.clinics || rawClinics?.data || (Array.isArray(rawClinics) ? rawClinics : []);
          let clinicList = Array.isArray(clinics) ? clinics : [];

          // Also check sessionStorage for newlyCreatedClinic (matching /admin/clinics-manage!)
          if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('newlyCreatedClinic');
            if (stored) {
              try {
                const newClinic = JSON.parse(stored);
                clinicList = clinicList.filter(c => {
                  const cId = c._id || c.id;
                  const nId = newClinic._id || newClinic.id;
                  if (cId && nId && String(cId) === String(nId)) return false;
                  return true;
                });
                clinicList = [{ ...newClinic, isNewlyCreated: true }, ...clinicList];
              } catch (e) {}
            }
          }

          // Ensure logos are present: if any clinic in list has null/missing logo, fetch/enrich from Supabase
          const missingLogoClinics = clinicList.filter(c => !c.logo && !c.logo_url && !c.logoUrl);
          if (missingLogoClinics.length > 0) {
            const ids = missingLogoClinics.map(c => c._id || c.id).filter(Boolean);
            if (ids.length > 0) {
              try {
                const { data: logoRows } = await supabase
                  .from('clinics')
                  .select('id, logo')
                  .in('id', ids);

                if (logoRows && logoRows.length > 0) {
                  const logoMap = new Map(logoRows.map(r => [String(r.id), r.logo]));
                  clinicList = clinicList.map(c => {
                    const idStr = String(c._id || c.id);
                    if (logoMap.has(idStr) && logoMap.get(idStr)) {
                      return { ...c, logo: logoMap.get(idStr) };
                    }
                    return c;
                  });
                }
              } catch (e) {
                console.warn('Could not enrich clinic logos from Supabase:', e);
              }
            }
          }

          setClinicsCount(clinicList.length);

          // Get the 4 most recently added clinics (sorted by creation date)
          const sortedClinics = [...clinicList]
            .sort((a, b) => {
              if (a.isNewlyCreated) return -1;
              if (b.isNewlyCreated) return 1;
              const dateA = new Date(a.createdAt || a.created_at || 0);
              const dateB = new Date(b.createdAt || b.created_at || 0);
              return dateB - dateA;
            })
            .slice(0, 4);

          setRecentClinics(sortedClinics);
        } else {
          console.error('Error fetching clinics count:', clinicsRes.reason);
        }

        if (labsRes.status === 'fulfilled') {
          const rawLabs = labsRes.value.data;
          const labs = rawLabs?.data?.labs || rawLabs?.labs || rawLabs?.data || (Array.isArray(rawLabs) ? rawLabs : []);
          const labList = Array.isArray(labs) ? labs : [];
          setLabsCount(labList.length);
          setRecentLabs(labList.slice(0, 4));
        } else {
          console.error('Error fetching labs count:', labsRes.reason);
          setLabsError('Failed to load recent labs');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setLabsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lock outer page scrolling while Clinic Details or Lab Details modal is open and restore when closed
  useEffect(() => {
    if (selectedLab || selectedClinic) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const mainContainer = document.querySelector('main');
      const originalMainOverflow = mainContainer ? mainContainer.style.overflow : '';
      const originalMainOverflowY = mainContainer ? mainContainer.style.overflowY : '';

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (mainContainer) {
        mainContainer.style.overflow = 'hidden';
        mainContainer.style.overflowY = 'hidden';
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        if (mainContainer) {
          mainContainer.style.overflow = originalMainOverflow;
          mainContainer.style.overflowY = originalMainOverflowY;
        }
      };
    }
  }, [selectedLab, selectedClinic]);

  const stats = [
    {
      name: 'Total Clinics',
      value: loading ? '...' : clinicsCount.toString(),
      icon: Building2,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Total Labs',
      value: loading ? '...' : labsCount.toString(),
      icon: FlaskConical,
      color: 'from-teal-500 to-teal-600'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Clinics - Now taking full width */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Clinics</h2>
              <p className="text-xs text-gray-500">Affiliated medical centers &amp; practices</p>
            </div>
          </div>
          <a 
            href="/admin/clinics-manage" 
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
          >
            View all clinics
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : recentClinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentClinics.map((clinic, idx) => {
              const name = formatTitleCase(clinic?.clinicName || clinic?.clinic_name || 'Clinic');
              const initial = name.charAt(0).toUpperCase();
              const logo = clinic?.logo || clinic?.logo_url || clinic?.logoUrl;
              return (
                <div 
                  key={clinic?._id || clinic?.id || idx} 
                  onClick={() => setSelectedClinic(clinic)}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl hover:bg-indigo-50/40 transition-all border border-gray-100 hover:border-indigo-200 cursor-pointer shadow-xs hover:shadow-sm"
                  title="Click to view full clinic details"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0 min-w-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover border border-indigo-200 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {initial}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{name}</p>
                      <p className="text-sm text-gray-500">{clinic?.city || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate max-w-[180px]">{clinic?.address || 'No address'}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{clinic?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500">No clinics found</p>
          </div>
        )}
      </div>

      {/* Recent Labs */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Labs</h2>
              <p className="text-xs text-gray-500">Independent diagnostic &amp; pathology facilities</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/labs-manage"
              className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
            >
              View all labs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {labsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : labsError ? (
          <div className="text-center py-8 border border-red-100 rounded-lg bg-red-50/40">
            <p className="text-sm text-red-600 mb-2">{labsError}</p>
            <button
              type="button"
              onClick={fetchLabs}
              className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : recentLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentLabs.map((lab, idx) => {
              const name = formatTitleCase(lab?.labName || lab?.lab_name || 'Laboratory');
              const initial = name.charAt(0).toUpperCase();
              const logo = lab?.logo;
              const labType = lab?.labType || lab?.lab_type || 'diagnostic';
              const city = lab?.city || 'N/A';
              const phone = lab?.phone || 'N/A';
              const status = lab?.status || 'active';
              const isNabl = Boolean(lab?.nablAccredited ?? lab?.nabl_accredited);

              return (
                <div
                  key={lab?._id || lab?.id || idx}
                  onClick={() => setSelectedLab(lab)}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl hover:bg-teal-50/40 transition-all border border-gray-100 hover:border-teal-200 cursor-pointer shadow-xs hover:shadow-sm"
                  title="Click to view full lab details"
                >
                  <div className="flex items-center space-x-3.5 mb-3 sm:mb-0 min-w-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={name}
                        className="h-11 w-11 rounded-xl object-contain p-1 border border-teal-100 bg-white flex-shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <span className="text-white font-bold text-sm">
                          {initial}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                          {name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium border border-teal-100 truncate max-w-[140px]">
                          {formatLabType(labType)}
                        </span>
                        <span className="text-xs text-gray-500">{city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1.5 text-sm text-gray-600 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {isNabl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="w-3 h-3 text-blue-600" />
                          NABL
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5 mr-1 text-gray-400" />
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">No laboratories registered yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage laboratories from the Labs section</p>
          </div>
        )}
      </div>

      {/* Lab Details Modal */}
      {selectedLab && (() => {
        const name = formatTitleCase(selectedLab.labName || selectedLab.lab_name || 'Laboratory Details');
        const initial = name.charAt(0).toUpperCase();
        const logo = selectedLab.logo;
        const labType = selectedLab.labType || selectedLab.lab_type || 'diagnostic';
        const description = selectedLab.description;
        const phone = selectedLab.phone || 'N/A';
        const email = selectedLab.contactEmail || selectedLab.email || 'N/A';
        const website = selectedLab.website;
        const address = selectedLab.address || 'N/A';
        const city = selectedLab.city || 'N/A';
        const state = selectedLab.state || 'N/A';
        const postalCode = selectedLab.postalCode || selectedLab.postal_code || 'N/A';
        const country = selectedLab.country || 'India';
        const regNumber = selectedLab.registrationNumber || selectedLab.registration_number || 'N/A';
        const taxId = selectedLab.taxId || selectedLab.tax_id || 'N/A';
        const isNabl = Boolean(selectedLab.nablAccredited ?? selectedLab.nabl_accredited);
        const hasHomeCollection = Boolean(selectedLab.homeCollectionAvailable ?? selectedLab.home_collection_available);
        const status = selectedLab.status || 'active';
        const createdAt = selectedLab.createdAt || selectedLab.created_at;
        const updatedAt = selectedLab.updatedAt || selectedLab.updated_at;

        const isValidWebsite = website && typeof website === 'string' && website.trim() !== '' && !['na', 'n/a', 'none', 'null', 'undefined'].includes(website.trim().toLowerCase());
        const cleanDescription = (description && typeof description === 'string' && !['na', 'n/a', 'none', 'null'].includes(description.trim().toLowerCase()))
          ? description
          : null;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Modal Header - Fixed */}
              <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Laboratory Details</h2>
                    <p className="text-xs text-gray-500">Comprehensive facility record</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* 1. Header Identity Banner */}
                <div className="bg-slate-50/80 p-4 sm:p-4.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          className="h-16 w-16 rounded-xl object-contain p-1 border border-teal-200 bg-white shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border border-teal-200 shadow-sm">
                          <span className="text-white text-2xl font-bold">{initial}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 leading-tight break-words">{name}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                          {status}
                        </span>
                        {isNabl && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 border border-blue-200">
                            <Award className="w-3 h-3 text-blue-600" />
                            NABL Accredited
                          </span>
                        )}
                        {hasHomeCollection && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1 border border-purple-200">
                            <Home className="w-3 h-3 text-purple-600" />
                            Home Collection
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-100">
                          {formatLabType(labType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {cleanDescription ? (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{cleanDescription}</p>
                    </div>
                  ) : (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-sm text-gray-400 italic">No description provided.</p>
                    </div>
                  )}
                </div>

                {/* 2. Contact & Communication */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    Contact &amp; Communication
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Helpline / Phone</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{phone}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Contact Email</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{email}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Website</span>
                      {isValidWebsite ? (
                        <a
                          href={website.startsWith('http') ? website : `https://${website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 underline inline-flex items-center gap-1 text-sm font-semibold break-all"
                        >
                          {website}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Premises Address & Location */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    Premises Address &amp; Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Premises Address</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{address}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">City</span>
                      <span className="text-sm font-semibold text-gray-900">{city}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">State / Province</span>
                      <span className="text-sm font-semibold text-gray-900">{state}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">PIN / Postal Code</span>
                      <span className="text-sm font-semibold text-gray-900">{postalCode}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Country</span>
                      <span className="text-sm font-semibold text-gray-900">{country}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Registration & Certifications */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    Registration &amp; Accreditation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Registration Number</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{regNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">GSTIN / Tax ID</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{taxId}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">NABL Accredited</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isNabl ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isNabl ? 'Accredited' : 'Not Accredited'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Home Collection</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${hasHomeCollection ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {hasHomeCollection ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Account Timestamps */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    Account Timestamps
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Created At</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Last Updated</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center z-10">
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Clinic Details Modal (Shared component matching /admin/clinics-manage) */}
      {selectedClinic && (
        <ClinicDetailsModal
          isOpen={Boolean(selectedClinic)}
          clinic={selectedClinic}
          onClose={() => setSelectedClinic(null)}
          onEditClinic={() => {
            router.push('/admin/clinics-manage');
          }}
        />
      )}
    </div>
  );
}


