'use client';
// Next.js structural refresh mapping logic

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import { generatePrescriptionHtml } from '@/utils/prescriptionHtmlGenerator';

function PrescriptionPdfContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchConsultation = async () => {
      try {
        const token = localStorage.getItem('token')?.trim();
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/consultation/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (result.success) {
          const { appointment, visit, patient } = result.data;
          const userStr = localStorage.getItem('user') || '{}';
          const user = JSON.parse(userStr);

          const clinicId = user.clinicId?._id || 'default';
          const savedTemplateStr = localStorage.getItem(`rx_template_${clinicId}`);
          const savedTemplate = savedTemplateStr ? JSON.parse(savedTemplateStr) : {};

          const localMedsStr = localStorage.getItem('print_medicines');
          const localMeds = localMedsStr ? JSON.parse(localMedsStr) : [];
          const localNotes = localStorage.getItem('print_notes') || '';
          const localDiagnosis = localStorage.getItem('print_diagnosis') || '';

          const rxData = {
            doctor: {
              firstName: appointment?.doctorId?.firstName || 'Dr.',
              lastName: appointment?.doctorId?.lastName || 'Consultant',
              qualification: appointment?.doctorId?.qualification || 'MD, MBBS',
              specialty: appointment?.doctorId?.specialty || 'General Practitioner',
              phone: appointment?.doctorId?.phone || '+123 456 789',
              registrationNumber: appointment?.doctorId?.registrationNumber || 'N/A',
              clinicName: appointment?.doctorId?.hospital || 'Health Care Medical Clinic'
            },
            patient: {
              firstName: patient?.firstName || '',
              lastName: patient?.lastName || '',
              age: calculateAge(patient?.dateOfBirth),
              address: patient?.address || 'N/A'
            },
            medicines: localMeds.length > 0 ? localMeds : (visit?.medicines || []),
            notes: `${localDiagnosis ? `Diagnosis: ${localDiagnosis}\n` : (visit?.diagnosis ? `Diagnosis: ${visit.diagnosis}\n` : '')}${localNotes || visit?.clinicalNotes || ''}`,
            template: savedTemplate
          };

          const html = generatePrescriptionHtml(rxData);
          setHtmlContent(html);
        }
      } catch (err) {
        console.error("Prescription load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [id]);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const age = new Date(difference);
    return Math.abs(age.getUTCFullYear() - 1970);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-sm font-medium text-slate-500 animate-pulse">Generating Prescription View...</p>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-sm font-medium text-red-500">Could not retrieve prescription details.</p>
      </div>
    );
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

export default function PrescriptionPdfPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-sm font-medium text-slate-500 animate-pulse">Generating Prescription View...</p>
      </div>
    }>
      <PrescriptionPdfContent />
    </Suspense>
  );
}
