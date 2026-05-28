'use client';
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/utils/api'
import axios from 'axios'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar,
  Activity,
  IndianRupee,
  Clock,
  UserPlus,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Heart,
  Stethoscope,
  Building2
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0
  })
  
  const [chartData, setChartData] = useState({
    patientFlow: [],
    departmentStats: []
  })
  
  const [recentActivities, setRecentActivities] = useState([])
  const [topDoctors, setTopDoctors] = useState([])

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true)
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/analytics`)
      if (res.data.success) {
        const { stats, patientFlow, departmentStats, topDoctors, recentActivities } = res.data.data
        setStatsData(stats)
        setChartData({ patientFlow, departmentStats })
        setTopDoctors(topDoctors)
        setRecentActivities(recentActivities)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleRefresh = async () => {
    await fetchAnalytics()
  }

  const statsCards = [
    {
      title: 'Total Patients',
      value: statsData.totalPatients.toLocaleString(),
      change: '+0%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Doctors',
      value: statsData.totalDoctors.toLocaleString(),
      change: '+0%',
      trend: 'up',
      icon: Stethoscope,
      color: 'bg-green-500'
    },
    {
      title: 'Appointments',
      value: statsData.totalAppointments.toLocaleString(),
      change: '+0%',
      trend: 'up',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenue',
      value: `₹${statsData.totalRevenue.toLocaleString()}`,
      change: '+0%',
      trend: 'up',
      icon: IndianRupee,
      color: 'bg-orange-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your hospital's performance and key metrics</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Flow Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Flow</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {chartData.patientFlow.length > 0 ? chartData.patientFlow.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min((item.patients / Math.max(...chartData.patientFlow.map(d => d.patients), 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.patients}</span>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No patient data available yet.</p>}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {chartData.departmentStats.length > 0 ? chartData.departmentStats.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{dept.value}%</span>
              </div>
            )) : <p className="text-gray-500 text-sm">No department data available yet.</p>}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No recent activities available yet.</p>}
          </div>
        </div>

        {/* Top Performing Doctors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Doctors</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topDoctors.length > 0 ? topDoctors.map((doctor, index) => (
              <div key={doctor.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                    <p className="text-xs text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{doctor.appointments} Appts</p>
                  <div className="flex items-center justify-end text-xs text-gray-500">
                    <Heart className="h-3 w-3 text-red-500 mr-1" />
                    {doctor.rating}
                  </div>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No doctors data available yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
