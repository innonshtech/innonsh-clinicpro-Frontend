'use client';
// // import React, { useState, useEffect } from 'react';
// import {
//   Clock,
//   Search,
//   Plus,
//   ChevronDown,
//   Check,
//   X,
//   MoreVertical,
//   User,
//   Phone,
//   Stethoscope,
//   Pill,
//   FileText,
//   CheckCircle
// } from 'lucide-react';

// const DoctorAppointmentsDashboard = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeTab, setActiveTab] = useState('all');
//   const [expandedAppointment, setExpandedAppointment] = useState(null);
//   const [showStatusDropdown, setShowStatusDropdown] = useState(null);
//   const [showPrescriptionForm, setShowPrescriptionForm] = useState(null);
//   const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
//   const [userId, setId] = useState("");
//   const [prescription, setPrescription] = useState({
//     medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
//     additionalNotes: ''
//   });

//   useEffect(() => {
//     const user = localStorage.getItem('user');
//     if (user) {
//       const data = JSON.parse(user);
//       setId(data?.id);
//     }
//   }, []);

//   const fetchAppointmentsByDoc = async (doctorId) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/appointment/fetchbydoctor/${doctorId}`);
//       if (!res.ok) {
//         throw new Error('Failed to fetch appointments');
//       }
//       const response = await res.json();
//       console.log("sdf",response);
//       setAppointments(response.data || []);
//     } catch (error) {
//       console.error("Error fetching appointments:", error);
//     }
//   };

//   useEffect(() => {
//     if (userId) {
//       fetchAppointmentsByDoc(userId);
//     }
//   }, [userId]);

//   // Status styling
//   const statusStyles = {
//     confirmed: {
//       bg: 'bg-emerald-500/10',
//       text: 'text-emerald-600',
//       icon: <Check className="w-4 h-4 text-emerald-500" />,
//       border: 'border-emerald-500/20'
//     },
//     checkedIn: {
//       bg: 'bg-blue-500/10',
//       text: 'text-blue-600',
//       icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
//       border: 'border-blue-500/20'
//     },
//     cancelled: {
//       bg: 'bg-rose-500/10',
//       text: 'text-rose-600',
//       icon: <X className="w-4 h-4 text-rose-500" />,
//       border: 'border-rose-500/20'
//     }
//   };

//   // Status options for dropdown
//   const statusOptions = [
//     { value: 'confirmed', label: 'Confirmed', color: 'text-emerald-600' },
//     { value: 'checkedIn', label: 'Checked In', color: 'text-blue-600' },
//     { value: 'cancelled', label: 'Cancelled', color: 'text-rose-600' }
//   ];

//   // Filter appointments based on active tab and search term
//   const filteredAppointments = appointments.filter(appointment => {
//     const matchesSearch = appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          appointment.patientNote?.toLowerCase().includes(searchTerm.toLowerCase());

//     let matchesTab = true;


//      if (activeTab === 'all') {
//     matchesTab = appointment.status === 'confirmed';  // Only show confirmed appointments in "All" tab
//   } else if (activeTab === 'checkedIn') {
//     matchesTab = appointment.status === 'checkedIn';
//   } else if (activeTab === 'cancelled') {
//     matchesTab = appointment.status === 'cancelled';
//   }
//     return matchesSearch && matchesTab;
//   });

//   // Update appointment status
//   const updateAppointmentStatus = async (appointmentId, newStatus) => {
//     setIsUpdatingStatus(true);
//     try {
//       // For checkedIn status, just expand and show form (don't update status yet)
//       if (newStatus === 'checkedIn') {
//         setExpandedAppointment(appointmentId);
//         setShowPrescriptionForm(appointmentId);
//         setIsUpdatingStatus(false);
//         setShowStatusDropdown(null);
//         return;
//       }

//       // For other status changes, update immediately
//       await new Promise(resolve => setTimeout(resolve, 500));

//       setAppointments(prevAppointments => 
//         prevAppointments.map(appointment => 
//           appointment.id === appointmentId 
//             ? { ...appointment, status: newStatus }
//             : appointment
//         )
//       );
//     } catch (error) {
//       console.error("Error updating appointment status:", error);
//     } finally {
//       setIsUpdatingStatus(false);
//       setShowStatusDropdown(null);
//     }
//   };

//   // Handle prescription input changes
//   const handlePrescriptionChange = (e, index) => {
//     const { name, value } = e.target;
//     const updatedMedicines = [...prescription.medicines];
//     updatedMedicines[index] = {
//       ...updatedMedicines[index],
//       [name]: value
//     };
//     setPrescription(prev => ({
//       ...prev,
//       medicines: updatedMedicines
//     }));
//   };

