'use client';
import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { 
  Download, 
  Printer, 
  Search, 
  Filter, 
  IndianRupee, 
  Calendar, 
  User,
  Clock,
  X,
  FileText,
  Eye,
  Stethoscope,
  CreditCard,
  Activity,
  Loader2
} from 'lucide-react';

export default function DoctorBilling() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const data = JSON.parse(user);
      setUserId(data?.id);
    }
  }, []);

  const fetchAppointmentsByDoc = async (doctorId) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/appointment/fetchbydoctor/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const response = await res.json();
      
      if (response.success) {
        const appointments = response.data.appointments || [];
        // Convert checked-in appointments to billing format
        const checkedInBills = appointments
          .filter(app => app.status === 'checkedIn')
          .map(app => ({
            id: `INV-${app._id.substring(0, 8).toUpperCase()}`,
            patientName: app.patientName,
            patientId: app._id,
            date: new Date(app.appointmentDate).toISOString().split('T')[0],
            dueDate: new Date(new Date(app.appointmentDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: (app.medicines?.reduce((sum, med) => sum + (med.price || 0), 0) || 0) + (app.consultationFee || 0),
            status: 'Pending', // Default status for new bills
            insurance: app.insuranceProvider || 'Self-Pay',
            services: [
              { 
                code: 'CONSULT', 
                description: 'Consultation Fee', 
                quantity: 1, 
                price: app.consultationFee || 0 
              },
              ...(app.medicines?.map(med => ({
                code: med.code || 'MED-' + med.name.substring(0, 3).toUpperCase(),
                description: med.name,
                quantity: med.quantity || 1,
                price: med.price || 0
              })) || [])
            ]
          }));
        
        setBills(checkedInBills);
      } else {
        setError(response.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAppointmentsByDoc(userId);
    }
  }, [userId]);

  const filteredBills = bills.filter(bill => 
    bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handleActualPrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Billing Summary</title>');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;margin:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}.summary-table td,.summary-table th{text-align:right;}.summary-table th{text-align:left;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
    setIsPrintModalOpen(false);
  };

  const openBillModal = (bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' :
           status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
           'bg-red-100 text-red-800';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Billing</h1>
          <p className="text-gray-600 mt-1">Manage patient invoices and revenue</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with Medical Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 border-b border-blue-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Stethoscope className="text-blue-600 mr-3" size={28} />
              <h2 className="text-xl font-bold text-gray-800">Billing Summary</h2>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
              <Download className="mr-2" size={16} /> Export
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
            >
              <Printer className="mr-2" size={16} /> Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <IndianRupee className="text-blue-600" size={20} />
              </div>
            </div>
          </div>


          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Patients</p>
                <p className="text-2xl font-bold text-green-600">{bills.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <User className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patients, bills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm">
            <Filter className="mr-2" size={16} /> Filter
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
            <span>Loading billing data...</span>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && bills.length === 0 && (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
            No checked-in patients found
          </div>
        )}

        {!isLoading && !error && bills.length > 0 && (
          <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bill.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bill.patientId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bill.date}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{bill.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <button 
                        onClick={() => openBillModal(bill)}
                        className="text-blue-600 hover:text-blue-800 mr-3 transition-colors duration-200"
                      >
                        <Eye className="inline mr-1" size={16} /> View
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
                        <Download className="inline" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Medical Bill Details Modal */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white z-10">
              <div className="flex items-center">
                <Activity className="text-blue-600 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">Medical Bill Details</h2>
              </div>
              <button 
                onClick={closeModal} 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <Stethoscope className="mr-2 text-blue-600" size={20} />
                    Medical Practice
                  </h3>
                  <p className="text-gray-600">Dr. Smith Medical Center</p>
                  <p className="text-gray-600">123 Healthcare Avenue</p>
                  <p className="text-gray-600">Medical City, MC 12345</p>
                  <p className="text-gray-600">Phone: (555) 123-4567</p>
                  <p className="text-gray-600">NPI: 1234567890</p>
                </div>
                
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill #{selectedBill.id}</h3>
                  <p className="text-gray-600">Service Date: {selectedBill.date}</p>
                  <p className="text-gray-600">Due Date: {selectedBill.dueDate}</p>
                  <p className="text-gray-600">Status: 
                    <span className={`ml-2 px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedBill.status)}`}>
                      {selectedBill.status}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <User className="mr-2 text-blue-600" size={20} />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Name: {selectedBill.patientName}</p>
                    <p className="text-gray-600">Patient ID: {selectedBill.patientId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <CreditCard className="mr-2" size={16} />
                      Insurance: {selectedBill.insurance}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">CPT Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Service Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBill.services.map((service, index) => (
                      <tr key={index} className="hover:bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{service.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{service.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{(service.quantity * service.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">₹{selectedBill.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Insurance Adjustment</span>
                    <span className="text-gray-800">₹0.00</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-800 font-semibold">Patient Balance</span>
                    <span className="text-gray-800 font-bold">₹{selectedBill.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0">
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <Printer className="mr-2" size={16} /> Print
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <Download className="mr-2" size={16} /> Download
              </button>
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Summary Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center border-b border-blue-200 p-6 sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-100 z-10">
              <div className="flex items-center">
                <FileText className="text-blue-600 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">Billing Summary</h2>
              </div>
              <button 
                onClick={closePrintModal} 
                className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Stethoscope className="mr-2 text-blue-600" size={20} />
                  Practice Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-blue-800">₹{bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Outstanding</p>
                    <p className="text-xl font-bold text-red-600">₹{bills.filter(b => b.status === 'Overdue').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium">Pending Claims</p>
                    <p className="text-xl font-bold text-yellow-600">₹{bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Activity className="mr-2 text-blue-600" size={20} />
                  Billing Details
                </h3>
                <div className="border border-blue-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Bill #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-200">
                      {filteredBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bill.patientName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bill.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{bill.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                              {bill.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-blue-600">Total Billed</span>
                    <span className="text-blue-800">₹{bills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-blue-800 font-semibold">Total Outstanding</span>
                    <span className="text-blue-800 font-bold">₹{bills.filter(b => b.status === 'Overdue').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div ref={printRef} style={{ display: 'none' }}>
              <div className="p-8 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">Dr. Smith Medical Center</h1>
                  <p className="text-gray-600">123 Healthcare Avenue, Medical City, MC 12345</p>
                  <p className="text-gray-600">Phone: (555) 123-4567 | NPI: 1234567890</p>
                </div>
                
                <div className="border-b border-gray-300 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">BILLING SUMMARY</h2>
                  <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                </div>
                
                <table className="w-full border-collapse border border-gray-300 mb-8">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Bill #</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Patient</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((bill) => (
                      <tr key={bill.id}>
                        <td className="border border-gray-300 px-4 py-2">{bill.id}</td>
                        <td className="border border-gray-300 px-4 py-2">{bill.patientName}</td>
                        <td className="border border-gray-300 px-4 py-2">{bill.date}</td>
                        <td className="border border-gray-300 px-4 py-2">₹{bill.amount.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2">{bill.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="text-right mb-8">
                  <div className="inline-block">
                    <div className="flex justify-between py-1 border-b border-gray-300 w-64">
                      <span>Total Billed:</span>
                      <span>₹{bills.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-300 w-64">
                      <span>Total Outstanding:</span>
                      <span>₹{bills.filter(b => b.status === 'Overdue').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-4">
                  <p className="text-sm text-gray-600">Generated by Dr. Smith Medical Center Billing System</p>
                  <p className="text-sm text-gray-600">Contact: (555) 123-4567</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-blue-200 flex justify-end space-x-3 sticky bottom-0">
              <button 
                onClick={handleActualPrint}
                className="flex items-center px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors duration-200 shadow-sm"
              >
                <Printer className="mr-2" size={16} /> Print
              </button>
              <button 
                onClick={closePrintModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
