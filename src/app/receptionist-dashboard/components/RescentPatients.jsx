// components/dashboard/RecentPatients.jsx
import Link from 'next/link';
import { Eye, Edit, Trash2, Phone } from 'lucide-react';

const recentPatients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    age: 28,
    gender: 'Female',
    phone: '+1 (555) 123-4567',
    lastVisit: '2024-01-15',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Michael Chen',
    age: 45,
    gender: 'Male',
    phone: '+1 (555) 987-6543',
    lastVisit: '2024-01-14',
    status: 'Follow-up'
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    age: 32,
    gender: 'Female',
    phone: '+1 (555) 456-7890',
    lastVisit: '2024-01-13',
    status: 'Active'
  },
  {
    id: 4,
    name: 'David Wilson',
    age: 58,
    gender: 'Male',
    phone: '+1 (555) 321-0987',
    lastVisit: '2024-01-12',
    status: 'Completed'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    age: 41,
    gender: 'Female',
    phone: '+1 (555) 654-3210',
    lastVisit: '2024-01-11',
    status: 'Active'
  }
];

export default function RecentPatients() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Patients</h3>
          <Link 
            href="/dashboard/patients"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {patient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.age} years, {patient.gender}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {patient.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(patient.lastVisit).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-700 p-1 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