//   // Add new medicine field
//   const addMedicineField = () => {
//     setPrescription(prev => ({
//       ...prev,
//       medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
//     }));
//   };

//   // Remove medicine field
//   const removeMedicineField = (index) => {
//     const updatedMedicines = [...prescription.medicines];
//     updatedMedicines.splice(index, 1);
//     setPrescription(prev => ({
//       ...prev,
//       medicines: updatedMedicines
//     }));
//   };

//   // Validate prescription form
//   const validatePrescription = () => {
//     return prescription.medicines.every(med => 
//       med.name && med.dosage && med.frequency && med.duration
//     ) && prescription.additionalNotes;
//   };

// const submitPrescription = async (appointmentId) => {
//   if (!validatePrescription()) {
//     alert('Please fill all medicine details and additional notes');
//     return;
//   }

//   try {
//     // First update the prescription data
//     const prescriptionResponse = await fetch(`${API_BASE_URL}/api/appointment/addMedicines`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         appointmentId,
//         description: prescription.additionalNotes,
//         medicines: prescription.medicines
//       }),
//     });

//     if (!prescriptionResponse.ok) {
//       throw new Error('Failed to update prescription');
//     }

//     // Then update the status to 'checkedIn'
//     const statusResponse = await fetch(`${API_BASE_URL}/api/appointment/updateStatus`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         appointmentId,
//         status: 'checkedIn'
//       }),
//     });

//     if (!statusResponse.ok) {
//       throw new Error('Failed to update status');
//     }

//     const statusData = await statusResponse.json();

//     // Update local state
//     setAppointments(prevAppointments => 
//       prevAppointments.map(appointment => 
//         appointment._id === appointmentId 
//           ? { 
//               ...appointment, 
//               status: 'checkedIn',
//               medicines: prescription.medicines,
//               description: prescription.additionalNotes
//             }
//           : appointment
//       )
//     );

//     // Reset form
//     setPrescription({
//       medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
//       additionalNotes: ''
//     });
//     setShowPrescriptionForm(null);
//       setExpandedAppointment(null); 

//   } catch (error) {
//     console.error("Error submitting prescription:", error);
//     // Optionally show error to user
//   }
// };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm p-6 mb-6 border border-white/80">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div className="flex items-center gap-3">
//               <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
//                 <Stethoscope className="text-white w-6 h-6" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">Doctor's Dashboard</h1>
//                 <p className="text-sm text-gray-500/90">Manage patient appointments and prescriptions</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search and Filters */}
//         <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm p-5 mb-6 border border-white/80">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <div className="relative flex-grow">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Search className="text-blue-500/80 w-5 h-5" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search patients or notes..."
//                 className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all bg-white/50"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm overflow-hidden border border-white/80 mb-6">
//           <div className="flex border-b border-gray-200/50">
//             <button
//               onClick={() => setActiveTab('all')}
//               className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
//             >
//               All Appointments
//             </button>
//             <button
//               onClick={() => setActiveTab('checkedIn')}
//               className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'checkedIn' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
//             >
//               Checked In
//             </button>
//             <button
//               onClick={() => setActiveTab('cancelled')}
//               className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'cancelled' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
//             >
//               Cancelled
//             </button>
//           </div>
//         </div>

//         {/* Appointments List */}
//         <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm overflow-hidden border border-white/80">
//           <div className="p-5 border-b border-gray-200/50">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 {activeTab === 'all' && 'All Appointments'}
//                 {activeTab === 'checkedIn' && 'Checked In Appointments'}
//                 {activeTab === 'cancelled' && 'Cancelled Appointments'}
//               </h3>
//               <div className="text-xs text-blue-600 font-medium bg-blue-100/30 px-3 py-1.5 rounded-full border border-blue-200/50">
//                 {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
//               </div>
//             </div>
//           </div>

