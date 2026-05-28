import { FiFileText, FiDownload, FiSearch, FiUpload, FiExternalLink } from 'react-icons/fi';
import { 
  MdOutlineMedicalServices, 
  MdMedicalServices, // Replaces MdOutlineRadiology
  MdVaccines, 
  MdSummarize 
} from 'react-icons/md';

function Badge({ status }) {
  const statusStyles = {
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Archived: 'bg-gray-100 text-gray-800',
    Rejected: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}

function Button({ children, icon, className = '', size = 'md', ...props }) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`inline-flex items-center justify-center ${sizeClasses[size]} font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

export default function MedicalRecordsPage() {
  const records = [
    {
      id: 1,
      type: 'Lab Results',
      name: 'Complete Blood Count (CBC)',
      date: '2023-06-10',
      doctor: 'Dr. Sarah Johnson',
      fileType: 'PDF',
      size: '2.4 MB',
      status: 'Completed'
    },
    {
      id: 2,
      type: 'Imaging',
      name: 'Chest X-Ray',
      date: '2023-05-22',
      doctor: 'Dr. Michael Chen',
      fileType: 'DICOM',
      size: '15.7 MB',
      status: 'Completed'
    },
    {
      id: 3,
      type: 'Visit Summary',
      name: 'Annual Physical Exam',
      date: '2023-04-15',
      doctor: 'Dr. Emily Wilson',
      fileType: 'PDF',
      size: '1.2 MB',
      status: 'Completed'
    },
    {
      id: 4,
      type: 'Immunization',
      name: 'Flu Vaccine Record',
      date: '2022-10-05',
      doctor: 'Dr. Robert Garcia',
      fileType: 'PDF',
      size: '0.8 MB',
      status: 'Archived'
    }
  ];

  const getRecordIcon = (type) => {
    switch(type) {
      case 'Lab Results': return <MdOutlineMedicalServices className="text-blue-600" size={20} />;
      case 'Imaging': return <MdMedicalServices className="text-purple-600" size={20} />;
      case 'Immunization': return <MdVaccines className="text-green-600" size={20} />;
      case 'Visit Summary': return <MdSummarize className="text-amber-600" size={20} />;
      default: return <FiFileText className="text-gray-600" size={20} />;
    }
  };

  // Count records by type
  const recordCounts = records.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-500 mt-1">Access and manage your health documents</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 text-sm border-gray-300 rounded-md h-10"
                placeholder="Search records..."
              />
            </div>
            <Button icon={<FiUpload size={16} />} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              Upload Records
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-center p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiFileText size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <h3 className="text-2xl font-bold text-gray-800">{records.length}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-center p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <MdOutlineMedicalServices size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lab Results</p>
                <h3 className="text-2xl font-bold text-gray-800">{recordCounts['Lab Results'] || 0}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-center p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <MdMedicalServices size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Imaging</p>
                <h3 className="text-2xl font-bold text-gray-800">{recordCounts['Imaging'] || 0}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-center p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <MdVaccines size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Immunizations</p>
                <h3 className="text-2xl font-bold text-gray-800">{recordCounts['Immunization'] || 0}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">All Medical Records</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
                <FiDownload className="mr-2" size={14} /> Export All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Record Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Date & Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    File Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {getRecordIcon(record.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{record.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{record.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{record.doctor}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 mt-1">{record.doctor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{record.fileType}</div>
                      <div className="text-xs text-gray-500">{record.size}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={record.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Download"
                      >
                        <FiDownload size={18} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="View"
                      >
                        <FiExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-start p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiFileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Request Medical Records</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Need records sent to another provider? Submit a records release form.
                </p>
                <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                  Request Records
                </Button>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
            <div className="flex items-start p-5">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <FiUpload size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Upload Guidelines</h3>
                <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Accepted formats: PDF, JPG, PNG, DICOM</li>
                  <li>Maximum file size: 25MB</li>
                  <li>For multiple files, please zip them</li>
                </ul>
                <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                  View Full Guidelines
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
