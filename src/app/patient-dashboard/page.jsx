'use client';
import { API_BASE_URL } from '@/utils/api';
import { FiCalendar, FiClock, FiAlertCircle, FiUser, FiPhone, FiMail } from 'react-icons/fi'
import { FaHeartbeat, FaClinicMedical } from 'react-icons/fa'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import AppointmentCard from '@/components/AppointmentCard'
import { useEffect, useState } from 'react'

export default function DynamicDashboard() {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [stats, setStats] = useState([
     { title: 'Pending Appointments', value: 0, icon: <FiCalendar className="text-blue-500" />, trend: 'same' },
      { title: 'Total Appointments', value: 0, icon: <FiCalendar className="text-indigo-500" />, trend: 'same' },
      { title: 'Total Prescriptions', value: 0, icon: <FaClinicMedical className="text-green-500" />, trend: 'same' },
  ]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const healthTips = [
    'Remember to take your medication at the same time every day',
    'Stay hydrated - aim for 8 glasses of water daily',
    'Schedule your annual physical exam',
    'Practice deep breathing exercises for stress management',
    'Get at least 30 minutes of exercise daily',
    'Maintain a balanced diet with fruits and vegetables'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const data = JSON.parse(userData);
      setUserId(data.id);
    }
  }, []);

  const fetchPatientData = async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/patient/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.patient) {
        setPatientData(data.patient);
      }
    } catch (err) {
      console.log("Error fetching patient data:", err);
    }
  };

  const fetchPendingAppointments = async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/appointment/patient/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filter ONLY pending appointments
        const pending = data.appointments.filter(appointment => 
          appointment.status === 'pending'
        );
        setPendingAppointments(pending);
        
        // Update stats dynamically
        updateDashboardStats(pending, patientData);
      }
    } catch (err) {
      console.log("Error fetching appointments:", err);
    }
  };

  const updateDashboardStats = (appointments, patient) => {
    const pendingCount = appointments.length;
    const healthStatus = patient?.bloodType ? 'Normal' : 'Incomplete';
    const pendingActions = pendingCount > 0 ? 1 : 0;
    
    setStats([
      { 
        title: 'Pending Appointments', 
        value: pendingCount, 
        icon: <FiCalendar className="text-blue-500" />, 
        trend: pendingCount > 0 ? 'up' : 'same' 
      },
      { 
        title: 'Active Prescriptions', 
        value: patient?.currentMedications ? 1 : 0, 
        icon: <FaClinicMedical className="text-green-500" />, 
        trend: 'same' 
      },
      
      { 
        title: 'Pending Actions', 
        value: pendingActions, 
        icon: <FiAlertCircle className="text-yellow-500" />, 
        trend: pendingActions > 0 ? 'up' : 'same' 
      },
    ]);
    
    setLastUpdated(new Date());
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPatientData(),
        fetchPendingAppointments()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  useEffect(() => {
    if (patientData && pendingAppointments) {
      updateDashboardStats(pendingAppointments, patientData);
    }
  }, [patientData, pendingAppointments]);

  const formatAppointmentForCard = (appointment) => {
    const date = new Date(appointment.date);
    const formattedDate = date.toISOString().split('T')[0];
    
    return {
      id: appointment._id,
      doctor: appointment.doctorId 
        ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
        : 'Doctor TBA',
      specialty: appointment.doctorId?.specialty || 'General',
      date: formattedDate,
      time: appointment.time || 'Time TBA',
      status: appointment.status,
      reason: appointment.reason || 'General consultation'
    };
  };

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };

  const refreshDashboard = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-blue-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center text-sm text-slate-500 font-medium">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Home</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {patientData?.firstName || 'Patient'}!
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Here's your health dashboard overview.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshDashboard}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiClock className="text-white w-4 h-4" />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
              <FiClock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Last updated: {formatLastUpdated()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Pending Appointments */}
        <div className="lg:col-span-2">
          <Card 
            title={`Pending Appointments (${pendingAppointments.length})`}
            action={{ text: 'View All', href: '/dashboard/appointments' }}
          >
            <div className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Appointments</h3>
                  <p className="text-gray-500">You don't have any pending appointments at the moment.</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Schedule New Appointment
                  </button>
                </div>
              ) : (
                pendingAppointments.slice(0, 3).map((appointment) => (
                  <AppointmentCard 
                    key={appointment._id} 
                    {...formatAppointmentForCard(appointment)} 
                  />
                ))
              )}
              
              {pendingAppointments.length > 3 && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    And {pendingAppointments.length - 3} more pending appointments
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Dynamic Health Information & Tips */}
        <div className="space-y-6">
          {/* Patient Quick Info */}
          {patientData && (
            <Card title="Quick Info">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiUser className="text-blue-500" />
                  <span className="text-sm text-gray-700">
                    {patientData.firstName} {patientData.lastName}
                  </span>
                </div>
                {patientData.email && (
                  <div className="flex items-center space-x-3">
                    <FiMail className="text-blue-500" />
                    <span className="text-sm text-gray-700">{patientData.email}</span>
                  </div>
                )}
                {patientData.phone && (
                  <div className="flex items-center space-x-3">
                    <FiPhone className="text-blue-500" />
                    <span className="text-sm text-gray-700">{patientData.phone}</span>
                  </div>
                )}
                {patientData.bloodType && (
                  <div className="flex items-center space-x-3">
                    <FaHeartbeat className="text-red-500" />
                    <span className="text-sm text-gray-700">Blood Type: {patientData.bloodType}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Health Tips */}
          <Card title="Health Tips">
            <ul className="space-y-3">
              {healthTips.slice(0, 4).map((tip, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      
    </div>
  )
}