//           <div className="divide-y divide-gray-200/30">
//             {filteredAppointments.length > 0 ? (
//               filteredAppointments.map((appointment) => (
//                 <div 
//                   key={appointment._id} 
//                   className={`relative transition-all duration-200 ${
//                     expandedAppointment === appointment.id || showStatusDropdown === appointment.id 
//                       ? 'bg-blue-50/20 min-h-[200px]' 
//                       : 'hover:bg-blue-50/10 min-h-[100px]'
//                   }`}
//                   onClick={(e) => {
//                     // Don't toggle if clicking on status dropdown or prescription form
//                     if (!e.target.closest('.status-dropdown') && !e.target.closest('.prescription-form')) {
//                       setExpandedAppointment(expandedAppointment === appointment.id ? null : appointment.id);
//                     }
//                   }}
//                 >
//                   {/* Appointment Row */}
//                   <div className="grid grid-cols-12 gap-4 items-center p-4 md:p-5">
//                     {/* Patient Column */}
//                     <div className="col-span-12 md:col-span-3 flex items-center gap-4">
//                       <div className="flex items-center">
//                         <div>
//                           <p className="text-sm font-bold text-gray-900 capitalize">
//                             {appointment.patient_name || "Unknown Patient"}
//                           </p>
//                           <div className="flex items-center gap-2 mt-0.5">
//                             <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase">
//                               #{appointment.patientId?.patientId || appointment.patient_id?.slice(-6) || 'N/A'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-medium text-gray-800 truncate">{appointment.patientName}</p>
//                         <p className="text-xs text-gray-500/90 flex items-center gap-1.5 mt-1">
//                           <Phone className="w-3 h-3 flex-shrink-0 text-blue-500/70" />
//                           <span className="truncate">{appointment.patientNumber}</span>
//                         </p>
//                       </div>
//                     </div>

//                     {/* Time Column */}
//                     <div className="col-span-6 md:col-span-2">
//                       <div className="flex items-center gap-2">
//                         <Clock className="text-blue-500/80 w-4 h-4 flex-shrink-0" />
//                         <span className="text-sm text-gray-700">
//                           {appointment.time}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Reason Column */}
//                     <div className="hidden md:block col-span-4">
//                       <p className="text-sm text-gray-600/90 truncate">
//                         {appointment.patientNote}
//                       </p>
//                     </div>

//                     {/* Status Column */}
//                     <div className="col-span-6 md:col-span-2 relative">
//                       <div className="status-dropdown">
//                         {activeTab === 'all' && (
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setShowStatusDropdown(showStatusDropdown === appointment.id ? null : appointment.id);
//                             }}
//                             disabled={isUpdatingStatus}
//                             className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all hover:shadow-sm disabled:opacity-50 ${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-600'} border ${statusStyles[appointment.status]?.border || 'border-gray-300'}`}
//                           >
//                             {statusStyles[appointment.status]?.icon || <Clock className="w-4 h-4" />}
//                             {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
//                             <ChevronDown size={12} />
//                           </button>
//                         )}

//                         {activeTab !== 'all' && (
//                           <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-600'} border ${statusStyles[appointment.status]?.border || 'border-gray-300'}`}>
//                             {statusStyles[appointment.status]?.icon || <Clock className="w-4 h-4" />}
//                             {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
//                           </div>
//                         )}

//                         {/* Status Dropdown Menu */}
//                         {showStatusDropdown === appointment.id && activeTab === 'all' && (
//                           <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200/70 z-30 overflow-hidden">
//                             {statusOptions.map((status) => (
//                               <button
//                                 key={status.value}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   updateAppointmentStatus(appointment.id, status.value);
//                                 }}
//                                 disabled={isUpdatingStatus || appointment.status === status.value}
//                                 className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${status.color}`}
//                               >
//                                 {statusStyles[status.value]?.icon}
//                                 {status.label}
//                                 {appointment.status === status.value && (
//                                   <Check className="w-3 h-3 ml-auto" />
//                                 )}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Actions Column */}
//                     <div className="col-span-6 md:col-span-1 flex justify-end">
//                       <button 
//                         className="p-1.5 text-gray-400/90 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100/50"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setExpandedAppointment(expandedAppointment === appointment.id ? null : appointment.id);
//                         }}
//                       >
//                         <MoreVertical size={18} />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Expanded Details */}
//                   {(expandedAppointment === appointment.id || appointment.status === 'checkedIn') && (
//                     <div className="px-6 pb-4 border-t border-gray-200/30 bg-blue-50/10 prescription-form">
//                       <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <h5 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h5>
//                           <div className="space-y-1 text-sm text-gray-600">
//                             <p><span className="font-medium">Email:</span> {appointment.patientEmail}</p>
//                             <p><span className="font-medium">Phone:</span> {appointment.patientNumber}</p>
//                           </div>
//                         </div>
//                         <div>
//                           <h5 className="text-sm font-medium text-gray-700 mb-2">Appointment Details</h5>
//                           <div className="space-y-1 text-sm text-gray-600">
//                             <p><span className="font-medium">Date:</span> {appointment.appointmentDate}</p>
//                             <p><span className="font-medium">Time:</span> {appointment.time}</p>
//                             <p><span className="font-medium">Notes:</span> {appointment.patientNote}</p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Prescription Form (shown when status is checkedIn or being changed to checkedIn) */}
//                       {(showPrescriptionForm === appointment.id || appointment.status === 'checkedIn') && (
//                         <div className="mt-6 bg-white/80 p-4 rounded-lg border border-gray-200/50">
//                           <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
//                             <Pill className="text-blue-500 w-4 h-4" />
//                             Prescription
//                           </h5>

