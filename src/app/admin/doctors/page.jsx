'use client';
import { API_BASE_URL } from '@/utils/api';
// // import { useEffect, useState, useMemo } from 'react';
// import axios from 'axios';
// import { 
//   Search, 
//   Filter, 
//   Plus, 
//   MoreVertical, 
//   Edit2, 
//   Trash2, 
//   Eye,
//   Phone,
//   Mail,
//   MapPin,
//   Calendar,
//   Stethoscope,
//   BadgeDollarSign,
//   Clock,
//   Star,
//   User,
//   GraduationCap,
//   AlertTriangle,
//   X
// } from 'lucide-react'

// export default function DoctorsPage() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterSpecialty, setFilterSpecialty] = useState('all');
//   const [newdoctors, setDoctors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [deleteModal, setDeleteModal] = useState({ isOpen: false, doctor: null });
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateSuccess, setUpdateSuccess] = useState(false);
//   const [updateError, setUpdateError] = useState(null);

//   const fetchDoctors = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${API_BASE_URL}/api/doctor/fetchAll`);
//       setDoctors(response.data.doctors);
//     } catch (err) {
//       console.error("Error fetching doctors:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDoctors();
//   }, []);

//   const handleEditDoctor = () => {
//     setIsEditMode(true);
//   };

//   const handleDeleteDoctor = async (doctor) => {
//     setIsDeleting(true);
//     try {
//       await axios.delete(`${API_BASE_URL}/api/doctor/delete-by-id/${doctor._id}`);
//       setDoctors(prev => prev.filter(d => d._id !== doctor._id));
//       setDeleteModal({ isOpen: false, doctor: null });
//     } catch (error) {
//       console.error('Error deleting doctor:', error);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const handleUpdateDoctor = async (doctorId, formattedData) => {
//     setIsUpdating(true);
//     setUpdateError(null);
//     setUpdateSuccess(false);

//     try {
//       const response = await axios.put(
//         `${API_BASE_URL}/api/doctor/update-by-id/${doctorId}`,
//         formattedData,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           }
//         }
//       );
      
//       setDoctors(prev => prev.map(d => 
//         d._id === doctorId ? { ...d, ...formattedData } : d
//       ));
      
//       setSelectedDoctor(prev => ({ ...prev, ...formattedData }));
//       setUpdateSuccess(true);
      
//       setTimeout(() => {
//         setIsEditMode(false);
//         setUpdateSuccess(false);
//       }, 1500);
      
//     } catch (error) {
//       console.error('Error updating doctor:', error);
      
