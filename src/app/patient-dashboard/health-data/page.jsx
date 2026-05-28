import { FaHeartbeat, FaWeight, FaTemperatureHigh } from 'react-icons/fa'
import { FiActivity, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import Card from '@/components/Card'
import LineChart from '@/components/LineChart'

export default function HealthDataPage() {
  const vitalStats = [
    { name: 'Heart Rate', value: '72 bpm', icon: <FaHeartbeat className="text-red-500" />, trend: 'down' },
    { name: 'Blood Pressure', value: '118/76 mmHg', icon: <FaHeartbeat className="text-blue-500" />, trend: 'stable' },
    { name: 'Weight', value: '68.5 kg', icon: <FaWeight className="text-purple-500" />, trend: 'down' },
    { name: 'Temperature', value: '36.8°C', icon: <FaTemperatureHigh className="text-yellow-500" />, trend: 'stable' }
  ]

  const healthData = [
    { date: 'Jun 1', value: 75 },
    { date: 'Jun 2', value: 72 },
    { date: 'Jun 3', value: 74 },
    { date: 'Jun 4', value: 71 },
    { date: 'Jun 5', value: 70 },
    { date: 'Jun 6', value: 68 },
    { date: 'Jun 7', value: 72 }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Health Data</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vitalStats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 rounded-full bg-opacity-10">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stat.trend === 'down' ? (
                <span className="flex items-center text-green-500">
                  <FiTrendingDown className="mr-1" />
                  <span>2.5% decrease</span>
                </span>
              ) : stat.trend === 'up' ? (
                <span className="flex items-center text-red-500">
                  <FiTrendingUp className="mr-1" />
                  <span>1.2% increase</span>
                </span>
              ) : (
                <span className="text-gray-500">No significant change</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Heart Rate Trends">
          <div className="h-64">
            <LineChart data={healthData} color="red" />
          </div>
        </Card>

        <Card title="Activity">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <FiActivity size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Steps Today</p>
                  <p className="text-sm text-gray-500">Goal: 8,000</p>
                </div>
              </div>
              <p className="text-xl font-semibold">5,427</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <FiActivity size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Minutes</p>
                  <p className="text-sm text-gray-500">Goal: 30</p>
                </div>
              </div>
              <p className="text-xl font-semibold">42</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <FiActivity size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sleep Last Night</p>
                  <p className="text-sm text-gray-500">Goal: 8h</p>
                </div>
              </div>
              <p className="text-xl font-semibold">7h 22m</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Connected Devices">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100">
                <FiActivity className="text-blue-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Apple Watch</p>
                <p className="text-xs text-gray-500">Last sync: Today, 8:45 AM</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <FiActivity className="text-green-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Withings Scale</p>
                <p className="text-xs text-gray-500">Last sync: Yesterday, 7:30 AM</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              Manage
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