//                           {prescription.medicines.map((medicine, index) => (
//                             <div key={index} className="grid grid-cols-12 gap-3 mb-3">
//                               <div className="col-span-5">
//                                 <label className="block text-xs text-gray-500 mb-1">Medicine Name</label>
//                                 <input
//                                   type="text"
//                                   name="name"
//                                   value={medicine.name}
//                                   onChange={(e) => handlePrescriptionChange(e, index)}
//                                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
//                                   placeholder="e.g., Paracetamol"
//                                   required
//                                 />
//                               </div>
//                               <div className="col-span-2">
//                                 <label className="block text-xs text-gray-500 mb-1">Dosage</label>
//                                 <input
//                                   type="text"
//                                   name="dosage"
//                                   value={medicine.dosage}
//                                   onChange={(e) => handlePrescriptionChange(e, index)}
//                                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
//                                   placeholder="e.g., 500mg"
//                                   required
//                                 />
//                               </div>
//                               <div className="col-span-2">
//                                 <label className="block text-xs text-gray-500 mb-1">Frequency</label>
//                                 <input
//                                   type="text"
//                                   name="frequency"
//                                   value={medicine.frequency}
//                                   onChange={(e) => handlePrescriptionChange(e, index)}
//                                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
//                                   placeholder="e.g., 2x daily"
//                                   required
//                                 />
//                               </div>
//                               <div className="col-span-2">
//                                 <label className="block text-xs text-gray-500 mb-1">Duration</label>
//                                 <input
//                                   type="text"
//                                   name="duration"
//                                   value={medicine.duration}
//                                   onChange={(e) => handlePrescriptionChange(e, index)}
//                                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
//                                   placeholder="e.g., 7 days"
//                                   required
//                                 />
//                               </div>
//                               <div className="col-span-1 flex items-end">
//                                 {index > 0 && (
//                                   <button
//                                     type="button"
//                                     onClick={() => removeMedicineField(index)}
//                                     className="p-2 text-rose-500 hover:text-rose-700"
//                                   >
//                                     <X size={16} />
//                                   </button>
//                                 )}
//                               </div>
//                             </div>
//                           ))}

//                           <button
//                             type="button"
//                             onClick={addMedicineField}
//                             className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
//                           >
//                             <Plus size={14} />
//                             Add another medicine
//                           </button>

//                           <div className="mb-4">
//                             <label className="block text-xs text-gray-500 mb-1">Additional Notes</label>
//                             <textarea
//                               name="additionalNotes"
//                               value={prescription.additionalNotes}
//                               onChange={(e) => setPrescription(prev => ({ ...prev, additionalNotes: e.target.value }))}
//                               rows={2}
//                               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
//                               placeholder="Any additional instructions..."
//                               required
//                             />
//                           </div>

//                           <div className="flex justify-end gap-3">
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 setShowPrescriptionForm(null);
//                                 setPrescription({
//                                   medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
//                                   additionalNotes: ''
//                                 });
//                               }}
//                               className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                               Cancel
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => submitPrescription(appointment._id)}
//                               className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
//                             >
//                               <FileText size={16} />
//                               Submit Prescription
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))
//             ) : (
//               <div className="p-8 text-center">
//                 <div className="mx-auto w-16 h-16 rounded-xl bg-blue-100/30 border border-blue-200/30 flex items-center justify-center mb-4 shadow-inner">
//                   <Search className="text-blue-500/80 w-6 h-6" />
//                 </div>
//                 <h4 className="text-lg font-medium text-gray-700 mb-1">No appointments found</h4>
//                 <p className="text-sm text-gray-500/90">
//                   {activeTab === 'all' && 'Try adjusting your search criteria'}
//                   {activeTab === 'checkedIn' && 'No checked-in appointments found'}
//                   {activeTab === 'cancelled' && 'No cancelled appointments found'}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DoctorAppointmentsDashboard;

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import {
  Clock,
  Search,
  Plus,
  ChevronDown,
  Check,
  X,
  MoreVertical,
  User,
  Phone,
  Stethoscope,
  Pill,
  FileText,
  CheckCircle,
  Activity
} from 'lucide-react';

