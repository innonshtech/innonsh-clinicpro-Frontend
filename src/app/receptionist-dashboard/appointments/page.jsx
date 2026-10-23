'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Search, Plus, Check, X, Phone,
  Stethoscope, ChevronLeft, FileText,
  ChevronRight, CalendarDays, CalendarCheck, Receipt, ClipboardList, BarChart2,
  MapPin, Info, MoreVertical, Building, IndianRupee, Printer, UserCheck, XCircle, AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { appointmentService } from '@/utils/appointmentService';
import { doctorService } from '@/utils/doctorService';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '@/utils/api';
import { createPortal } from 'react-dom';
import './index.css';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#3b82f6','#6366f1','#8b5cf6','#ec4899','#f59e0b',
  '#10b981','#06b6d4','#f97316','#84cc16','#14b8a6',
];
function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(first = '', last = '') {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?';
}

function StatusBadge({ status }) {
  switch (status) {
    case 'booked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Booked
        </span>
      );
    case 'checked_in':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Checked In
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          In Consultation
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Completed
        </span>
      );
    case 'rescheduled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Rescheduled
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Cancelled
        </span>
      );
    case 'no_show':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          No Show
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
          {status || 'Unknown'}
        </span>
      );
  }
}

function patientAge(dob) {
  if (!dob) return 'N/A';
  return `${new Date().getFullYear() - new Date(dob).getFullYear()}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function shortId(id = '') {
  return `APT-${id.slice(-6).toUpperCase()}`;
}

/* ─────────────────────────────────────────────────────────
   Drawer — Appointment Details
───────────────────────────────────────────────────────── */
function AppointmentDetailDrawer({
  appointment, isOpen, onClose,
  onGenerateBill, onCheckin, onReschedule, onCancel, onStatusUpdate
}) {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('details');

  useEffect(() => {
    if (!appointment || !isOpen) return;
    setPaymentInfo(null);
    setActiveDrawerTab('details');
    const tok = localStorage.getItem('token');
    if (!tok || appointment.status !== 'completed') return;
    setLoadingPayment(true);
    fetch(`${API_BASE_URL}/api/v1/visit/list?appointmentId=${appointment._id}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then(r => r.json())
      .then(async data => {
        if (data.success && data.data.visits?.length > 0) {
          const visit = data.data.visits[0];
          const br = await fetch(`${API_BASE_URL}/api/v1/billing/list?visitId=${visit._id}`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          const bd = await br.json();
          if (bd.success && bd.data.bills?.length > 0) {
            const bill = bd.data.bills[0];
            setPaymentInfo({
              status: bill.paymentStatus || 'pending',
              amount: (bill.items?.reduce((s, i) => s + i.amount, 0) || 0) + (bill.tax || 0) - (bill.discount || 0),
              method: bill.paymentMethod || 'Cash',
              date: bill.updatedAt || bill.createdAt,
            });
          }
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingPayment(false));
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patientId || {};
  const doctor = appointment.doctorId || {};

  const pName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
  const pInitials = initials(patient.firstName, patient.lastName);
  const dName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();

  const drawerContent = (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className={`drawer-panel ${isOpen ? 'open' : ''}`}>
        
        {/* Header */}
        <div className="drawer-header">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Appointment Details</h2>
              <button className="drawer-close-btn" onClick={onClose} aria-label="Close details">
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={appointment.status} /> 
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                Booked on {fmtDate(appointment.appointmentDate)} &bull; {appointment.timeSlot || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body">
          <div className="drawer-exact-patient-card" style={{ marginBottom: '12px' }}>
            <div className="patient-avatar">
              {pInitials}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{pName}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                {patientAge(patient.dateOfBirth)} Yrs &bull; {patient.gender || 'N/A'} &bull; ID: {patient.patientCode || 'N/A'}
              </p>
              {patient.phoneNumber && (
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {patient.phoneNumber}
                </p>
              )}
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={16} className="text-blue-600" /> Attending Physician
            </h4>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Dr. {dName || 'Doctor'}</p>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0 0' }}>{doctor.specialization || 'General Physician'}</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} className="text-blue-600" /> Schedule &amp; Reason
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#334155', margin: '0 0 6px 0' }}>
              <strong>Date:</strong> {fmtDate(appointment.appointmentDate)} at {appointment.timeSlot || '—'}
            </p>
            {appointment.queueNumber != null && (
              <p style={{ fontSize: '0.8125rem', color: '#334155', margin: '0 0 6px 0' }}>
                <strong>Queue Number:</strong> #{appointment.queueNumber}
              </p>
            )}
            <p style={{ fontSize: '0.8125rem', color: '#334155', margin: 0 }}>
              <strong>Reason:</strong> {appointment.reason || 'General Checkup'}
            </p>
            {appointment.notes && (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '6px 0 0 0' }}>
                <strong>Notes:</strong> {appointment.notes}
              </p>
            )}
          </div>

          {paymentInfo && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>Payment Info</h4>
              <p style={{ fontSize: '0.8125rem', color: '#047857', margin: 0 }}>
                Status: <strong className="capitalize">{paymentInfo.status}</strong> &bull; Amount: ₹{paymentInfo.amount} ({paymentInfo.method})
              </p>
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="drawer-footer" style={{ background: '#ffffff', display: 'flex', gap: '8px' }}>
          {['booked', 'rescheduled'].includes(appointment.status) && (
            <>
              <button
                onClick={() => { onClose(); onCheckin(appointment._id); }}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck size={16} /> Check In
              </button>
              <button
                onClick={() => { onClose(); onReschedule(appointment); }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <CalendarDays size={16} /> Reschedule
              </button>
              <button
                onClick={() => { onClose(); onCancel(appointment._id); }}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                title="Cancel Appointment"
              >
                <X size={16} />
              </button>
            </>
          )}

          {appointment.status === 'checked_in' && (
            <button
              onClick={() => { onClose(); onStatusUpdate(appointment._id, 'in_progress'); }}
              className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              Start Consultation
            </button>
          )}

          {appointment.status === 'in_progress' && (
            <button
              onClick={() => { onClose(); onStatusUpdate(appointment._id, 'completed'); }}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              Complete Visit
            </button>
          )}

          {appointment.status === 'completed' && (
            <>
              <button 
                onClick={() => window.open(`/prescription/pdf?id=${appointment._id}`)}
                className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={16} /> Print Prescription
              </button>
              <button 
                onClick={() => { onClose(); onGenerateBill(appointment); }}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Receipt size={16} /> Generate Bill
              </button>
            </>
          )}
        </div>

      </div>
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Content
───────────────────────────────────────────────────────── */
const AppointmentsDashboardContent = () => {
  const searchParams = useSearchParams();
  const initialDate  = searchParams.get('date') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [appointments, setAppointments] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [token, setToken] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Reschedule modal states
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleDoctor, setRescheduleDoctor] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Billing modal states
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingAppointment, setBillingAppointment] = useState(null);
  const [billingVisit, setBillingVisit] = useState(null);
  const [billingItems, setBillingItems] = useState([{ type: 'consultation', name: 'Consultation Fee', amount: 500 }]);
  const [billingDiscount, setBillingDiscount] = useState(0);
  const [billingTax, setBillingTax] = useState(0);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  useEffect(() => {
    const tok = localStorage.getItem('token');
    if (tok) {
      setToken(tok);
      doctorService.getDoctors(tok)
        .then(res => { if (res.success) setAllDoctors(res.data.doctors); })
        .catch(() => {});
    }
  }, []);

  /* ── Fetch Appointments ── */
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const params = {
        page: pagination.page, limit: 10,
        ...(activeTab !== 'all' && activeTab !== 'todays_bookings' && { status: activeTab }),
        ...(activeTab === 'todays_bookings' && { status: 'booked', date: today }),
        ...(activeTab !== 'todays_bookings' && dateFilter && { date: dateFilter }),
        ...(doctorFilter !== 'all' && { doctorId: doctorFilter }),
      };
      const res = await appointmentService.getAppointments(params, token);
      if (res.success) {
        setAppointments(res.data.appointments || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: (res.data.appointments || []).length, limit: 10 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAppointments();
  }, [token, pagination.page, doctorFilter, dateFilter, activeTab]);

  /* ── Status Update ── */
  const handleStatusUpdate = async (id, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await appointmentService.updateStatus(id, newStatus, token);
      if (res.success) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /* ── Check-in ── */
  const handleCheckIn = async (id) => {
    setIsUpdatingStatus(true);
    try {
      const res = await appointmentService.checkIn(id, token);
      if (res.success) {
        toast.success(`Patient checked in! Queue #${res.data?.queue_number || ''}`);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to check in');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /* ── Cancel ── */
  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation:');
    if (reason === null) return;
    if (!reason.trim()) { toast.error('Reason required'); return; }
    setIsUpdatingStatus(true);
    try {
      const res = await appointmentService.cancelAppointment(id, reason, token);
      if (res.success) { toast.success('Appointment cancelled'); fetchAppointments(); }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /* ── Open Reschedule ── */
  const handleOpenReschedule = (appt) => {
    setRescheduleAppt(appt);
    setRescheduleDate(appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : '');
    setRescheduleTime(appt.timeSlot || '');
    setRescheduleDoctor(appt.doctorId?._id || '');
    setRescheduleReason('');
    setRescheduleNotes('');
    if (appt.doctorId?._id) {
      const d = appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : '';
      doctorService.getAvailableSlots(appt.doctorId._id, d, token)
        .then(s => {
          const l = s.data?.slots || s.slots || [];
          setAvailableSlots(l.filter(x => x.isAvailable !== false).map(x => x.slot || x));
        })
        .catch(() => {});
    }
  };

  /* ── Save Reschedule ── */
  const handleSaveReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) { toast.error('Select a date and time slot'); return; }
    setRescheduleLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/appointment/reschedule/${rescheduleAppt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          appointmentDate: rescheduleDate,
          timeSlot: rescheduleTime,
          doctorId: rescheduleDoctor,
          reason: rescheduleReason,
          notes: rescheduleNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Appointment rescheduled successfully!');
        setRescheduleAppt(null);
        fetchAppointments();
      } else {
        toast.error(data.message || 'Failed to reschedule');
      }
    } catch {
      toast.error('Error rescheduling appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleOpenBilling = async (appointment) => {
    try {
      setBillingAppointment(appointment);
      setBillingModalOpen(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/visit/list?appointmentId=${appointment._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.visits?.length > 0) {
        const visit = data.data.visits[0];
        setBillingVisit(visit);
      }
    } catch {
      toast.error('Failed to load visit data.');
    }
  };

  const handleGenerateInvoice = async () => {
    setIsGeneratingBill(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          visit_id: billingVisit?._id,
          items: billingItems.map(i => ({ ...i, amount: Number(i.amount) || 0 })),
          discount: Number(billingDiscount),
          tax: Number(billingTax),
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Bill generated successfully!'); setBillingModalOpen(false); }
      else toast.error(data.message || 'Failed to generate bill');
    } catch {
      toast.error('Error generating bill.');
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const filtered = appointments.filter(a => {
    const pn = `${a.patientId?.firstName || ''} ${a.patientId?.lastName || ''}`;
    const dn = `${a.doctorId?.firstName  || ''} ${a.doctorId?.lastName  || ''}`;
    return (
      pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const openDrawer  = (a) => { setSelectedAppointment(a); setIsDrawerOpen(true); };
  const closeDrawer = ()  => { setIsDrawerOpen(false); setTimeout(() => setSelectedAppointment(null), 300); };

  // Calculate tab counts
  const todayStr = new Date().toISOString().split('T')[0];
  const tabCounts = {
    all: pagination.total || appointments.length,
    today: appointments.filter(a => {
      const aDate = a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : '';
      return aDate === todayStr;
    }).length,
    checked_in: appointments.filter(a => a.status === 'checked_in').length,
    in_progress: appointments.filter(a => a.status === 'in_progress').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      {/* 1. Header Card (Exact Match to Lab Orders) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Patient Scheduling</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage, schedule, and track patient consultations, check-ins, and doctor queues.
          </p>
        </div>

        <Link
          href="/receptionist-dashboard/appointments/add"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          id="btn-book-appointment"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* 2. Search & Filter Bar (Matching Lab Orders) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-appointments"
              type="text"
              placeholder="Search by patient name, doctor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
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

          {/* Date & Doctor Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              />
            </div>

            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Reset Date
              </button>
            )}

            <div className="relative">
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3.5 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Doctors</option>
                {allDoctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Appointments</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {tabCounts.all}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('todays_bookings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'todays_bookings'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Today's Bookings</span>
              {tabCounts.today > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-800 font-bold">
                  {tabCounts.today}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('checked_in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'checked_in'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span>Checked In</span>
              {tabCounts.checked_in > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-800 font-bold">
                  {tabCounts.checked_in}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'in_progress'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>In Consultation</span>
              {tabCounts.in_progress > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
                  {tabCounts.in_progress}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Completed</span>
              {tabCounts.completed > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {tabCounts.completed}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'cancelled'
                  ? 'bg-red-50 text-red-700 border border-red-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Cancelled</span>
              {tabCounts.cancelled > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800 font-bold">
                  {tabCounts.cancelled}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Appointments Table (Matching Lab Orders) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No appointments found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || dateFilter || doctorFilter !== 'all' || activeTab !== 'all'
                ? 'No appointments match your filter criteria. Try clearing search filters.'
                : 'No patient appointments scheduled yet.'}
            </p>
            <Link
              href="/receptionist-dashboard/appointments/add"
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Book First Appointment</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Patient</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Status &amp; Queue</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((appt, i) => {
                  const patient = appt.patientId || {};
                  const doctor = appt.doctorId || {};
                  const pName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
                  const pInitials = initials(patient.firstName, patient.lastName);
                  const dName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
                  const apptKey = appt._id || i;

                  return (
                    <tr
                      key={apptKey}
                      onClick={() => openDrawer(appt)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Patient Column */}
                      <td className="py-4 px-4 sm:px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: avatarColor(pName) }}
                          >
                            {pInitials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{pName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                {patientAge(patient.dateOfBirth)} Yrs
                              </span>
                              {patient.phoneNumber && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {patient.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Doctor Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">Dr. {dName || 'Doctor'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{doctor.specialization || 'General Physician'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Column */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-1.5 leading-tight">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {fmtDate(appt.appointmentDate)}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {appt.timeSlot || '—'}
                          </p>
                        </div>
                      </td>

                      {/* Status & Queue Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={appt.status} />
                          {appt.queueNumber != null && (
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Q-{appt.queueNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {['booked', 'rescheduled'].includes(appt.status) && (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCheckIn(appt._id); }}
                                disabled={isUpdatingStatus}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                title="Check in patient"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Check In</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenReschedule(appt); }}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Reschedule appointment"
                              >
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Reschedule</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCancel(appt._id); }}
                                disabled={isUpdatingStatus}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                title="Cancel Appointment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {appt.status === 'checked_in' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appt._id, 'in_progress'); }}
                              disabled={isUpdatingStatus}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                              Start Visit
                            </button>
                          )}

                          {appt.status === 'in_progress' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appt._id, 'completed'); }}
                              disabled={isUpdatingStatus}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                              Complete
                            </button>
                          )}

                          {appt.status === 'completed' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenBilling(appt); }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Bill</span>
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
        )}

        {/* Pagination matching Lab Orders */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing {(pagination.page - 1) * (pagination.limit || 10) + 1}–{Math.min(pagination.page * (pagination.limit || 10), pagination.total)} of {pagination.total} appointments
            </span>
            <div className="flex items-center gap-1">
              <button 
                disabled={pagination.page === 1} 
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button 
                    key={pg} 
                    onClick={() => setPagination(p => ({ ...p, page: pg }))}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      pagination.page === pg 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && <span className="text-slate-400 px-1 text-xs">…</span>}
              <button 
                disabled={pagination.page === pagination.totalPages} 
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedAppointment && (
        <AppointmentDetailDrawer
          appointment={selectedAppointment}
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          onGenerateBill={handleOpenBilling}
          onCheckin={handleCheckIn}
          onReschedule={handleOpenReschedule}
          onCancel={handleCancel}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Reschedule Appointment
              </h3>
              <button 
                onClick={() => setRescheduleAppt(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient</label>
                <p className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold">
                  {rescheduleAppt.patientId?.firstName} {rescheduleAppt.patientId?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Doctor Selection</label>
                <select 
                  value={rescheduleDoctor} 
                  onChange={(e) => setRescheduleDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                >
                  <option value="">Select Doctor</option>
                  {allDoctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Date</label>
                  <input
                    type="date" 
                    value={rescheduleDate} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setRescheduleDate(e.target.value);
                      if (rescheduleDoctor) {
                        doctorService.getAvailableSlots(rescheduleDoctor, e.target.value, token)
                          .then(s => { const l = s.data?.slots||s.slots||[]; setAvailableSlots(l.filter(x=>x.isAvailable!==false).map(x=>x.slot||x)); })
                          .catch(() => {});
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason</label>
                  <input
                    type="text" 
                    placeholder="e.g. Patient Request" 
                    value={rescheduleReason} 
                    onChange={e => setRescheduleReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Available Slots</label>
                {availableSlots.length === 0 ? (
                  <p className="bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2 text-xs font-medium text-amber-800">
                    No slots available on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {availableSlots.map(slot => (
                      <button 
                        key={slot} 
                        type="button"
                        onClick={() => setRescheduleTime(slot)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all border ${
                          rescheduleTime === slot 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <textarea 
                  rows="2" 
                  placeholder="Any additional notes..." 
                  value={rescheduleNotes} 
                  onChange={e => setRescheduleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleAppt(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReschedule}
                  disabled={rescheduleLoading || !rescheduleTime}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {billingModalOpen && billingAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Generate Invoice
              </h2>
              <button 
                onClick={() => setBillingModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 mb-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Patient</p>
                <p className="text-sm font-bold text-slate-900">{billingAppointment.patientId?.firstName} {billingAppointment.patientId?.lastName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Doctor</p>
                <p className="text-sm font-semibold text-slate-800">Dr. {billingAppointment.doctorId?.firstName} {billingAppointment.doctorId?.lastName}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Billing Items</h3>
                <button 
                  type="button"
                  onClick={() => setBillingItems([...billingItems, { type: 'other', name: '', amount: 0 }])}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>
              {billingItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-2">
                  <select 
                    value={item.type} 
                    onChange={e => { const u = [...billingItems]; u[idx].type = e.target.value; setBillingItems(u); }}
                    className="col-span-4 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="lab">Lab Test</option>
                    <option value="medicine">Pharmacy</option>
                    <option value="other">Other</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Description..." 
                    value={item.name}
                    onChange={e => { const u = [...billingItems]; u[idx].name = e.target.value; setBillingItems(u); }}
                    className="col-span-5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="₹" 
                    value={item.amount}
                    onChange={e => { const u = [...billingItems]; u[idx].amount = parseFloat(e.target.value) || 0; setBillingItems(u); }}
                    className="col-span-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none text-right"
                  />
                  <div className="col-span-1 text-center">
                    {idx > 0 && (
                      <button 
                        type="button"
                        onClick={() => setBillingItems(billingItems.filter((_, i) => i !== idx))} 
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Discount (₹)</label>
                <input 
                  type="number" 
                  value={billingDiscount} 
                  onChange={e => setBillingDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Tax (₹)</label>
                <input 
                  type="number" 
                  value={billingTax} 
                  onChange={e => setBillingTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payable</span>
              <span className="text-xl font-black text-slate-900">
                ₹{(billingItems.reduce((s, i) => s + i.amount, 0) + billingTax - billingDiscount).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setBillingModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleGenerateInvoice} 
                disabled={isGeneratingBill}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isGeneratingBill ? 'Generating...' : 'Finalize & Save Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentsDashboard = () => (
  <Suspense fallback={
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Appointments...</p>
      </div>
    </div>
  }>
    <AppointmentsDashboardContent />
  </Suspense>
);

export default AppointmentsDashboard;
