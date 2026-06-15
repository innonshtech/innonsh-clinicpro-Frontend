'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  Award, 
  MapPin, 
  Edit, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Filter,
  MoreVertical,
  Stethoscope,
  BadgePlus,
  FileText,
  UserCheck,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { ROLES } from '@/constants/roles';

const statusColors = {
  Active: 'bg-emerald-100 text-emerald-800',
  'On Leave': 'bg-amber-100 text-amber-800',
  'In Surgery': 'bg-purple-100 text-purple-800',
  'On Vacation': 'bg-blue-100 text-blue-800'
};

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default function DoctorsPage() {
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filters = ['All', 'Cardiologist', 'Dermatologist'];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);
        if (data.id) fetchDoctors(data.id);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  const fetchDoctors = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        const transformedDoctors = responseData.data.doctors.map(doc => ({
          id: doc._id || doc.id,
          name: `${doc.firstName} ${doc.lastName}`,
          specialty: doc.specialty,
          experience: `${doc.experience} Years`,
          rating: 4.5,
          location: doc.homeAddress,
          availability: doc.available?.days || ['Mon', 'Wed', 'Fri'],
          degrees: doc.qualifications || [],
          fee: `₹${doc.consultantFee}`,
          status: doc.status || "Active",
          phone: doc.phone,
          email: doc.email,
          image: doc.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.firstName)}&background=random`,
          bio: doc.bio || `Specialist in ${doc.specialty}`,
          languages: ['English', 'Hindi'],
          gender: doc.gender,
          dateOfBirth: doc.dateOfBirth,
          licenseNumber: doc.licenseNumber,
          hospital: doc.hospital,
          hospitalAddress: doc.hospitalAddress,
          sessionTime: doc.sessionTime,
          supSpeciality: doc.supSpeciality
        }));
        setDoctors(transformedDoctors);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch = 
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.specialty.toLowerCase().includes(query.toLowerCase()) ||
        d.location.toLowerCase().includes(query.toLowerCase());
      
      const matchesFilter = 
        activeFilter === 'All' || 
        d.status === activeFilter || 
        d.specialty === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [doctors, query, activeFilter]);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleDeleteDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/doctor/delete-by-id/${selectedDoctor.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const responseData = await response.json();
      if (responseData.success) {
        setDoctors(prev => prev.filter(d => d.id !== selectedDoctor.id));
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Doctor Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage medical professionals</p>
        </div>
        <Link href="/clinic/doctors/add">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm">
            <BadgePlus className="w-5 h-5" />
            <span>Add Doctor</span>
          </button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <img 
                  src={doc.image} 
                  alt={doc.name} 
                  className="w-16 h-16 rounded-xl object-cover border border-gray-100" 
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(doc.name) + "&background=random"; }}
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Dr. {doc.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewDetails(doc)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye /></button>
                      <button onClick={() => handleDeleteDoctor(doc)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <Stethoscope size={16} />
                    <span>{doc.specialty}</span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center text-gray-700">
                      <Star size={16} className="text-amber-400 fill-amber-400 mr-1" />
                      {doc.rating}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doc.availability.map(day => (
                      <span key={day} className="bg-blue-50 text-blue-600 text-xs px-2 label flex items-center rounded-full"><Clock size={12} className="mr-1"/>{day}</span>
                    ))}
                    <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full">{doc.fee}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredDoctors.length === 0 && <div className="text-center py-10 text-gray-500">No doctors found.</div>}
        </div>
      )}

      {showModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"><X /></button>
            <div className="flex flex-col md:flex-row gap-8">
              <img src={selectedDoctor.image} className="w-48 h-48 rounded-2xl object-cover shadow-lg border" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(doc.name) + "&background=random"; }} />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Dr. {selectedDoctor.name}</h2>
                <div className="flex gap-2 mb-6">
                   <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{selectedDoctor.specialty}</span>
                   <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors[selectedDoctor.status]}`}>{selectedDoctor.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl"><strong>Email:</strong> {selectedDoctor.email}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><strong>Phone:</strong> {selectedDoctor.phone}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><strong>Experience:</strong> {selectedDoctor.experience}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><strong>Hospital:</strong> {selectedDoctor.hospital}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <div className="p-6 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold">Delete Doctor?</h3>
            <p className="text-gray-500 my-2">This action is permanent and cannot be undone.</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
