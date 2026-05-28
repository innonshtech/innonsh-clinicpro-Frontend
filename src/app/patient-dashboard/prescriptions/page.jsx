'use client';
import { API_BASE_URL } from '@/utils/api';
import { FaPills, FaClinicMedical, FaRegCalendarAlt, FaRegClock } from 'react-icons/fa';

import { FiDownload, FiPrinter, FiPlus, FiEye, FiX, FiFilter, FiSearch, FiUser, FiPhone } from 'react-icons/fi';

import { MdHealthAndSafety, MdOutlineMedication } from 'react-icons/md';

import { BiChevronDown } from 'react-icons/bi';

import Card from '@/components/Card';

import Button from '@/components/Button';


import { useEffect, useState } from 'react';



// function StatusBadge({ status }) {

//   const statusStyles = {

//     Active: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm',

//     Completed: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200 shadow-sm',

//     Pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm',

//     Cancelled: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 border border-rose-200 shadow-sm'

//   };



//   return (

//     <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>

//       {status}

//     </span>

//   );

// }



export default function PrescriptionsPage() {
  const [prescriptionData, setData] = useState([

    {

      id: 1,

      medication: 'Atorvastatin',

      dosage: '20mg',

      frequency: 'Once daily',

      prescribedBy: 'Dr. Sarah Johnson',

      date: '2023-05-15',

      refills: 2,

      status: 'Active',

      type: 'Cholesterol',

      lastFilled: '2023-06-10',

      instructions: 'Take with food in the evening',

      pharmacy: 'CVS Pharmacy #1234'

    },

    {

      id: 2,

      medication: 'Lisinopril',

      dosage: '10mg',

      frequency: 'Once daily',

      prescribedBy: 'Dr. Michael Chen',

      date: '2023-04-28',

      refills: 0,

      status: 'Completed',

      type: 'Blood Pressure',

      lastFilled: '2023-05-15',

      instructions: 'Take in the morning with water',

      pharmacy: 'Walgreens #5678'

    },

    {

      id: 3,

      medication: 'Metformin',

      dosage: '500mg',

      frequency: 'Twice daily',

      prescribedBy: 'Dr. Emily Wilson',

      date: '2023-06-01',

      refills: 3,

      status: 'Active',

      type: 'Diabetes',

      lastFilled: '2023-06-05',

      instructions: 'Take with meals twice daily',

      pharmacy: 'Rite Aid #9012'

    }

  ]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userID, setId] = useState();
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const data = JSON.parse(userData);
    setId(data.id)
    console.log(data);

  }, [])




  const fetchPrescriptions = async () => {
    try {

      const res = await fetch(`${API_BASE_URL}/api/v1/appointment/fetch-checkin-by-id/${userID}`);
      const data = await res.json();
      console.log("prescription data", data);
      setData(data.data)


    } catch (err) {

      console.log("Internal Server Error", err)

    }
  }

  useEffect(() => {
    fetchPrescriptions();
  }, [userID])
  const openModal = (prescription) => {

    setSelectedPrescription(prescription);
    console.log("properdata", prescription);

    setIsModalOpen(true);

  };



  const closeModal = () => {

    setIsModalOpen(false);

    setSelectedPrescription(null);

  };



  // Enhanced Empty State component

  function EmptyState({ icon, title, description, action }) {

    return (

      <div className="text-center py-16">

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-500 mb-4">

          {icon}

        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

        <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>

        {action && (

          <div className="mt-6">

            {action}

          </div>

        )}

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Medical Prescription Modal */}

        {isModalOpen && selectedPrescription && (

          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

              {/* Close Button */}

              <button

                onClick={closeModal}

                className="absolute top-6 right-6 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"

              >

                <FiX size={24} className="text-gray-500" />

              </button>



              {/* Prescription Header - Fixed Height */}

              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white min-h-[180px]">

                {/* Curved Background Pattern */}

                <div className="absolute inset-0 overflow-hidden">

                  <svg className="absolute bottom-0 left-0 w-full h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">

                    <path d="M0,0 C300,120 900,120 1200,0 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"></path>

                  </svg>

                  <svg className="absolute bottom-0 left-0 w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">

                    <path d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.05)"></path>
                  </svg>
                </div>



                {/* Header Content - Properly Padded */}

                <div className="relative h-full flex flex-col justify-center px-8 py-6">

                  <div className="flex justify-between items-center">

                    {/* Left Side - Doctor Info */}

                    <div>

                      <h3 className="text-2xl font-bold tracking-tight">

                       Dr. {selectedPrescription.doctorName}

                      </h3>

                      <p className="text-blue-100 mt-1">
                        {selectedPrescription.doctorDetails.hospital}


                      </p>

                      <div className="flex items-center mt-3 text-blue-200">

                        <FiPhone className="mr-2 w-4 h-4" />

                        <span>+91 {selectedPrescription.doctorDetails.phone}</span>

                      </div>

                    </div>



                    {/* Right Side - Date Info */}

                    <div className="text-right">

                      <div className="text-xl font-bold">
                        {selectedPrescription.appointmentDate}


                      </div>

                      <div className="text-blue-100 mt-1">

                        {new Date(selectedPrescription.appointmentDate).toLocaleDateString('en-US', { weekday: 'long' })}

                      </div>

                    </div>

                  </div>

                </div>

              </div>



              {/* Scrollable Content Area */}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Patient Info Card */}

                <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">

                  <div className="flex items-center space-x-4">

                    <div className="bg-blue-600 text-white p-3 rounded-full flex-shrink-0">

                      <FiUser size={20} />

                    </div>

                    <div>

                      <h4 className="font-bold text-gray-900 capitalize">{selectedPrescription.patientName}</h4>

                      {/* <p className="text-sm text-gray-600">Patient ID: {selectedPrescription.patientId}</p> */}

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-gray-500">Contact No.</p>

                    <p className="font-medium text-gray-900">+91 {selectedPrescription.patientNumber}</p>

                  </div>

                </div>



                {/* Medications Table */}

                <div className="border border-gray-200 rounded-xl overflow-hidden">

                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">

                    <h5 className="font-bold text-gray-900 flex items-center">

                      <FaPills className="mr-2 text-blue-600" />

                      Prescribed Medications

                    </h5>

                  </div>



                  <div className="overflow-x-auto">

                    <table className="min-w-full divide-y divide-gray-200">

                      <thead className="bg-gray-100">

                        <tr>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>

                        </tr>

                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">

                        {selectedPrescription.medicines.map((medicine, index) => (

                          <tr key={index} className="hover:bg-blue-50 transition-colors">

                            <td className="px-6 py-4 whitespace-nowrap">

                              <div className="flex items-center">

                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">

                                  <FaPills className="text-blue-600 w-5 h-5" />

                                </div>

                                <div>

                                  <div className="font-medium text-gray-900">{medicine.name}</div>

                                  <div className="text-sm text-gray-500">{medicine.type}</div>

                                </div>

                              </div>

                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">

                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">

                                {medicine.dosage}

                              </span>

                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                              {medicine.frequency}

                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                              {medicine.duration}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                </div>



                {/* Precautions Section */}

                <div className="border border-amber-200 rounded-xl overflow-hidden">

                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">

                    <h5 className="font-bold text-amber-900 flex items-center">

                      <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />

                      </svg>

                      Important Precautions

                    </h5>

                  </div>

                  <div className="max-h-[200px] overflow-y-auto p-6 bg-white">

                    <ul className="space-y-3 text-sm text-amber-800">

                      <li className="flex items-start">

                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>

                        <span className='capitalize'><strong> {selectedPrescription.description}</strong> </span>

                      </li>



                    </ul>

                  </div>

                </div>

              </div>



              {/* Footer Buttons */}

              <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">

                <button

                  onClick={closeModal}

                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"

                >

                  Close

                </button>

                <button className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center">

                  <FiDownload className="mr-2" />

                  Download Prescription

                </button>

              </div>

            </div>

          </div>

        )}

        {/* Header Section */}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">

          <div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">

              My Prescriptions

            </h1>

            <p className="text-gray-600 mt-2 text-lg">View and manage your current medications</p>

          </div>



          {/* Search and Filters */}

          <div className="flex flex-col sm:flex-row gap-3">

            <div className="relative">

              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />

              <input

                type="text"

                placeholder="Search medications..."

                className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"

              />

            </div>

            <button className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center space-x-2 bg-white shadow-sm">

              <FiFilter size={18} />

              <span>Filter</span>

              <BiChevronDown size={16} />

            </button>

          </div>

        </div>



        {/* Enhanced Prescriptions Table */}

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">

          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">

            <div className="flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold text-gray-900">Current Medications</h2>

                <p className="text-gray-600 text-sm mt-1">{prescriptionData.length} active prescriptions</p>

              </div>



            </div>

          </div>



          <div className="overflow-hidden">

            <table className="min-w-full">

              <thead className="bg-gradient-to-r from-gray-50 to-slate-50">

                <tr>

                  <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">

                    Doctor

                  </th>

                  <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">

                    Date Prescribed

                  </th>

                  <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">

                    Condition

                  </th>

                  <th scope="col" className="px-8 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody className="bg-white divide-y divide-gray-100">

                {prescriptionData.map((rx, index) => (

                  <tr

                    key={index}

                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group"

                  >

                    <td className="px-8 py-6">

                      <div className="flex items-center space-x-3">

                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">

                          <FaClinicMedical className="text-blue-600" size={16} />

                        </div>

                        <div>

                          <div className="text-sm font-bold text-gray-900">{rx.doctorName}</div>

                          <div className="text-xs text-gray-500">{rx.doctorDetails?.hospital}</div>

                        </div>

                      </div>

                    </td>

                    <td className="px-8 py-6">

                      <div className="flex items-center space-x-2">

                        <FaRegCalendarAlt className="text-gray-400" size={14} />

                        <span className="text-sm font-semibold text-gray-900">{rx.appointmentDate}</span>

                      </div>

                    </td>

                    <td className="px-8 py-6">

                      <div className="flex items-center space-x-2">

                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>

                        <span className="text-sm font-semibold text-gray-900">{rx.patientNote}</span>

                      </div>

                    </td>

                    <td className="px-8 py-6 text-right">

                      <div className="flex items-center justify-end space-x-2">

                        <button

                          onClick={() => openModal(rx)}

                          className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-200 group-hover:shadow-sm"

                          title="View Details"

                        >

                          <FiEye size={18} />

                        </button>

                        <button

                          className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 group-hover:shadow-sm"

                          title="Download"

                        >

                          <FiDownload size={18} />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>



          {prescriptionData.length === 0 && (

            <EmptyState

              icon={<MdOutlineMedication size={48} />}

              title="No Prescriptions Found"

              description="You don't have any active prescriptions at this time. Contact your healthcare provider to get started."

              action={

                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">

                  <FaClinicMedical className="mr-2" />

                  Request New Prescription

                </Button>

              }

            />

          )}

        </Card>



        {/* Enhanced Information Cards */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">

            <div className="p-6">

              <div className="flex items-start space-x-4">

                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">

                  <MdHealthAndSafety size={24} />

                </div>

                <div className="flex-1">

                  <h3 className="text-lg font-bold text-blue-900 mb-2">Prescription Refill Policy</h3>

                  <p className="text-blue-700 leading-relaxed">

                    Please allow 2-3 business days for prescription refill requests to be processed.

                    Controlled substances may require an office visit before refill approval.

                  </p>

                </div>

              </div>

            </div>

          </Card>



          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">

            <div className="p-6">

              <div className="flex items-start space-x-4">

                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">

                  <FaPills size={22} />

                </div>

                <div className="flex-1">

                  <h3 className="text-lg font-bold text-emerald-900 mb-3">Medication Safety Tips</h3>

                  <ul className="text-emerald-700 space-y-2">

                    <li className="flex items-center space-x-2">

                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>

                      <span>Take medications at the same time each day</span>

                    </li>

                    <li className="flex items-center space-x-2">

                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>

                      <span>Store in a cool, dry place away from sunlight</span>

                    </li>

                    <li className="flex items-center space-x-2">

                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>

                      <span>Never share prescriptions with others</span>

                    </li>

                  </ul>

                </div>

              </div>

            </div>

          </Card>

        </div>

      </div>

    </div>

  );

}
