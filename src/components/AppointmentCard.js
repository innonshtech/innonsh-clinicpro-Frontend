import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi'

export default function AppointmentCard({ doctor, specialty, date, time, status }) {
  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    canceled: 'bg-red-100 text-red-800'
  }

  return (
    <div className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex-shrink-0 p-3 rounded-full bg-blue-50 text-blue-600">
        <FiCalendar size={20} />
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{doctor}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-gray-500">{specialty}</p>
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <FiClock className="mr-1.5" />
            {time}
          </span>
          <span className="flex items-center">
            <FiCalendar className="mr-1.5" />
            {date}
          </span>
        </div>
      </div>
      <button className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-500">
        View
      </button>
    </div>
  )
}
