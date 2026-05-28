'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, MapPin, Clock, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/fetchAll`);
        const result = await res.json();
        
        if (result.success) {
          const doctorsData = result.data.doctors;
          if (!Array.isArray(doctorsData)) {
            throw new Error('Invalid API response format: data.doctors is not an array');
          }
          setDoctors(doctorsData);
          setFilteredDoctors(doctorsData);
        } else {
          throw new Error(result.message || 'Failed to load doctors');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err.message);
        setError(err.message || 'Failed to load doctors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    let results = doctors;
    if (searchTerm) {
      results = results.filter(
        (doctor) =>
          doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doctor.supSpeciality &&
            doctor.supSpeciality.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedSpecialty !== 'All') {
      results = results.filter(
        (doctor) => doctor.specialty === selectedSpecialty
      );
    }
    setFilteredDoctors(results);
  }, [searchTerm, selectedSpecialty, doctors]);

  const specialties = ['All', ...new Set(doctors.map((doctor) => doctor.specialty))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 w-32 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search and Filter Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Find a Doctor</h1>
              <p className="text-blue-100 mt-2">
                Book appointments with top specialists near you
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/" className="text-white hover:text-blue-200 transition text-sm flex items-center">
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                Back to Home
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search doctors by name, specialty..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
            <p className="text-gray-600 mt-2">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('All');
              }}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/doctors/${doctor._id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                      {doctor.profileImage ? (
                        <Image
                          src={doctor.profileImage}
                          alt={`${doctor.firstName} ${doctor.lastName}`}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 capitalize">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                      {doctor.supSpeciality && (
                        <p className="text-xs text-gray-500 truncate">
                          {doctor.supSpeciality}
                        </p>
                      )}
                      <div className="flex items-center mt-1">
                        {Array(Math.min(5, Math.max(1, Math.floor(doctor.experience / 2))))
                          .fill()
                          .map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          ))}
                        <span className="ml-1 text-xs font-medium text-gray-900">
                          {Math.min(5, Math.max(1, Math.floor(doctor.experience / 2))).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="truncate">{doctor.hospital}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{doctor.experience}+ years experience</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Consultation Fee</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{doctor.consultantFee}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/doctors/${doctor._id}/book`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
