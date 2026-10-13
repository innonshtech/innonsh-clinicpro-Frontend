'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { formatTitleCase } from '@/utils/nameFormatting';

/**
 * AdminDoctorDetailsModal
 * Read-only Doctor Details modal for SuperAdmin inside Clinic Details.
 * Displays all doctor profile information, qualifications, documents, and hospital assignment.
 * Strictly read-only (no edit or delete actions).
 */
export default function AdminDoctorDetailsModal({ doctor, isOpen, onClose }) {
  const [docPreview, setDocPreview] = useState({
    isOpen: false,
    title: '',
    url: '',
    isPdf: false
  });

  if (!isOpen || !doctor) return null;

  const fullName = `Dr. ${formatTitleCase(doctor.firstName || doctor.first_name || '')} ${formatTitleCase(doctor.lastName || doctor.last_name || '')}`.trim();
  const specialty = doctor.specialty || doctor.specialization || 'General Practitioner';
  const subSpecialty = doctor.supSpeciality || doctor.sup_speciality || doctor.subSpecialty;
  const email = doctor.email || 'N/A';
  const phone = doctor.phone || 'N/A';
  const status = (doctor.status || 'active').toLowerCase();
  const isActive = status === 'active';
  const isVerified = Boolean(doctor.isVerified ?? doctor.is_verified ?? false);

  const profileImage = doctor.profileImage || doctor.profile_image || null;
  const hasPhoto = Boolean(
    profileImage &&
    typeof profileImage === 'string' &&
    profileImage.trim().length > 0 &&
    !profileImage.toLowerCase().includes('placeholder') &&
    !profileImage.toLowerCase().includes('ui-avatars.com') &&
    !profileImage.toLowerCase().includes('default-avatar')
  );

  const experience = doctor.experience !== undefined && doctor.experience !== null ? `${doctor.experience} years` : 'Not specified';
  const fee = doctor.consultantFee || doctor.consultant_fee || doctor.consultation_fee || doctor.consultationFee;
  const formattedFee = fee ? `₹${fee}` : 'Not specified';

  const licenseNumber = doctor.licenseNumber || doctor.license_number || 'N/A';
  const department = doctor.department || 'General Medicine';
  const gender = doctor.gender ? formatTitleCase(doctor.gender) : 'Not specified';
  const dob = doctor.dateOfBirth || doctor.date_of_birth;
  const formattedDob = dob ? (!isNaN(new Date(dob).getTime()) ? new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : dob) : 'Not specified';

  const homeAddress = doctor.homeAddress || doctor.home_address || 'Not specified';
  const location = doctor.location || doctor.hospitalCity || doctor.hospital_city || 'Not specified';

  // Clinic / Hospital Info
  const hospitalName = doctor.hospital || doctor.hospital_name || doctor.clinicName || doctor.clinic_name || 'Assigned Clinic';
  const hospitalAddress = doctor.hospitalAddress || doctor.hospital_address || 'Not specified';
  const hospitalPhone = doctor.hospitalPhone || doctor.hospital_phone || doctor.hospitalNumber || doctor.hospital_number || 'Not specified';

  // Qualifications
  let qualificationsList = [];
  if (Array.isArray(doctor.qualifications)) {
    qualificationsList = doctor.qualifications.filter(Boolean);
  } else if (typeof doctor.qualifications === 'string' && doctor.qualifications.trim()) {
    qualificationsList = doctor.qualifications.split(',').map(q => q.trim()).filter(Boolean);
  }

  // Availability
  let availableDays = [];
  if (Array.isArray(doctor.available?.days)) {
    availableDays = doctor.available.days;
  } else if (typeof doctor.available?.days === 'string' && doctor.available.days.trim()) {
    availableDays = doctor.available.days.split(',').map(d => d.trim());
  } else if (Array.isArray(doctor.available_days || doctor.availableDays)) {
    availableDays = doctor.available_days || doctor.availableDays;
  } else if (typeof (doctor.available_days || doctor.availableDays) === 'string') {
    availableDays = (doctor.available_days || doctor.availableDays).split(',').map(d => d.trim());
  }

  const sessionTime = doctor.sessionTime || doctor.session_time || doctor.available?.time || doctor.available_time || doctor.availableTime || '30 mins';

  // Documents
  const identityProof = doctor.identityProof || doctor.identity_proof;
  const degreeCertificate = doctor.degreeCertificate || doctor.degree_certificate;

  const isPdf = (url) => typeof url === 'string' && url.toLowerCase().includes('.pdf');
  const isImage = (url) => typeof url === 'string' && (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.includes('cloudinary.com') || url.startsWith('data:image/'));

  const openDoc = (title, url) => {
    if (!url) return;
    setDocPreview({
      isOpen: true,
      title,
      url,
      isPdf: isPdf(url)
    });
  };

  const initial = (fullName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D').toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">Doctor Details</h3>
                <p className="text-xs text-gray-500">Read-only profile preview for SuperAdmin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-white/80"
              title="Close doctor details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Profile Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-5 rounded-2xl border border-indigo-100/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0">
                {hasPhoto ? (
                  <img
                    src={profileImage}
                    alt={fullName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-white">
                    {initial}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}
                  title={isActive ? 'Active Doctor' : 'Inactive Doctor'}
                >
                  {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-xl font-bold text-gray-900 truncate">{fullName}</h4>
                  {isVerified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <p className="text-sm font-medium text-indigo-700 mt-1">{specialty}</p>
                {subSpecialty && <p className="text-xs text-gray-500">{subSpecialty}</p>}

                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-600">
                  <span className="inline-flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {phone}
                  </span>
                  <span className="inline-flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {email}
                  </span>
                  <span className="inline-flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {experience} Exp.
                  </span>
                  <span className="inline-flex items-center font-semibold text-emerald-700">
                    <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                    {formattedFee} Fee
                  </span>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Practice & Qualifications */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <Award className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Professional Details
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">License Number:</span>
                    <span className="font-semibold text-gray-800">{licenseNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-semibold text-gray-800">{department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Session Duration:</span>
                    <span className="font-semibold text-gray-800">{sessionTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Qualifications:</span>
                    {qualificationsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {qualificationsList.map((q, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {q}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">None listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal & Contact */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Personal Information
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Gender:</span>
                    <span className="font-semibold text-gray-800">{gender}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="font-semibold text-gray-800">{formattedDob}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-semibold text-gray-800">{location}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-gray-500 block mb-0.5">Home Address:</span>
                    <span className="text-gray-700 font-medium">{homeAddress}</span>
                  </div>
                </div>
              </div>

              {/* Hospital / Clinic Details */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <Building2 className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Hospital / Clinic Affiliation
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Facility Name:</span>
                    <span className="font-semibold text-gray-800">{hospitalName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-gray-500">Facility Phone:</span>
                    <span className="font-semibold text-gray-800">{hospitalPhone}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-gray-500 block mb-0.5">Address:</span>
                    <span className="text-gray-700 font-medium">{hospitalAddress}</span>
                  </div>
                </div>
              </div>

              {/* Availability Schedule */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Availability Schedule
                </h5>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1">Working Days:</span>
                    {availableDays.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {availableDays.map((d, idx) => (
                          <span key={idx} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium capitalize">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Standard clinic hours</span>
                    )}
                  </div>
                  <div className="py-1">
                    <span className="text-gray-500 block mb-0.5">Consultation Time:</span>
                    <span className="font-semibold text-gray-800">{sessionTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
                Verification Documents
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Identity Proof */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-gray-800 truncate">Identity Proof</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Government Issued ID</p>
                  </div>
                  {identityProof ? (
                    <button
                      type="button"
                      onClick={() => openDoc('Identity Proof', identityProof)}
                      className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold text-xs transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400 italic text-[11px] shrink-0">Not uploaded</span>
                  )}
                </div>

                {/* Degree Certificate */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-gray-800 truncate">Degree Certificate</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Medical Council Certificate</p>
                  </div>
                  {degreeCertificate ? (
                    <button
                      type="button"
                      onClick={() => openDoc('Degree Certificate', degreeCertificate)}
                      className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold text-xs transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400 italic text-[11px] shrink-0">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* About Doctor / Bio */}
            {doctor.bio && (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  About Doctor
                </h5>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {doctor.bio}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer - Read Only Close Button */}
          <div className="flex-shrink-0 px-6 py-3.5 bg-slate-50 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {docPreview.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm">{docPreview.title}</h4>
              <div className="flex items-center gap-2">
                <a
                  href={docPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs flex items-center"
                  title="Open original in new tab"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setDocPreview({ isOpen: false, title: '', url: '', isPdf: false })}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 min-h-[300px]">
              {docPreview.isPdf ? (
                <iframe
                  src={docPreview.url}
                  title={docPreview.title}
                  className="w-full h-[500px] rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <img
                  src={docPreview.url}
                  alt={docPreview.title}
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
