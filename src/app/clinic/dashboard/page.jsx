'use client';
import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import {
  Stethoscope,
  Users,
  Calendar,
  ClipboardList,
  Bell
} from 'lucide-react'

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
    appointments: []
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
        
        if (!clinicId) {
          console.warn('No clinic ID found in user data')
          setLoading(false)
          return
        }

        const res = await axios.get(`${API_BASE_URL}/api/v1/clinic/dashboard/${clinicId}`)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinic Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of clinic performance</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl p-6"
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

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments List */}
        <div className="bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl p-6">
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
        <div className="bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm rounded-2xl p-6">
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
