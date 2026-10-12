'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Pencil,
  Stethoscope,
  Eye
} from 'lucide-react';
import { formatTitleCase } from '@/utils/nameFormatting';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { supabase } from '@/lib/supabase';
import AdminDoctorDetailsModal from './AdminDoctorDetailsModal';

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  inactive: 'bg-rose-100 text-rose-800',
  suspended: 'bg-rose-100 text-rose-800',
  rejected: 'bg-rose-100 text-rose-800'
};

/**
 * ClinicDetailsModal
 * Shared complete Clinic Details modal used across SuperAdmin (Clinics Management & Dashboard).
 * Displays full clinic overview, contact details, operating hours, associated doctors, and documents.
 */
export default function ClinicDetailsModal({
  isOpen,
  clinic,
  onClose,
  onEditClinic,
  onApproveClinic,
  isApproving = false
}) {
  const [detailedClinic, setDetailedClinic] = useState(clinic);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctorForView, setSelectedDoctorForView] = useState(null);

  // Sync clinic prop
  useEffect(() => {
    if (clinic) {
      setDetailedClinic(clinic);
    }
  }, [clinic]);

  // Lock outer scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Fetch full details & doctors when opened
  useEffect(() => {
    if (!isOpen || !clinic) return;

    const clinicId = clinic.id || clinic._id;
    if (!clinicId) return;

    // 1. Fetch complete clinic details by ID
    const fetchFullClinic = async () => {
      try {
        setDetailsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-by-id/${clinicId}`, {
          headers: getAuthHeaders()
        }).catch(() => null);

        if (res && res.ok) {
          const resData = await res.json().catch(() => ({}));
          if (resData.success && resData.data?.clinic) {
            setDetailedClinic(prev => ({
              ...prev,
              ...resData.data.clinic
            }));
          }
        } else {
          // Direct Supabase fallback
          const { data: sbClinic, error: sbErr } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .maybeSingle();

          if (!sbErr && sbClinic) {
            setDetailedClinic(prev => ({
              ...prev,
              ...sbClinic,
              clinicName: sbClinic.clinic_name || prev?.clinicName,
              clinicType: sbClinic.clinic_type || prev?.clinicType,
              registrationNumber: sbClinic.registration_number || prev?.registrationNumber,
              licenseDocumentUrl: sbClinic.license_document_url || sbClinic.license_document,
              gstDocumentUrl: sbClinic.gst_document_url || sbClinic.gst_document
            }));
          }
        }
      } catch (err) {
        console.warn('Error fetching detailed clinic record:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    // 2. Fetch doctors belonging exclusively to this clinic
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${clinicId}`, {
          headers: getAuthHeaders()
        }).catch(() => null);

        if (res && res.ok) {
          const resData = await res.json().catch(() => ({}));
          if (resData.success && Array.isArray(resData.data?.doctors)) {
            setClinicDoctors(resData.data.doctors);
            return;
          }
        }

        // Direct Supabase fallback
        const { data: docs, error: sbErr } = await supabase
          .from('doctors')
          .select('*')
          .eq('clinic_id', clinicId);

        if (!sbErr && Array.isArray(docs)) {
          setClinicDoctors(docs);
        } else {
          setClinicDoctors([]);
        }
      } catch (err) {
        console.warn('Error fetching doctors for clinic:', err);
        try {
          const { data: docs } = await supabase.from('doctors').select('*').eq('clinic_id', clinicId);
          setClinicDoctors(Array.isArray(docs) ? docs : []);
        } catch (_) {
          setClinicDoctors([]);
        }
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchFullClinic();
    fetchDoctors();
  }, [isOpen, clinic]);

  if (!isOpen || !clinic) return null;

  const current = detailedClinic || clinic;
  const clinicName = formatTitleCase(current.clinic_name || current.clinicName || 'Unnamed Clinic');
  const clinicType = current.clinic_type || current.clinicType || 'General';
  const description = current.description;
  const status = current.status || 'pending';
  const isApproved = current.approved || status === 'active';

  const logo = current.logo || current.logo_url || current.logoUrl;
  const phone = current.phone || 'N/A';
  const email = current.contact_email || current.contactEmail || current.email || 'N/A';
  const website = current.website;
  const address = current.address || 'N/A';
  const city = current.city || 'N/A';
  const state = current.state || current.province || 'N/A';
  const postalCode = current.postal_code || current.postalCode || 'N/A';
  const country = current.country || 'N/A';

  const regNumber = current.registration_number || current.registrationNumber || 'N/A';
  const taxId = current.tax_id || current.taxId || current.gst_number || current.gstNumber || 'N/A';
  const regDateRaw = current.created_at || current.createdAt || current.registrationDate;
  const regDate = regDateRaw
    ? (!isNaN(new Date(regDateRaw).getTime())
        ? new Date(regDateRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : regDateRaw)
    : 'N/A';

  let specialtiesList = [];
  if (Array.isArray(current.specialties)) {
    specialtiesList = current.specialties.filter(Boolean);
  } else if (typeof current.specialties === 'string') {
    try {
      const parsed = JSON.parse(current.specialties);
      if (Array.isArray(parsed)) {
        specialtiesList = parsed.filter(Boolean);
      }
    } catch (_) {
      specialtiesList = current.specialties
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }

  const is24x7 = Boolean(current.is_24x7 ?? current.is24x7);
  let openingHours = current.opening_hours || current.openingHours;
  if (typeof openingHours === 'string') {
    try {
      openingHours = JSON.parse(openingHours);
    } catch (e) {
      // keep as string
    }
  }

  const licenseUrl = current.license_document_url || current.licenseDocumentUrl || current.license_document || current.licenseDocument;
  const gstUrl = current.gst_document_url || current.gstDocumentUrl || current.gst_document || current.gstDocument;

  const isValidWebsite = website && typeof website === 'string' && website.trim() !== '' && !['na', 'n/a', 'none', 'null', 'undefined'].includes(website.trim().toLowerCase());
  const cleanDescription = (description && typeof description === 'string' && !['na', 'n/a', 'none', 'null'].includes(description.trim().toLowerCase()))
    ? description
    : null;

  const isImg = (url) => typeof url === 'string' && (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.includes('cloudinary.com') || url.startsWith('data:image/'));

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header - Fixed/Sticky */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
            <div className="flex items-center space-x-2.5">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Clinic Details</h2>
              {detailsLoading && (
                <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-1.5 font-medium">
                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                  Updating...
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body - Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* 1. BASIC INFORMATION */}
            <div className="bg-slate-50/80 p-4 sm:p-4.5 rounded-xl border border-slate-200/70">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt={clinicName}
                      className="h-14 w-14 rounded-full object-cover border border-indigo-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-200 shadow-sm">
                      <span className="text-indigo-600 text-xl font-bold">{clinicName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight truncate">{clinicName}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                      {status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown'}
                    </span>
                    {isApproved && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        Approved
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    <span className="capitalize font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">
                      {clinicType} Clinic
                    </span>
                    {specialtiesList.length > 0 && (
                      <span className="text-xs text-gray-500">
                        Specialties: {specialtiesList.slice(0, 3).join(', ')}{specialtiesList.length > 3 ? ` +${specialtiesList.length - 3} more` : ''}
                      </span>
                    )}
                  </div>
                  {cleanDescription && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {cleanDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CONTACT & LOCATION */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                Contact &amp; Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium truncate" title={email}>{email}</span>
                </div>
                {isValidWebsite && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline truncate"
                    >
                      {website}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-2 sm:col-span-2 pt-1 border-t border-gray-100">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">
                    {[address, city, state, postalCode, country].filter(x => x && x !== 'N/A').join(', ') || 'Address not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. REGISTRATION & LEGAL */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Registration Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Reg. Number</span>
                  <span className="font-semibold text-gray-800">{regNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Tax ID / GST</span>
                  <span className="font-semibold text-gray-800">{taxId}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Registered On</span>
                  <span className="font-semibold text-gray-800">{regDate}</span>
                </div>
              </div>
            </div>

            {/* 4. OPERATING HOURS */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Operating Hours
                </h4>
                {is24x7 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    Open 24x7
                  </span>
                )}
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                {is24x7 ? (
                  <p className="text-xs text-gray-600 font-medium">This facility operates 24 hours a day, 7 days a week.</p>
                ) : (openingHours && typeof openingHours === 'object' && Object.keys(openingHours).length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      const dayVal = openingHours[day];
                      let display = 'Closed';
                      if (dayVal) {
                        if (typeof dayVal === 'string') {
                          display = dayVal;
                        } else if (typeof dayVal === 'object') {
                          if (dayVal.isOpen === false || dayVal.is_open === false || dayVal.closed) {
                            display = 'Closed';
                          } else if (dayVal.open && dayVal.close) {
                            display = `${dayVal.open} - ${dayVal.close}`;
                          } else if (dayVal.start && dayVal.end) {
                            display = `${dayVal.start} - ${dayVal.end}`;
                          }
                        }
                      }
                      return (
                        <div key={day} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center">
                          <span className="block font-bold capitalize text-gray-600 text-xs">{day.slice(0, 3)}</span>
                          <span className={`block mt-1 text-xs ${display === 'Closed' ? 'text-gray-400 font-normal' : 'text-gray-900 font-semibold'}`}>
                            {display}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : typeof openingHours === 'string' && openingHours.trim() ? (
                  <p className="text-sm text-gray-800 font-medium">{openingHours}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">Opening hours not specified</p>
                )}
              </div>
            </div>

            {/* 5. ASSOCIATED DOCTORS (READ-ONLY) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-indigo-600" />
                  Doctors
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                    {clinicDoctors.length}
                  </span>
                </h4>
                {doctorsLoading && (
                  <span className="text-xs text-indigo-600 flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Loading doctors...
                  </span>
                )}
              </div>

              {doctorsLoading ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-500 animate-spin" />
                  Loading clinic doctors...
                </div>
              ) : clinicDoctors.length === 0 ? (
                <div className="p-6 bg-slate-50/70 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                  <Stethoscope className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  No doctors registered under this clinic yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-xs">
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider">
                            Doctor Name
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider">
                            Specialty
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2.5 text-right font-semibold text-gray-600 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {clinicDoctors.map((doc) => {
                          const docName = `Dr. ${formatTitleCase(doc.firstName || doc.first_name || '')} ${formatTitleCase(doc.lastName || doc.last_name || '')}`.trim();
                          const docSpecialty = doc.specialty || doc.specialization || 'General';
                          const docPhone = doc.phone || 'N/A';
                          const docEmail = doc.email || 'N/A';
                          const docStatus = (doc.status || 'active').toLowerCase();
                          const docImg = doc.profileImage || doc.profile_image;
                          const docInitial = (docName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D').toUpperCase();

                          return (
                            <tr key={doc.id || doc._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <div className="flex items-center space-x-2.5">
                                  {docImg ? (
                                    <img
                                      src={docImg}
                                      alt={docName}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                                      {docInitial}
                                    </div>
                                  )}
                                  <span className="font-semibold text-gray-900">{docName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                                  {docSpecialty}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                                <div>{docPhone}</div>
                                <div className="text-[11px] text-gray-400">{docEmail}</div>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                  docStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {docStatus}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDoctorForView(doc)}
                                  className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold text-[11px] transition-colors"
                                  title="View doctor details"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </button>
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

            {/* 6. DOCUMENTS */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* License Document */}
                <div className="border border-gray-200 rounded-xl p-3.5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">License Document</h5>
                      {licenseUrl && (
                        <a
                          href={licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors border border-indigo-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Document
                        </a>
                      )}
                    </div>
                    {licenseUrl ? (
                      isImg(licenseUrl) ? (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-slate-50 max-h-40 flex items-center justify-center">
                          <img
                            src={licenseUrl}
                            alt="License document"
                            className="w-full h-auto max-h-40 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mt-2 p-3 bg-slate-50 border border-gray-200 rounded-lg flex items-center text-sm text-gray-700 font-medium">
                          <FileText className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">License document attached</span>
                        </div>
                      )
                    ) : (
                      <div className="text-[13px] text-gray-400 italic py-5 text-center bg-slate-50/50 rounded-lg border border-dashed border-gray-200 mt-2">
                        No license document uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* GST Document */}
                <div className="border border-gray-200 rounded-xl p-3.5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">GST Document</h5>
                      {gstUrl && (
                        <a
                          href={gstUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors border border-indigo-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Document
                        </a>
                      )}
                    </div>
                    {gstUrl ? (
                      isImg(gstUrl) ? (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-slate-50 max-h-40 flex items-center justify-center">
                          <img
                            src={gstUrl}
                            alt="GST document"
                            className="w-full h-auto max-h-40 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mt-2 p-3 bg-slate-50 border border-gray-200 rounded-lg flex items-center text-sm text-gray-700 font-medium">
                          <FileText className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">GST document attached</span>
                        </div>
                      )
                    ) : (
                      <div className="text-[13px] text-gray-400 italic py-5 text-center bg-slate-50/50 rounded-lg border border-dashed border-gray-200 mt-2">
                        No GST document uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer - Fixed/Sticky */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3 z-10">
            {onEditClinic && (
              <button
                type="button"
                onClick={() => onEditClinic(current)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Clinic
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
            >
              Close
            </button>
            {onApproveClinic && !isApproved && status === 'pending' && (
              <button
                type="button"
                onClick={() => onApproveClinic(current._id || current.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg text-sm font-semibold text-white hover:from-emerald-700 hover:to-green-700 transition-all shadow-sm"
                disabled={isApproving}
              >
                {isApproving ? 'Approving...' : 'Approve Clinic'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Doctor Details Modal for SuperAdmin */}
      {selectedDoctorForView && (
        <AdminDoctorDetailsModal
          doctor={selectedDoctorForView}
          isOpen={Boolean(selectedDoctorForView)}
          onClose={() => setSelectedDoctorForView(null)}
        />
      )}
    </>
  );
}
