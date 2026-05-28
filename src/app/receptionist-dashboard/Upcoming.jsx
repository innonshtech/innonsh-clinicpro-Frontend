'use client';
// app/components/Dashboard/UpcomingAppointments.jsx
import { useState, useEffect } from 'react'
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline'

const mockAppointments = [
  {
    id: 1,
    patientName: 'Alice Cooper',
    time: '9:00 AM',
    doctor: 'Dr. Smith',
    type: 'Check-up',
    urgent: false
  },
  {
    id: 2,
    patientName: 'Bob Wilson',
    time: '10:30 AM',
    doctor: 'Dr. Johnson',
    type: 'Follow-up',
    urgent: true
  },
  {
    id: 3,
    patientName: 'Carol Davis',
    time: '11:15 AM',
    doctor: 'Dr. Brown',
    type: 'Consultation',
    urgent: false
  },
  {
    id: 4,
    patientName: 'David Miller',
    time: '2:00 PM',
    doctor: 'Dr. Wilson',
    type: 'Surgery Prep',
    urgent: true
  },
  {
    id: 5,
    patientName: 'Eva Thompson',
    time: '3:30 PM',
    doctor: 'Dr. Davis',
    type: 'Check-up',
    urgent: false
  }
]

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAppointments(mockAppointments)
      setLoading(false)
    }, 800)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Today's Appointments</h2>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Today's Appointments</h2>
          <span className="text-sm text-gray-500">{appointments.length} scheduled</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`p-4 rounded-lg border-l-4 hover:bg-gray-50 transition-colors ${
              appointment.urgent ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">
                    {appointment.patientName}
                  </h3>
                  {appointment.urgent && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{appointment.time}</span>
                </div>
                <p className="text-xs text-gray-600">{appointment.doctor}</p>
                <p className="text-xs text-gray-500">{appointment.type}</p>
              </div>
              <div className="flex flex-col space-y-1">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View
                </button>
                <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Call
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Appointments
        </button>
      </div>
    </div>
  )
}