const DoctorAppointmentsDashboard = () => {
  const router = useRouter(); // Next.js router
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [userId, setId] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const data = JSON.parse(user);
      setId(data?.id);
    }
  }, []);

  const fetchDailyAppointments = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const responseData = await res.json();

      if (responseData.success) {
        setAppointments(responseData.data || []);
      } else {
        console.error('Failed to fetch appointments:', responseData.message);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    if (userId) fetchDailyAppointments();
  }, [userId]);

  const statusStyles = {
    pending: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-600',
      icon: <Clock className="w-4 h-4 text-yellow-500" />,
      border: 'border-yellow-500/20'
    },
    scheduled: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      icon: <Check className="w-4 h-4 text-emerald-500" />,
      border: 'border-emerald-500/20'
    },
    checked_in: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
      border: 'border-blue-500/20'
    },
    completed: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
      icon: <Check className="w-4 h-4 text-purple-500" />,
      border: 'border-purple-500/20'
    },
    booked: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      icon: <Check className="w-4 h-4 text-emerald-500" />,
      border: 'border-emerald-500/20'
    },
    in_progress: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      icon: <Activity className="w-4 h-4 text-blue-500" />,
      border: 'border-blue-500/20'
    },
    cancelled: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600',
      icon: <X className="w-4 h-4 text-rose-500" />,
      border: 'border-rose-500/20'
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'all') { matchesTab = ["booked", "scheduled", "pending", "checked_in", "checkedIn", "in_progress", "completed"].includes(appointment.status) }
    else if (activeTab === 'checkedIn') matchesTab = appointment.status === 'checked_in' || appointment.status === 'checkedIn';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor's Appointments</h1>
            <p className="text-gray-600 mt-1">View today's queue and start consultations</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm p-5 mb-6 border border-white/80">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm overflow-hidden border border-white/80 mb-6">
          <div className="flex border-b border-gray-200/50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
            >
              Today's Queue
            </button>
            <button
              onClick={() => setActiveTab('checkedIn')}
              className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'checkedIn' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
            >
              Waiting Room (Checked In)
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-sm overflow-hidden border border-white/80">
          <div className="p-5 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {activeTab === 'all' && 'All Appointments'}
                {activeTab === 'checkedIn' && 'Waiting Room'}
              </h3>
              <div className="text-xs text-blue-600 font-medium bg-blue-100/30 px-3 py-1.5 rounded-full border border-blue-200/50">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'patient' : 'patients'}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200/30">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className={`relative transition-all duration-200 hover:bg-blue-50/10 min-h-[100px]`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center p-4 md:p-5">

                    {/* Patient Column */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-white/80 shadow-sm font-bold text-blue-600">
                          {appointment.queue_number || '-'}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${statusStyles[appointment.status]?.border || 'border-gray-300'}`}></span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{appointment.patient_name}</p>
                        {appointment.is_emergency && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 rounded-md border border-rose-200">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time Column */}
                    <div className="col-span-6 md:col-span-3 border-l border-gray-100 pl-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Slot Time</p>
                        <div className="flex items-center gap-2">
                          <Clock className="text-blue-500/80 w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-700">
                            {appointment.time_slot}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Column */}
                    <div className="col-span-6 md:col-span-2 relative">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-600'} border ${statusStyles[appointment.status]?.border || 'border-gray-300'}`}>
                        {statusStyles[appointment.status]?.icon || <Clock className="w-4 h-4" />}
                        {appointment.status?.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="col-span-12 md:col-span-3 flex justify-end">
                      {(appointment.status === 'checkedIn' || appointment.status === 'checked_in' || appointment.status === 'in_progress') ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/doctor-dashboard/consultation/${appointment.appointment_id}`);
                          }}
                          className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                            appointment.status === 'in_progress' 
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/40' 
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/40'
                          } hover:scale-[1.02]`}
                        >
                          <Stethoscope size={16} />
                          {appointment.status === 'in_progress' ? 'Resume Consult' : 'Start Consult'}
                        </button>
                      ) : appointment.status === 'completed' ? (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle size={14} />
                          Completed
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          Waiting for Reception...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No appointments found for today.
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default DoctorAppointmentsDashboard;