//       if (error.response?.data?.message) {
//         setUpdateError(error.response.data.message);
//       } else if (error.response?.status === 404) {
//         setUpdateError('Doctor not found. Please refresh the page and try again.');
//       } else if (error.response?.status === 400) {
//         setUpdateError('Invalid data provided. Please check all fields and try again.');
//       } else {
//         setUpdateError('Failed to update doctor. Please try again.');
//       }
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const DeleteConfirmationModal = ({ doctor, onClose, onConfirm, isDeleting }) => {
//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
//         <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in zoom-in-95">
//           <div className="p-8">
//             <div className="text-center mb-6">
//               <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
//                 <AlertTriangle className="h-8 w-8 text-red-600" />
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 Delete Doctor Profile
//               </h3>
//               <p className="text-gray-500 text-sm leading-relaxed">
//                 Are you sure you want to delete Dr. {doctor?.firstName} {doctor?.lastName}'s profile? 
//                 This action cannot be undone.
//               </p>
//             </div>

//             <div className="bg-gray-50 rounded-2xl p-4 mb-6">
//               <div className="flex items-center space-x-3">
//                 <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-pink-400 flex items-center justify-center">
//                   {doctor?.profileImage ? (
//                     <img 
//                       src={doctor.profileImage} 
//                       alt={`${doctor.firstName} ${doctor.lastName}`}
//                       className='h-full w-full object-cover rounded-full' 
//                     />
//                   ) : (
//                     <span className="text-white font-semibold text-sm">
//                       {doctor?.firstName?.[0]}{doctor?.lastName?.[0]}
//                     </span>
//                   )}
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900">
//                     Dr. {doctor?.firstName} {doctor?.lastName}
//                   </p>
//                   <p className="text-sm text-gray-500">{doctor?.specialty}</p>
//                   <p className="text-xs text-gray-400">{doctor?.email}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="flex space-x-3">
//               <button
//                 onClick={onClose}
//                 disabled={isDeleting}
//                 className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={onConfirm}
//                 disabled={isDeleting}
//                 className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
//               >
//                 {isDeleting ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     <span>Deleting...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Trash2 className="h-4 w-4" />
//                     <span>Delete Doctor</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>

//           <button
//             onClick={onClose}
//             disabled={isDeleting}
//             className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>
//       </div>
//     );
//   };

//   const DoctorDetailsModal = ({ doctor, onClose, onEdit, onSave, isEditMode, setIsEditMode }) => {
//     const [formData, setFormData] = useState({
//       firstName: doctor.firstName,
//       lastName: doctor.lastName,
//       email: doctor.email,
//       phone: doctor.phone,
//       specialty: doctor.specialty,
//       supSpeciality: doctor.supSpeciality || '',
//       hospital: doctor.hospital || '',
//       hospitalAddress: doctor.hospitalAddress || '',
//       experience: doctor.experience || '',
//       consultantFee: doctor.consultantFee || '',
//       qualifications: doctor.qualifications?.join(', ') || '',
//       available: {
//         days: doctor.available?.days?.join(', ') || '',
//         time: doctor.available?.time || ''
//       },
//       isVerified: doctor.isVerified || false
//     });

//     const handleInputChange = (e) => {
//       const { name, value, type, checked } = e.target;
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked : value
//       }));
//     };

//     const handleAvailabilityChange = (e) => {
//       const { name, value } = e.target;
//       setFormData(prev => ({
//         ...prev,
//         available: {
//           ...prev.available,
//           [name]: value
//         }
//       }));
//     };

//     const handleSave = () => {
//       const formattedData = {
//         ...formData,
//         qualifications: formData.qualifications 
//           ? formData.qualifications.split(',').map(q => q.trim()).filter(q => q.length > 0)
//           : [],
//         available: {
//           ...formData.available,
//           days: formData.available.days 
//             ? formData.available.days.split(',').map(d => d.trim()).filter(d => d.length > 0)
//             : []
//         }
//       };
      
//       handleUpdateDoctor(doctor._id, formattedData);
//     };

//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//         <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
//         <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//           <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-start justify-between z-10">
//             <div className="flex items-center space-x-3">
//               <div className="relative h-12 w-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center overflow-hidden shadow-md">
//                 {doctor.profileImage ? (
//                   <img 
//                     src={doctor.profileImage} 
//                     alt={`${doctor.firstName} ${doctor.lastName}`}
//                     className='h-full w-full object-cover' 
//                   />
//                 ) : (
//                   <span className="text-white font-semibold text-lg">
//                     {doctor.firstName?.[0]}{doctor.lastName?.[0]}
//                   </span>
//                 )}
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   {isEditMode ? (
//                     <div className="flex space-x-2">
//                       <input
//                         type="text"
//                         name="firstName"
//                         value={formData.firstName}
//                         onChange={handleInputChange}
//                         className="w-28 px-2 py-1 border border-gray-200 rounded-md text-sm"
//                       />
//                       <input
//                         type="text"
//                         name="lastName"
//                         value={formData.lastName}
//                         onChange={handleInputChange}
//                         className="w-28 px-2 py-1 border border-gray-200 rounded-md text-sm"
//                       />
//                     </div>
//                   ) : (
//                     `${doctor.firstName} ${doctor.lastName}`
//                   )}
//                 </h3>
//                 <p className="text-cyan-600 text-sm font-medium">
//                   {isEditMode ? (
//                     <input
//                       type="text"
//                       name="specialty"
//                       value={formData.specialty}
//                       onChange={handleInputChange}
//                       className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm"
//                     />
//                   ) : (
//                     doctor.specialty
//                   )}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-1 text-gray-400 hover:text-gray-500"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>

//           <div className="p-6 space-y-6">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-semibold text-gray-500 mb-3">Contact Information</h4>
//               {isEditMode ? (
//                 <div className="space-y-3">
//                   <div>
//                     <label className="text-xs text-slate-500">Email</label>
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Phone</label>
//                     <input
//                       type="tel"
//                       name="phone"
//                       value={formData.phone}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <div className="flex items-center text-sm text-slate-700">
//                     <Mail className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
//                     <span>{doctor.email}</span>
//                   </div>
//                   <div className="flex items-center text-sm text-slate-700">
//                     <Phone className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
//                     <span>{doctor.phone}</span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-semibold text-gray-500 mb-3">Hospital Details</h4>
//               {isEditMode ? (
//                 <div className="space-y-3">
//                   <div>
//                     <label className="text-xs text-slate-500">Hospital Name</label>
//                     <input
//                       type="text"
//                       name="hospital"
//                       value={formData.hospital}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Hospital Address</label>
//                     <input
//                       type="text"
//                       name="hospitalAddress"
//                       value={formData.hospitalAddress}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <div className="flex items-center text-sm text-slate-700">
//                     <Stethoscope className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
//                     <span>{doctor.hospital || 'Not specified'}</span>
//                   </div>
//                   {doctor.hospitalAddress && (
//                     <div className="flex items-start text-sm text-slate-700">
//                       <MapPin className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0 mt-0.5" />
//                       <span>{doctor.hospitalAddress}</span>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-semibold text-gray-500 mb-3">Professional Details</h4>
//               {isEditMode ? (
//                 <div className="space-y-3">
//                   <div>
//                     <label className="text-xs text-slate-500">Experience (years)</label>
//                     <input
//                       type="number"
//                       name="experience"
//                       value={formData.experience}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Consultation Fee (₹)</label>
//                     <input
//                       type="number"
//                       name="consultantFee"
//                       value={formData.consultantFee}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                     />
//                   </div>
//                   <div>
//                     <label className="flex items-center space-x-2 text-xs text-slate-500">
//                       <input
//                         type="checkbox"
//                         name="isVerified"
//                         checked={formData.isVerified}
//                         onChange={handleInputChange}
//                         className="rounded text-cyan-600"
//                       />
//                       <span>Verified Doctor</span>
//                     </label>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <div className="flex items-center text-sm text-slate-700">
//                     <Calendar className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
//                     <span>{doctor.experience} years experience</span>
//                   </div>
//                   <div className="flex items-center text-sm text-slate-700">
//                     <BadgeDollarSign className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
//                     <span>₹{doctor.consultantFee || 'Not specified'} consultation fee</span>
//                   </div>
//                   <div className="flex items-center text-sm text-slate-700">
//                     <span className={`px-2 py-0.5 rounded-full text-xs ${
//                       doctor.isVerified 
//                         ? 'bg-emerald-100 text-emerald-800'
//                         : 'bg-amber-100 text-amber-800'
//                     }`}>
//                       {doctor.isVerified ? 'Verified' : 'Pending Verification'}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-semibold text-gray-500 mb-3">Qualifications</h4>
//               {isEditMode ? (
//                 <div>
//                   <label className="text-xs text-slate-500">Comma separated list</label>
//                   <input
//                     type="text"
//                     name="qualifications"
//                     value={formData.qualifications}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg mt-1"
//                   />
//                 </div>
//               ) : (
//                 <div className="flex flex-wrap gap-2">
//                   {doctor.qualifications?.length > 0 ? (
//                     doctor.qualifications.map((qual, index) => (
//                       <span 
//                         key={index} 
//                         className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full"
//                       >
//                         {qual}
//                       </span>
//                     ))
//                   ) : (
//                     <p className="text-sm text-slate-500">No qualifications added</p>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-semibold text-gray-500 mb-3">Availability</h4>
//               {isEditMode ? (
//                 <div className="space-y-3">
//                   <div>
//                     <label className="text-xs text-slate-500">Days (comma separated)</label>
//                     <input
//                       type="text"
//                       name="days"
//                       value={formData.available.days}
//                       onChange={handleAvailabilityChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                       placeholder="Monday, Wednesday, Friday"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Time</label>
//                     <input
//                       type="text"
//                       name="time"
//                       value={formData.available.time}
//                       onChange={handleAvailabilityChange}
//                       className="w-full px-3 py-1 text-sm border border-slate-200 rounded-lg"
//                       placeholder="9:00 AM - 5:00 PM"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-start">
//                   <Clock className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <p className="text-sm text-slate-700">
//                       {doctor.available?.days?.join(', ') || 'Not specified'} at {doctor.available?.time || 'Not specified'}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
//             {isEditMode ? (
//               <>
//                 <button
//                   onClick={() => setIsEditMode(false)}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={isUpdating}
//                   className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
//                 >
//                   {isUpdating ? (
//                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                   ) : null}
//                   {isUpdating ? 'Saving...' : 'Save Changes'}
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={onEdit}
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
//                 >
//                   <Edit2 className="h-4 w-4 mr-2" />
//                   Edit Profile
//                 </button>
//                 <button
//                   onClick={onClose}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
//                 >
//                   Close
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const specialties = useMemo(() => {
//     const uniqueSpecialties = [...new Set(newdoctors.map(doctor => doctor.specialty))];
//     return ['all', ...uniqueSpecialties];
//   }, [newdoctors]);

//   const filteredDoctors = useMemo(() => {
//     return newdoctors.filter(doctor => {
//       const matchesSearch = searchTerm === '' || 
//         `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (doctor.hospitalAddress && doctor.hospitalAddress.toLowerCase().includes(searchTerm.toLowerCase()));

//       const matchesSpecialty = filterSpecialty === 'all' || 
//         doctor.specialty === filterSpecialty;

//       return matchesSearch && matchesSpecialty;
//     });
//   }, [newdoctors, searchTerm, filterSpecialty]);

//   const getAverageRating = (doctor) => {
//     const baseRating = 3 + Math.random() * 2;
//     return baseRating.toFixed(1);
//   };

//   const formatExperience = (years) => {
//     if (!years) return 'Not specified';
//     if (years === 1) return '1 year';
//     return `${years} years`;
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
//           <p className="text-gray-600 mt-1">
//             {loading ? 'Loading...' : 
//               filteredDoctors.length !== newdoctors.length 
//                 ? `Showing ${filteredDoctors.length} of ${newdoctors.length} doctors` 
//                 : `Managing ${newdoctors.length} doctors`
//             }
//           </p>
//         </div>
//         <a
//           href="/admin/doctors/add"
//           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl hover:from-teal-700 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg"
//         >
//           <Plus className="h-5 w-5 mr-2" />
//           Add New Doctor
//         </a>
//       </div>

//       <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
//         <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//             <input
//               type="text"
//               placeholder="Search by name, specialty, location..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl
//                        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
//                        transition-all duration-200 text-slate-900 placeholder-slate-400"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <Filter className="h-4 w-4 text-slate-500" />
//             <select
//               value={filterSpecialty}
//               onChange={(e) => setFilterSpecialty(e.target.value)}
//               className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl
//                        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
//                        transition-all duration-200 text-slate-900"
//             >
//               {specialties.map(specialty => (
//                 <option key={specialty} value={specialty}>
//                   {specialty === 'all' ? 'All Specialties' : specialty}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {(searchTerm || filterSpecialty !== 'all') && (
//             <button
//               onClick={() => {
//                 setSearchTerm('');
//                 setFilterSpecialty('all');
//               }}
//               className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
//             >
//               Reset Filters
//             </button>
//           )}
//         </div>
//       </div>

//       {loading && (
//         <div className="text-center py-12">
//           <div className="h-24 w-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
//           </div>
//           <h3 className="text-lg font-medium text-slate-900 mt-4">Loading Doctors</h3>
//           <p className="text-slate-500 mt-2">Please wait while we fetch the latest data</p>
//         </div>
//       )}

//       {!loading && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredDoctors.map((doctor) => (
//             <div
//               key={doctor._id}
//               className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 group"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center space-x-3">
//                   <div className="relative h-12 w-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center overflow-hidden shadow-md">
//                     {doctor.profileImage ? (
//                       <img 
//                         src={doctor.profileImage} 
//                         alt={`${doctor.firstName} ${doctor.lastName}`}
//                         className='h-full w-full object-cover' 
//                       />
//                     ) : (
//                       <span className="text-white font-semibold text-lg">
//                         {doctor.firstName?.[0]}{doctor.lastName?.[0]}
//                       </span>
//                     )}
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">
//                       Dr. {doctor.firstName} {doctor.lastName}
//                     </h3>
//                     <p className="text-sm text-cyan-600 font-medium">{doctor.specialty}</p>
//                     {doctor.supSpeciality && (
//                       <p className="text-xs text-slate-500">{doctor.supSpeciality}</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="relative">
//                   <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
//                     <MoreVertical className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>

//               <div className="space-y-2 mb-4">
//                 <div className="flex items-center text-sm text-slate-600">
//                   <Mail className="h-4 w-4 mr-2 text-slate-400" />
//                   <span className="truncate">{doctor.email}</span>
//                 </div>
//                 <div className="flex items-center text-sm text-slate-600">
//                   <Phone className="h-4 w-4 mr-2 text-slate-400" />
//                   <span>{doctor.phone}</span>
//                 </div>
//                 {doctor.hospital && (
//                   <div className="flex items-center text-sm text-slate-600">
//                     <Stethoscope className="h-4 w-4 mr-2 text-slate-400" />
//                     <span className="truncate">{doctor.hospital}</span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center space-x-4">
//                   <div className="flex items-center text-sm text-slate-600">
//                     <Calendar className="h-4 w-4 mr-1 text-slate-400" />
//                     <span>{formatExperience(doctor.experience)}</span>
//                   </div>
                  
//                   <div className="flex items-center text-sm text-slate-600">
//                     <Star className="h-4 w-4 mr-1 text-amber-400 fill-current" />
//                     <span>{getAverageRating(doctor)}</span>
//                   </div>
//                 </div>

//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                   doctor.isVerified 
//                     ? 'bg-emerald-100 text-emerald-800'
//                     : 'bg-amber-100 text-amber-800'
//                 }`}>
//                   {doctor.isVerified ? 'Verified' : 'Pending'}
//                 </span>
//               </div>

//               {doctor.consultantFee && (
//                 <div className="flex items-center text-sm text-slate-600 mb-4">
//                   <BadgeDollarSign className="h-4 w-4 mr-2 text-slate-400" />
//                   <span>₹{doctor.consultantFee} consultation fee</span>
//                 </div>
//               )}

//               {doctor.qualifications && doctor.qualifications.length > 0 && (
//                 <div className="flex flex-wrap gap-1 mb-4">
//                   {doctor.qualifications.slice(0, 3).map((qual, index) => (
//                     <span 
//                       key={index} 
//                       className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
//                     >
//                       {qual}
//                     </span>
//                   ))}
//                   {doctor.qualifications.length > 3 && (
//                     <span className="text-xs text-slate-500 px-2 py-1">
//                       +{doctor.qualifications.length - 3} more
//                     </span>
//                   )}
//                 </div>
//               )}

//               <div className="flex space-x-2 pt-4 border-t border-slate-100">
//                 <button
//                   onClick={() => {
//                     setSelectedDoctor(doctor);
//                     setIsModalOpen(true);
//                     setIsEditMode(false);
//                   }}
//                   className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
//                 >
//                   <Eye className="h-4 w-4 mr-1" />
//                   View
//                 </button>
//                 <button
//                   onClick={() => {
//                     setSelectedDoctor(doctor);
//                     setIsModalOpen(true);
//                     setIsEditMode(true);
//                   }}
//                   className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
//                 >
//                   <Edit2 className="h-4 w-4 mr-1" />
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => setDeleteModal({ isOpen: true, doctor })}
//                   className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {!loading && filteredDoctors.length === 0 && (
//         <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
//           <div className="h-24 w-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
//             <User className="h-12 w-12 text-slate-400" />
//           </div>
//           <h3 className="text-lg font-medium text-slate-900 mb-2">
//             {searchTerm || filterSpecialty !== 'all' ? 'No doctors found' : 'No doctors yet'}
//           </h3>
//           <p className="text-slate-500 mb-6">
//             {searchTerm || filterSpecialty !== 'all' 
//               ? 'Try adjusting your search or filter criteria'
//               : 'Get started by adding your first doctor to the system'
//             }
//           </p>
//           {(!searchTerm && filterSpecialty === 'all') && (
//             <a
//               href="/admin/doctors/add"
//               className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl hover:from-teal-700 hover:to-cyan-600 transition-all duration-200"
//             >
//               <Plus className="h-5 w-5 mr-2" />
//               Add First Doctor
//             </a>
//           )}
//         </div>
//       )}

//       {isModalOpen && selectedDoctor && (
//  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//     <DoctorDetailsModal
//       doctor={selectedDoctor}
//       onClose={() => {
//         setIsModalOpen(false);
//         setSelectedDoctor(null);
//         setIsEditMode(false);
//       }}
//       onEdit={handleEditDoctor}
//       onSave={handleUpdateDoctor}
//       isEditMode={isEditMode}
//       setIsEditMode={setIsEditMode}
//     />
//   </div>
// )}

//       {deleteModal.isOpen && (
//         <DeleteConfirmationModal
//           doctor={deleteModal.doctor}
//           onClose={() => setDeleteModal({ isOpen: false, doctor: null })}
//           onConfirm={() => handleDeleteDoctor(deleteModal.doctor)}
//           isDeleting={isDeleting}
//         />
//       )}
//     </div>
//   );
// }

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown, 
  XCircle, 
  CheckCircle 
} from 'lucide-react'

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [rejectionReason, setRejectionReason] = useState({ title: '', description: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/doctor/fetchAll`);
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [doctors, sortConfig]);

  const filteredDoctors = useMemo(() => {
    return sortedDoctors.filter(doctor => {
      const matchesSearch = searchTerm === '' || 
        `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.hospitalAddress && doctor.hospitalAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSpecialty = filterSpecialty === 'all' || doctor.specialty === filterSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [sortedDoctors, searchTerm, filterSpecialty]);

  const specialties = useMemo(() => {
    const uniqueSpecialties = [...new Set(doctors.map(doctor => doctor.specialty))];
    return ['all', ...uniqueSpecialties];
  }, [doctors]);

  const handleDeleteDoctor = async (doctor) => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/doctor/delete-by-id/${doctor._id}`);
      if (response.data.success) {
        setDoctors(prev => prev.filter(d => d._id !== doctor._id));
        setShowRejectModal(false);
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setError(error.message || 'Failed to delete doctor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveDoctor = async (id) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/api/v1/doctor/update-by-id/${id}`, {
        isVerified: true,
        status: 'active'
      });
      if (response.data.success) {
        setDoctors(prev => prev.map(doctor => 
          doctor._id === id ? { ...doctor, isVerified: true, status: 'active' } : doctor
        ));
        setShowApprovalSuccess(true);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to approve doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDoctor = async () => {
    if (!rejectionReason.description) {
      alert('Please provide a description for the rejection reason');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/api/v1/doctor/update-by-id/${selectedDoctor._id}`, {
        status: 'rejected',
        isVerified: false,
        rejectionReason: rejectionReason.description
      });
      if (response.data.success) {
        setDoctors(prev => prev.map(doctor => 
          doctor._id === selectedDoctor._id ? {
            ...doctor,
            status: 'rejected',
            isVerified: false,
            rejectionReason: rejectionReason.description
          } : doctor
        ));
        setShowRejectModal(false);
        setRejectionReason({ title: '', description: '' });
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to reject doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoctor = async (doctorId, formattedData) => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/doctor/update-by-id/${doctorId}`,
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data.success) {
        setDoctors(prev => prev.map(d => 
          d._id === doctorId ? { ...d, ...formattedData } : d
        ));
        
        setSelectedDoctor(prev => ({ ...prev, ...formattedData }));
        setUpdateSuccess(true);
      }
      
      setTimeout(() => {
        setIsEditMode(false);
        setUpdateSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating doctor:', error);
      
      if (error.response?.data?.message) {
        setUpdateError(error.response.data.message);
      } else if (error.response?.status === 404) {
        setUpdateError('Doctor not found. Please refresh the page and try again.');
      } else if (error.response?.status === 400) {
        setUpdateError('Invalid data provided. Please check all fields and try again.');
      } else {
        setUpdateError('Failed to update doctor. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

 const DoctorDetailsModal = ({ doctor, onClose, onEdit, onSave, isEditMode, setIsEditMode }) => {
  const [formData, setFormData] = useState({
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    phone: doctor.phone,
    specialty: doctor.specialty,
    supSpeciality: doctor.supSpeciality || '',
    hospital: doctor.hospital || '',
    hospitalAddress: doctor.hospitalAddress || '',
    experience: doctor.experience || '',
    consultantFee: doctor.consultantFee || '',
    qualifications: doctor.qualifications?.join(', ') || '',
    available: {
      days: doctor.available?.days?.join(', ') || '',
      time: doctor.available?.time || ''
    },
    isVerified: doctor.isVerified || false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      available: {
        ...prev.available,
        [name]: value
      }
    }));
  };

  const handleSave = () => {
    const formattedData = {
      ...formData,
      qualifications: formData.qualifications 
        ? formData.qualifications.split(',').map(q => q.trim()).filter(q => q.length > 0)
        : [],
      available: {
        ...formData.available,
        days: formData.available.days 
          ? formData.available.days.split(',').map(d => d.trim()).filter(d => d.length > 0)
          : []
      }
    };
    
    handleUpdateDoctor(doctor._id, formattedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header with doctor profile */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-cyan-50 px-8 py-6 border-b border-gray-200 flex items-start justify-between z-10">
          <div className="flex items-center space-x-5">
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white">
              {doctor.profileImage ? (
                <img 
                  src={doctor.profileImage} 
                  alt={`${doctor.firstName} ${doctor.lastName}`}
                  className='h-full w-full object-cover' 
                />
              ) : (
                <span className="text-white font-semibold text-2xl">
                  {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {isEditMode ? (
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </span>
                )}
              </h3>
              <div className="mt-1">
                {isEditMode ? (
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                    {doctor.specialty}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="p-8 space-y-8">
          {/* Contact Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h4>
              {doctor.isVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              )}
            </div>
            
            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{doctor.email}</span>
                </div>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{doctor.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Professional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Hospital Details
              </h4>
              
              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Address</label>
                    <textarea
                      type="text"
                      name="hospitalAddress"
                      value={formData.hospitalAddress}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-medium">{doctor.hospital || 'Not specified'}</p>
                      {doctor.hospitalAddress && (
                        <p className="text-gray-600 text-sm mt-1">{doctor.hospitalAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Experience & Fees */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Professional Details
              </h4>
              
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        name="consultantFee"
                        value={formData.consultantFee}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Verified Doctor
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{doctor.experience || '0'} years experience</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">₹{doctor.consultantFee || 'Not specified'} consultation fee</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.isVerified 
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doctor.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
  <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
    <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Documents
  </h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h5 className="font-medium text-gray-700">Identity Proof</h5>
      </div>
      <div className="p-4 flex justify-center bg-gray-50">
        <img 
          src={doctor.identityProof} 
          alt="Identity Proof" 
          className="max-h-64 object-contain rounded-md border border-gray-200"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/300x400?text=Identity+Proof+Not+Available";
          }}
        />
      </div>
    </div>
    
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h5 className="font-medium text-gray-700">Degree Certificate</h5>
      </div>
      <div className="p-4 flex justify-center bg-gray-50">
        <img 
          src={doctor.degreeCertificate} 
          alt="Degree Certificate" 
          className="max-h-64 object-contain rounded-md border border-gray-200"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/300x400?text=Degree+Certificate+Not+Available";
          }}
        />
      </div>
    </div>
  </div>
</div>
          {/* Qualifications */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Qualifications
            </h4>
            
            {isEditMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications (comma separated)</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="MBBS, MD, DM Cardiology..."
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {doctor.qualifications?.length > 0 ? (
                  doctor.qualifications.map((qual, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800"
                    >
                      {qual}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No qualifications added</p>
                )}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Availability
            </h4>
            
            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Available</label>
                  <input
                    type="text"
                    name="days"
                    value={formData.available.days}
                    onChange={handleAvailabilityChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Monday, Wednesday, Friday"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timings</label>
                  <input
                    type="text"
                    name="time"
                    value={formData.available.time}
                    onChange={handleAvailabilityChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="9:00 AM - 5:00 PM"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">{doctor.available?.days?.join(', ') || 'Not specified'}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span>{doctor.available?.time || 'Not specified'}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-200 flex justify-end space-x-4">
          {isEditMode ? (
            <>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg hover:from-cyan-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

  const statusClasses = {
    active: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-blue-100 text-blue-800',
    rejected: 'bg-rose-100 text-rose-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-sm text-gray-500">Manage all registered doctors and their details</p>
        </div>
        <a
          href="/admin/doctors/add"
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search doctors by name, specialty, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"


            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(searchTerm || filterSpecialty !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSpecialty('all');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty === 'all' ? 'All Specialties' : specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSpecialty('all');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('firstName')}
                  >
                    <div className="flex items-center">
                      Doctor Name
                      {sortConfig.key === 'firstName' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Specialty
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hospital
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Verification
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 flex items-center justify-center">
                            {doctor.profileImage ? (
                              <img
                                src={doctor.profileImage}
                                alt={`${doctor.firstName} ${doctor.lastName}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-teal-600 font-medium">{doctor.firstName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doctor.firstName} {doctor.lastName}</div>
                            <div className="text-sm text-gray-500">{doctor.hospitalAddress || 'No address'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.specialty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.phone}</div>
                        <div className="text-sm text-gray-500">{doctor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.hospital || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[doctor.status] || 'bg-gray-100 text-gray-800'}`}>
                          {doctor.status?.charAt(0).toUpperCase() + doctor.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doctor.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveDoctor(doctor._id)}
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowRejectModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : doctor.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        ) : doctor.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowViewModal(true);
                              setIsEditMode(false);
                            }}
                            className="text-cyan-600 hover:text-cyan-900 p-1.5 rounded-lg hover:bg-cyan-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || filterSpecialty !== 'all' 
                        ? 'No doctors found matching your criteria'
                        : 'No doctors found. Add a new doctor to get started.'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Doctor Modal */}
      {showViewModal && selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDoctor(null);
            setIsEditMode(false);
          }}
          onEdit={() => setIsEditMode(true)}
          onSave={handleUpdateDoctor}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      )}

      {/* Reject Doctor Modal */}
      {showRejectModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reject Doctor</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason({ title: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-rose-700">
                        You are about to reject <span className="font-semibold">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</span>.
                        Please provide a reason for rejection.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
                    <textarea
                      value={rejectionReason.description}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      rows="4"
                      placeholder="Provide specific details about why this doctor is being rejected..."
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason({ title: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectDoctor}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 rounded-lg text-sm font-medium text-white hover:from-rose-700 hover:to-red-700 transition-all shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Rejecting...' : 'Reject Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Modal */}
      {showApprovalSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Approved Successfully!</h3>
            <p className="text-sm text-gray-500 mb-6">
              The doctor has been approved and is now active.
            </p>
            <button
              onClick={() => setShowApprovalSuccess(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
