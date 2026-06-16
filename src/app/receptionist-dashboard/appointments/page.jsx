'use client';
import React, { useEffect, useState, Suspense } from 'react';
import {
  Calendar, Clock, Search, Plus, Check, X, Phone,
  Stethoscope, ChevronLeft, FileText,
  ChevronRight, CalendarDays, CalendarCheck, Receipt, ClipboardList, BarChart2,
  MapPin, Info, MoreVertical, Building, IndianRupee, Printer, UserCheck, XCircle
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

const STATUS_META = {
  booked:      { label: 'Booked',          cssClass: 'booked' },
  checked_in:  { label: 'Checked In',      cssClass: 'checked_in' },
  in_progress: { label: 'In Consultation', cssClass: 'in_progress' },
  completed:   { label: 'Completed',       cssClass: 'completed' },
  rescheduled: { label: 'Rescheduled',     cssClass: 'rescheduled' },
  cancelled:   { label: 'Cancelled',       cssClass: 'cancelled' },
  no_show:     { label: 'No Show',         cssClass: 'no_show' },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.booked;
  return (
    <span className={`status-pill ${meta.cssClass}`}>
      {meta.label}
    </span>
  );
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
   All actions live here. Table rows show ONLY status badge.
───────────────────────────────────────────────────────── */
function AppointmentDetailDrawer({
  appointment, isOpen, onClose,
  onGenerateBill, onCheckin, onReschedule, onCancel, onStatusUpdate
}) {
  const [paymentInfo,    setPaymentInfo]    = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('details'); // 'details', 'payment', 'timeline'

  useEffect(() => {
    if (!appointment || !isOpen) return;
    setPaymentInfo(null);
    setActiveDrawerTab('details'); // Reset tab on open
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
              date:   bill.updatedAt || bill.createdAt,
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
        
        {/* ── Exact Match Header ── */}
        <div className="drawer-header">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>Appointment Details</h2>
              <button className="drawer-close-btn" onClick={onClose} aria-label="Close details">
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusPill status={appointment.status} /> 
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                Booked on {fmtDate(appointment.appointmentDate)} &bull; {appointment.timeSlot || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="drawer-body">

          {/* Exact Match Patient Card */}
          <div className="drawer-exact-patient-card" style={{ marginBottom: '12px' }}>
            <div className="patient-avatar">
              {pInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pName}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, margin: 0 }}>
                {patientAge(patient.dateOfBirth)} Yrs &bull; {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Male'}
              </p>
              {patient.phoneNumber && (
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Phone size={12} /> {patient.phoneNumber}
                </p>
              )}
            </div>
          </div>
          
          {/* Exact Match Information Grid */}
          <div className="drawer-exact-grid" style={{ marginBottom: '16px' }}>
            
            {/* Doctor */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Stethoscope size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Doctor</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {dName}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.specialization || 'General Physician'}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Date &amp; Time</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtDate(appointment.appointmentDate)}</p>
                <p style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment.timeSlot || '—'}</p>
              </div>
            </div>

            {/* Appointment ID */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Appointment ID</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment._id ? `APT-${appointment._id.substring(0, 6).toUpperCase()}` : '—'}</p>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Info size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Reason for Visit</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment.reason || 'General Checkup'}</p>
              </div>
            </div>

            {/* Department */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Department</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.department || 'General Medicine'}</p>
              </div>
            </div>

            {/* Visit Type */}
            <div className="drawer-exact-cell">
              <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={16} />
              </div>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Visit Type</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment.visitType || 'OPD'}</p>
              </div>
            </div>

          </div>

          {/* Actions Grid */}
          {['booked', 'rescheduled'].includes(appointment.status) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Actions</h3>
              <div className="drawer-exact-actions" style={{ marginBottom: 0 }}>
                <button className="drawer-action-square drawer-action-square-green" onClick={() => { onCheckin(appointment._id); onClose(); }}>
                  <UserCheck size={18} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Check In</span>
                </button>
                <button className="drawer-action-square drawer-action-square-blue" onClick={() => { onReschedule(appointment); onClose(); }}>
                  <CalendarDays size={18} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Reschedule</span>
                </button>
                <button className="drawer-action-square drawer-action-square-red" onClick={() => { onCancel(appointment._id); onClose(); }}>
                  <XCircle size={18} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Tabs Navigation ── */}
          <div className="drawer-tabs">
            <button className={`drawer-tab-btn ${activeDrawerTab === 'details' ? 'active' : ''}`} onClick={() => setActiveDrawerTab('details')}>Details</button>
            <button className={`drawer-tab-btn ${activeDrawerTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveDrawerTab('payment')}>Payment</button>
            <button className={`drawer-tab-btn ${activeDrawerTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveDrawerTab('timeline')}>Timeline</button>
          </div>

          {/* ── Tab Content ── */}
          <div>
            
            {/* DETAILS TAB */}
            {activeDrawerTab === 'details' && (
              <div className="drawer-details-table">
                <div className="drawer-details-row">
                  <div className="drawer-details-icon"><ClipboardList size={16} /></div>
                  <div className="drawer-details-label">Visit Type</div>
                  <div className="drawer-details-value">{appointment.visitType || 'OPD'}</div>
                </div>
                <div className="drawer-details-row">
                  <div className="drawer-details-icon"><Building size={16} /></div>
                  <div className="drawer-details-label">Department</div>
                  <div className="drawer-details-value">{doctor.department || 'General Medicine'}</div>
                </div>
                <div className="drawer-details-row">
                  <div className="drawer-details-icon"><IndianRupee size={16} /></div>
                  <div className="drawer-details-label">Consultation Fee</div>
                  <div className="drawer-details-value">₹{doctor.consultationFee || 500}</div>
                </div>
                <div className="drawer-details-row">
                  <div className="drawer-details-icon"><FileText size={16} /></div>
                  <div className="drawer-details-label">Notes</div>
                  <div className="drawer-details-value">{appointment.notes || '—'}</div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeDrawerTab === 'payment' && (
              <div className="drawer-details-table">
                {loadingPayment ? (
                  <div className="skeleton" style={{ height: '80px', margin: '16px' }} />
                ) : paymentInfo ? (
                  <>
                    <div className="drawer-details-row">
                      <div className="drawer-details-label">Status</div>
                      <div className="drawer-details-value"><span className="paid-badge">Paid</span></div>
                    </div>
                    <div className="drawer-details-row">
                      <div className="drawer-details-label">Amount</div>
                      <div className="drawer-details-value">₹{paymentInfo.amount?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="drawer-details-row">
                      <div className="drawer-details-label">Method</div>
                      <div className="drawer-details-value">{paymentInfo.paymentMethod || 'Cash'}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="drawer-details-row">
                      <div className="drawer-details-label">Status</div>
                      <div className="drawer-details-value"><span className="pending-badge">Pending</span></div>
                    </div>
                    <div className="drawer-details-row">
                      <div className="drawer-details-label">Amount</div>
                      <div className="drawer-details-value">—</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeDrawerTab === 'timeline' && (
              <div style={{ padding: '16px 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {/* Vertical Line */}
                  <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0' }} />
                  
                  {/* Step 1: Booked */}
                  <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: '4px solid #fff' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Appointment Booked</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{new Date(appointment.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Step 2: Checked In */}
                  <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1, opacity: ['checked_in', 'in_progress', 'completed'].includes(appointment.status) ? 1 : 0.4 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['checked_in', 'in_progress', 'completed'].includes(appointment.status) ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: '4px solid #fff' }}>
                      {['checked_in', 'in_progress', 'completed'].includes(appointment.status) && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Patient Checked In</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {appointment.checkInTime ? new Date(appointment.checkInTime).toLocaleString('en-IN') : (['checked_in', 'in_progress', 'completed'].includes(appointment.status) ? 'Completed' : 'Pending')}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Consultation */}
                  <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1, opacity: ['in_progress', 'completed'].includes(appointment.status) ? 1 : 0.4 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['in_progress', 'completed'].includes(appointment.status) ? '#f59e0b' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: '4px solid #fff' }}>
                      {['in_progress', 'completed'].includes(appointment.status) && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Consultation</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {['in_progress', 'completed'].includes(appointment.status) ? (appointment.status === 'in_progress' ? 'In Progress' : 'Completed') : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Completed */}
                  <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1, opacity: appointment.status === 'completed' ? 1 : 0.4 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: appointment.status === 'completed' ? '#8b5cf6' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: '4px solid #fff' }}>
                      {appointment.status === 'completed' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Visit Completed</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {appointment.status === 'completed' ? 'Done' : 'Pending'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── Sticky Action Footer ── */}
        {appointment.status === 'completed' && (
          <div className="drawer-footer" style={{ background: '#ffffff' }}>
            <button 
              onClick={() => window.open(`/prescription/pdf?id=${appointment._id}`)}
              style={{ flex: 1, padding: '12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Printer size={18} /> Print Prescription
            </button>
            <button 
              onClick={() => onGenerateBill(appointment)}
              style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Receipt size={18} /> Generate Bill
            </button>
          </div>
        )}

      </div>
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────────── */
const AppointmentsDashboardContent = () => {
  const searchParams = useSearchParams();
  const todayStr = new Date().toISOString().split('T')[0];
  const initialDate  = searchParams.get('date') || todayStr;

  const [searchTerm,       setSearchTerm]       = useState('');
  const [doctorFilter,     setDoctorFilter]      = useState('all');
  const [dateFilter,       setDateFilter]        = useState(initialDate);
  const [appointments,     setAppointments]      = useState([]);
  const [allDoctors,       setAllDoctors]        = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [pagination,       setPagination]        = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [token,            setToken]             = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus]  = useState(false);
  const [activeTab,        setActiveTab]         = useState('todays_bookings');

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDrawerOpen,         setIsDrawerOpen]        = useState(false);

  // Reschedule
  const [rescheduleAppt,    setRescheduleAppt]    = useState(null);
  const [rescheduleDate,    setRescheduleDate]    = useState('');
  const [rescheduleTime,    setRescheduleTime]    = useState('');
  const [rescheduleDoctor,  setRescheduleDoctor]  = useState('');
  const [rescheduleReason,  setRescheduleReason]  = useState('');
  const [rescheduleNotes,   setRescheduleNotes]   = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [availableSlots,    setAvailableSlots]    = useState([]);

  // Billing
  const [billingModalOpen,   setBillingModalOpen]   = useState(false);
  const [billingAppointment, setBillingAppointment] = useState(null);
  const [billingVisit,       setBillingVisit]       = useState(null);
  const [billingItems,       setBillingItems]       = useState([{ type: 'consultation', name: 'Consultation Fee', amount: 500 }]);
  const [billingDiscount,    setBillingDiscount]    = useState(0);
  const [billingTax,         setBillingTax]         = useState(0);
  const [isGeneratingBill,   setIsGeneratingBill]   = useState(false);

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
        setAppointments(res.data.appointments);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch');
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
      toast.error(err.message || 'Failed');
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
        toast.success(`Patient checked in! Queue #${res.data.queue_number}`);
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
      toast.error(err.message || 'Failed');
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
        toast.success('Rescheduled!');
        setRescheduleAppt(null);
        fetchAppointments();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch {
      toast.error('Error rescheduling');
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
          visit_id: billingVisit._id,
          items: billingItems.map(i => ({ ...i, amount: Number(i.amount) || 0 })),
          discount: Number(billingDiscount),
          tax: Number(billingTax),
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Bill generated!'); setBillingModalOpen(false); }
      else toast.error(data.message || 'Failed');
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

  // Local filtering by search term (API handles status filter)

  const openDrawer  = (a) => { setSelectedAppointment(a); setIsDrawerOpen(true); };
  const closeDrawer = ()  => { setIsDrawerOpen(false); setTimeout(() => setSelectedAppointment(null), 300); };

  const AppointmentRow = ({ appointment, showStatus = true, isActive }) => {
    const patient = appointment.patientId || {};
    const doctor = appointment.doctorId || {};
    const pName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
    const pInitials = initials(patient.firstName, patient.lastName);
    const dName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    
    // In design: completed tab doesn't show status pill? 
    // Actually the image shows "All Appointments" tab which has Status. 
    // Assuming "Completed" tab also has it or not, I'll use the flag.
    const gridCols = showStatus ? '2fr 1.5fr 1.5fr 3.5fr' : '2.5fr 1.8fr 1.6fr';

    return (
      <div 
        className="appt-row" 
        style={{ gridTemplateColumns: gridCols, ...(isActive ? { background: '#f8fafc' } : {}) }}
        onClick={() => openDrawer(appointment)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <div className="patient-avatar" style={{ width: 44, height: 44 }}>{pInitials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{pName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, background: '#e0e7ff', padding: '2px 8px', borderRadius: '999px' }}>
                {patientAge(patient.dateOfBirth)} Yrs
              </span>
              {patient.phoneNumber && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: '#64748b' }}>
                  <Phone size={12} style={{ color: '#9ca3af' }} /> {patient.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={16} style={{ color: '#4338ca' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>Dr. {dName}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{doctor.specialization || 'General Physician'}</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Calendar size={14} style={{ color: '#3b82f6' }} /> {fmtDate(appointment.appointmentDate)}
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} style={{ color: '#3b82f6' }} /> {appointment.timeSlot || '—'}
          </p>
        </div>
        {showStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusPill status={appointment.status} />
            {appointment.queueNumber != null && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                Q-{appointment.queueNumber}
              </span>
            )}
            {/* Quick Actions */}
            {/* Quick Actions */}
            {['booked', 'rescheduled'].includes(appointment.status) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <button 
                  className="btn-outline-blue"
                  onClick={(e) => { e.stopPropagation(); handleCheckIn(appointment._id); }}
                >
                  Check In
                </button>
                <button 
                  className="btn-outline-gray"
                  onClick={(e) => { e.stopPropagation(); handleOpenReschedule(appointment); }}
                >
                  <CalendarDays size={14} /> Reschedule
                </button>
                <div style={{ position: 'relative', display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-outline-gray" style={{ padding: '6px' }} onClick={(e) => { e.stopPropagation(); handleCancel(appointment._id); }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            {appointment.status === 'checked_in' && (
              <button 
                className="btn-outline-blue"
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appointment._id, 'in_progress'); }}
                style={{ marginLeft: 'auto' }}
              >
                Start Consultation
              </button>
            )}
            {appointment.status === 'in_progress' && (
              <button 
                className="btn-outline-blue"
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appointment._id, 'completed'); }}
                style={{ marginLeft: 'auto' }}
              >
                Complete Visit
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderList = (list, { showStatus = true } = {}) => (
    <div className="appt-table">
      <div
        className="appt-table-header"
        style={{ gridTemplateColumns: showStatus ? '2fr 1.5fr 1.5fr 3.5fr' : '2.5fr 1.8fr 1.6fr' }}
      >
        <span className="appt-table-header-cell">Patient</span>
        <span className="appt-table-header-cell">Doctor</span>
        <span className="appt-table-header-cell">Date &amp; Time</span>
        {showStatus && <span className="appt-table-header-cell">Status</span>}
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f9fafb' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 50, flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 13, width: '45%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 11, width: '30%' }} /></div>
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 6 }} /><div className="skeleton" style={{ height: 10, width: '40%' }} /></div>
              <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 6 }} /><div className="skeleton" style={{ height: 10, width: '35%' }} /></div>
              {showStatus && <div><div className="skeleton" style={{ height: 26, width: 84, borderRadius: 999 }} /></div>}
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="appt-empty">
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Search size={22} style={{ color: '#93c5fd' }} />
          </div>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>No appointments found</h4>
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        list.map((appt, i) => (
          <AppointmentRow 
            key={appt._id || i} 
            appointment={appt} 
            showStatus={showStatus} 
            isActive={selectedAppointment?._id === appt._id} 
          />
        ))
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="appt-pagination">
          <span className="appt-pagination-text">
            Showing {(pagination.page - 1) * (pagination.limit || 10) + 1}–{Math.min(pagination.page * (pagination.limit || 10), pagination.total)} of {pagination.total} appointments
          </span>
          <div className="appt-pagination-controls">
            <button className="page-btn" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={15} /></button>
            {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
              const pg = i + 1;
              return <button key={pg} className={`page-btn ${pagination.page === pg ? 'active' : ''}`} onClick={() => setPagination(p => ({ ...p, page: pg }))}>{pg}</button>;
            })}
            {pagination.totalPages > 5 && <span style={{ color: '#9ca3af', padding: '0 4px' }}>…</span>}
            <button className="page-btn" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="appt-page">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
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

      {/* ── Reschedule Modal ── */}
      {rescheduleAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(15,23,42,0.18)', maxWidth: 460, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={20} style={{ color: '#2563eb' }} /> Reschedule Appointment
              </h3>
              <button onClick={() => setRescheduleAppt(null)} style={{ padding: 6, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Patient</label>
                <p style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: '#0f172a', fontWeight: 600 }}>
                  {rescheduleAppt.patientId?.firstName} {rescheduleAppt.patientId?.lastName}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Doctor Selection</label>
                <select 
                  value={rescheduleDoctor} 
                  onChange={(e) => setRescheduleDoctor(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                >
                  <option value="">Select Doctor</option>
                  {allDoctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>New Date</label>
                  <input
                    type="date" value={rescheduleDate} min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setRescheduleDate(e.target.value);
                      if (rescheduleDoctor) {
                        doctorService.getAvailableSlots(rescheduleDoctor, e.target.value, token)
                          .then(s => { const l = s.data?.slots||s.slots||[]; setAvailableSlots(l.filter(x=>x.isAvailable!==false).map(x=>x.slot||x)); })
                          .catch(() => {});
                      }
                    }}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Reason</label>
                  <input
                    type="text" placeholder="e.g. Patient Request" value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Available Slots</label>
                {availableSlots.length === 0 ? (
                  <p style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#92400e', fontWeight: 600 }}>
                    No slots available on this date.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                    {availableSlots.map(slot => (
                      <button key={slot} onClick={() => setRescheduleTime(slot)}
                        style={{ padding: '6px 4px', borderRadius: 8, fontSize: '0.6875rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', background: rescheduleTime === slot ? '#2563eb' : '#fff', color: rescheduleTime === slot ? '#fff' : '#374151', borderColor: rescheduleTime === slot ? '#2563eb' : '#e5e7eb' }}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Notes (Optional)</label>
                <textarea 
                  rows="2" placeholder="Any additional notes..." value={rescheduleNotes} onChange={e => setRescheduleNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setRescheduleAppt(null)}
                  style={{ flex: 1, padding: '0.75rem', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.875rem', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReschedule}
                  disabled={rescheduleLoading || !rescheduleTime}
                  style={{ flex: 1, padding: '0.75rem', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none', borderRadius: 10, cursor: 'pointer', opacity: rescheduleLoading || !rescheduleTime ? 0.6 : 1 }}
                >
                  {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>Appointments</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Manage and organize all your patient appointments efficiently.</p>
      </div>

      {/* ── Top Controls ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        {/* Search Bar - Fully Rounded */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search patients, doctors, or reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              fontSize: '0.875rem',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', minWidth: 'max-content' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              style={{
                padding: '10px 40px 10px 16px',
                borderRadius: '9999px',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                background: '#fff',
                appearance: 'none',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <option value="all">All Doctors</option>
              {allDoctors.map(d => (
                <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar — Segemented Control full width ── */}
      <div style={{ display: 'block', marginBottom: '1.5rem' }}>
        <div className="appt-tab-bar-container">
          <button className={`appt-tab ${activeTab==='all'?'active':''}`} onClick={()=>handleTabChange('all')}>All Appointments</button>
          <button className={`appt-tab ${activeTab==='todays_bookings'?'active':''}`} onClick={()=>handleTabChange('todays_bookings')}>Today's Bookings</button>
          <button className={`appt-tab ${activeTab==='checked_in'?'active':''}`} onClick={()=>handleTabChange('checked_in')}>Checked In</button>
          <button className={`appt-tab ${activeTab==='in_progress'?'active':''}`} onClick={()=>handleTabChange('in_progress')}>In Consultation</button>
          <button className={`appt-tab ${activeTab==='completed'?'active':''}`} onClick={()=>handleTabChange('completed')}>Completed</button>
          <button className={`appt-tab ${activeTab==='cancelled'?'active':''}`} onClick={()=>handleTabChange('cancelled')}>Cancelled</button>
        </div>
      </div>

      {/* ── Table ── */}
      {renderList(filtered, { showStatus: activeTab !== 'completed' })}

      {/* ── Billing Modal ── */}
      {billingModalOpen && billingAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 80px rgba(15,23,42,0.2)', maxWidth: 600, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Generate Invoice</h2>
              <button onClick={() => setBillingModalOpen(false)} style={{ padding: 6, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Patient</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{billingAppointment.patientId?.firstName} {billingAppointment.patientId?.lastName}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Doctor</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Dr. {billingAppointment.doctorId?.firstName} {billingAppointment.doctorId?.lastName}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Billing Items</h3>
                <button onClick={() => setBillingItems([...billingItems, { type: 'other', name: '', amount: 0 }])}
                  style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={13} /> Add Item
                </button>
              </div>
              {billingItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 28px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <select value={item.type} onChange={e => { const u = [...billingItems]; u[idx].type = e.target.value; setBillingItems(u); }}
                    style={{ padding: '7px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8125rem', outline: 'none' }}>
                    <option value="consultation">Consultation</option>
                    <option value="lab">Lab Test</option>
                    <option value="medicine">Pharmacy</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="text" placeholder="Item description…" value={item.name}
                    onChange={e => { const u = [...billingItems]; u[idx].name = e.target.value; setBillingItems(u); }}
                    style={{ padding: '7px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8125rem', outline: 'none' }} />
                  <input type="number" placeholder="₹" value={item.amount}
                    onChange={e => { const u = [...billingItems]; u[idx].amount = parseFloat(e.target.value) || 0; setBillingItems(u); }}
                    style={{ padding: '7px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8125rem', outline: 'none' }} />
                  {idx > 0
                    ? <button onClick={() => setBillingItems(billingItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}><X size={14} /></button>
                    : <span />
                  }
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid #f3f4f6', paddingTop: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 5 }}>Discount (₹)</label>
                <input type="number" value={billingDiscount} onChange={e => setBillingDiscount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '7px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 5 }}>Tax (₹)</label>
                <input type="number" value={billingTax} onChange={e => setBillingTax(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '7px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Payable</span>
              <span style={{ fontSize: '1.375rem', fontWeight: 900, color: '#111827' }}>
                ₹{(billingItems.reduce((s, i) => s + i.amount, 0) + billingTax - billingDiscount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setBillingModalOpen(false)}
                style={{ padding: '0.625rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleGenerateInvoice} disabled={isGeneratingBill}
                style={{ padding: '0.625rem 1.5rem', border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: isGeneratingBill ? 0.6 : 1 }}>
                {isGeneratingBill ? 'Generating…' : 'Finalize & Save Bill'}
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
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Loading Appointments…</p>
    </div>
  }>
    <AppointmentsDashboardContent />
  </Suspense>
);

export default AppointmentsDashboard;
