'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Settings,
  ShieldAlert,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';

/**
 * VitalsScheduleCard
 * Displays:
 * 1. Observation Frequency, Last Recorded Time, Next Due Time, Due/Overdue status
 * 2. Schedule configuration modal for authorized clinical staff
 * 3. Truthful Early-Warning Score status ("Early-warning score not configured")
 */
export default function VitalsScheduleCard({
  admissionId,
  clinicId,
  scheduleData,
  onScheduleUpdated,
  canConfigure = true
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [frequency, setFrequency] = useState(scheduleData?.frequency || 'none');
  const [notes, setNotes] = useState(scheduleData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isConfigured = Boolean(scheduleData?.isConfigured);
  const isOverdue = Boolean(scheduleData?.isOverdue);
  const isDue = Boolean(scheduleData?.isDue);
  const status = scheduleData?.status || 'SCHEDULE_NOT_CONFIGURED';

  const formatDateTime = (iso) => {
    if (!iso) return 'Not recorded';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Not recorded';
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleOpenModal = () => {
    setFrequency(scheduleData?.frequency || 'none');
    setNotes(scheduleData?.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!admissionId) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/vitals/schedule`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          frequency: frequency === 'none' ? 'none' : frequency,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update observation schedule');
      }

      setIsModalOpen(false);
      if (onScheduleUpdated) {
        onScheduleUpdated(data.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CARD 1: OBSERVATION SCHEDULE & DUE STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isOverdue
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : isDue
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Observation Schedule & Timing
              </h3>
              <p className="text-[11px] text-slate-500">
                Frequency protocol for bedside vitals tracking
              </p>
            </div>
          </div>

          {canConfigure && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Configure
            </button>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Configured Frequency:</span>
            <span className="font-semibold text-slate-800">
              {isConfigured
                ? `Every ${scheduleData.frequencyHours} Hours (${scheduleData.frequency?.toUpperCase()})`
                : 'Schedule not configured'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Last Observation:</span>
            <span className="font-mono text-slate-700">
              {formatDateTime(scheduleData?.lastObservationTime)}
              {scheduleData?.lastObservationBy && (
                <span className="text-[10px] text-slate-400 block text-right font-sans">
                  by {scheduleData.lastObservationBy}
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Next Due Time:</span>
            <span className="font-mono text-slate-800 font-semibold">
              {isConfigured ? formatDateTime(scheduleData?.nextDueAt) : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Due Status:</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                isOverdue
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : isDue
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : isConfigured
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isOverdue ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                  OVERDUE ({scheduleData?.dueMessage})
                </>
              ) : isDue ? (
                <>
                  <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                  DUE NOW
                </>
              ) : isConfigured ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  ON SCHEDULE ({scheduleData?.dueMessage})
                </>
              ) : (
                'Schedule not configured'
              )}
            </span>
          </div>

          {scheduleData?.notes && (
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
              Instructions: &ldquo;{scheduleData.notes}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* CARD 2: EARLY-WARNING SCORE STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Early-Warning Score Protocol
              </h3>
              <p className="text-[11px] text-slate-500">
                Validated composite clinical deterioration scoring
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
            Audit State
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Protocol Method:</span>
            <span className="font-semibold text-slate-800">
              Early-warning score not configured
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Scoring Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Not Configured
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1 mt-1 leading-relaxed">
            <div className="flex items-start gap-1.5 font-medium text-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>Safety Rule: No automated composite deterioration score (e.g. NEWS2/MEWS) is configured for this clinic population.</span>
            </div>
            <p className="text-slate-500 pl-5">
              Individual abnormal-vital thresholds remain fully active and evaluated. A formal composite score is displayed only when an approved hospital protocol is configured.
            </p>
          </div>
        </div>
      </div>

      {/* SCHEDULE CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Configure Observation Frequency
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Observation Interval
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="none">Schedule not configured (Unscheduled)</option>
                  <option value="1h">Every 1 Hour (Q1H — Intensive Observation)</option>
                  <option value="2h">Every 2 Hours (Q2H — Close Monitoring)</option>
                  <option value="4h">Every 4 Hours (Q4H — Standard Inpatient)</option>
                  <option value="6h">Every 6 Hours (Q6H — Intermediate)</option>
                  <option value="8h">Every 8 Hours (Q8H — Shift Observation)</option>
                  <option value="12h">Every 12 Hours (Q12H — Twice Daily)</option>
                  <option value="24h">Every 24 Hours (Q24H — Daily Routine)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecting an interval recalculates the next due time from the latest recorded observation.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Clinical Instructions (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Q4H vitals; notify doctor if temp exceeds 38.5°C"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Schedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
