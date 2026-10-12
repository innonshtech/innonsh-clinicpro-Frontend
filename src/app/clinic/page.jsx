'use client';
import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import {
  Stethoscope,
  Users,
  Calendar,
  ClipboardList,
  Bell,
  CheckCircle2,
  CalendarX2,
  UserX,
  ArrowRight
} from 'lucide-react'

// Helper to format next upcoming leave as "DD MMM YYYY"
const formatNextLeaveDate = (dateVal) => {
  if (!dateVal) return '';
  const clean = typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day, 12, 0, 0);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDoctorInitials = (firstName, lastName) => {
  const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
  const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
  return f + l || 'DR';
};

export default function ClinicDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalDoctors: 0,
      totalReceptionists: 0,
      appointmentsToday: 0,
      pendingAppointments: 0
    },
    appointments: [],
    doctorAvailability: []
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get user/clinic data from local storage
        const userStr = localStorage.getItem('user')
        if (!userStr) return;
        
        const user = JSON.parse(userStr)
        const clinicId = user.clinicId || user.id || user._id // fallback to user id if clinic user
        
        if (!clinicId || clinicId === 'undefined' || clinicId === 'null') {
          console.warn('No valid clinic ID found in user data')
          setLoading(false)
          return
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await axios.get(`${API_BASE_URL}/api/v1/clinic/dashboard/${clinicId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.data.success) {
          setDashboardData(res.data.data)
        }
      } catch (err) {
        console.error('Error fetching clinic dashboard data:', err)
        setError('Failed to load dashboard metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = [
    {
      name: 'Total Doctors',
      value: loading ? '...' : dashboardData.stats.totalDoctors.toString(),
      icon: Stethoscope,
      iconColor: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Receptionists',
      value: loading ? '...' : dashboardData.stats.totalReceptionists.toString(),
      icon: Users,
      iconColor: 'from-green-500 to-green-600',
    },
    {
      name: 'Appointments Today',
      value: loading ? '...' : dashboardData.stats.appointmentsToday.toString(),
      icon: Calendar,
      iconColor: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Pending Tasks',
      value: loading ? '...' : dashboardData.stats.pendingAppointments.toString(),
      icon: ClipboardList,
      iconColor: 'from-orange-500 to-orange-600',
    }
  ]

  const doctorList = dashboardData.doctorAvailability || [];
  const availableCount = doctorList.filter(d => d.status === 'available').length;
  const onLeaveCount = doctorList.filter(d => d.status === 'on_leave').length;
  const inactiveCount = doctorList.filter(d => d.status === 'inactive').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 mb-2">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Clinic Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h2>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.iconColor}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Doctor Availability Section */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Doctor Availability</h2>
              <p className="text-xs text-slate-500">Real-time daily schedule and leave status</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Compact summary chip */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-slate-700">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {availableCount} Available
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                {onLeaveCount} On Leave
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                {inactiveCount} Inactive
              </span>
            </div>

            <a 
              href="/clinic/doctors" 
              className="hidden md:inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 gap-1 ml-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm py-4">Loading doctor availability...</p>
        ) : doctorList.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No doctors registered yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Add doctors to track their daily availability and leave schedules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {doctorList.map((doc) => {
              const fullName = `Dr. ${doc.firstName} ${doc.lastName}`.trim();
              const hasPhoto = Boolean(
                doc.profileImage && 
                typeof doc.profileImage === 'string' && 
                doc.profileImage.trim().length > 0 &&
                !doc.profileImage.includes('placeholder')
              );
              const nextLeave = doc.upcomingLeaves && doc.upcomingLeaves.length > 0 ? doc.upcomingLeaves[0] : null;

              return (
                <div 
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {hasPhoto ? (
                        <img 
                          src={doc.profileImage} 
                          alt={fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {getDoctorInitials(doc.firstName, doc.lastName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-slate-900 truncate" title={fullName}>
                          {fullName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.specialty || 'General Practitioner'}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {doc.status === 'on_leave' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          On Leave
                        </span>
                      ) : doc.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Leave details note */}
                  <div className="pt-2 border-t border-slate-100/80 text-xs flex items-center gap-1.5 min-w-0">
                    {doc.status === 'on_leave' ? (
                      <span className="text-rose-700 font-medium truncate flex items-center gap-1">
                        <CalendarX2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>On Leave Today</span>
                        {doc.todayLeaveReason && (
                          <span className="text-rose-500 font-normal truncate">({doc.todayLeaveReason})</span>
                        )}
                      </span>
                    ) : doc.status === 'inactive' ? (
                      <span className="text-slate-400 truncate flex items-center gap-1">
                        <UserX className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        Account currently inactive
                      </span>
                    ) : nextLeave ? (
                      <span className="text-amber-700 font-medium truncate flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>Next Leave: {formatNextLeaveDate(nextLeave.date)}</span>
                        {doc.upcomingLeaves.length > 1 && (
                          <span className="text-amber-600/80 font-normal shrink-0">
                            (+{doc.upcomingLeaves.length - 1} more)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 truncate flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        Available for appointments
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments List */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
            <a href="/clinic/appointments" className="text-sm text-blue-600 hover:underline">View All</a>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-sm">Loading appointments...</p>
            ) : dashboardData.appointments.length > 0 ? (
              dashboardData.appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{appt.patientName} (with {appt.doctorName})</p>
                      <p className="text-sm text-gray-500">{appt.time} • {appt.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                    appt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {appt.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No appointments scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/clinic/doctors" className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:scale-[1.02] transition-transform">
              <Stethoscope className="w-5 h-5 mr-3" />
              <span className="font-medium">Manage Doctors</span>
            </a>
            <a href="/clinic/receptionists" className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:scale-[1.02] transition-transform">
              <Users className="w-5 h-5 mr-3" />
              <span className="font-medium">Manage Receptionists</span>
            </a>
            <a href="/clinic/reports" className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:scale-[1.02] transition-transform">
              <ClipboardList className="w-5 h-5 mr-3" />
              <span className="font-medium">View Reports</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
