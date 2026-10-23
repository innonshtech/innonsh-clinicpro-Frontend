'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import LabOrdersManagement from '@/components/LabOrdersManagement';

export default function ClinicLabOrdersPage() {
  const router = useRouter();
  const [isLabEnabled, setIsLabEnabled] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const cId = user.id || user._id || user.clinicId;
      if (!cId) {
        setIsLabEnabled(true);
        setLoading(false);
        return;
      }

      fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${cId}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          const clinic = data.data?.clinic;
          const labActive = clinic?.modules ? clinic.modules.lab !== false : true;
          setIsLabEnabled(labActive);
        })
        .catch(err => {
          console.error('Failed to verify lab module:', err);
          setIsLabEnabled(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (_) {
      router.push('/login');
    }
  }, []);

  if (loading && isLabEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying clinic configuration...</p>
      </div>
    );
  }

  if (isLabEnabled === false) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lab Module Not Enabled</h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            Diagnostic laboratory ordering and worklists are disabled for this clinic account.
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

  return <LabOrdersManagement userRole="clinic" roleTitle="Clinic" />;
}
