'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DoctorsSection() {
  const [activeTab, setActiveTab] = useState('topRated');
  
  const doctors = {
    topRated: [
      {
        id: 1,
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        experience: '15+ Years Experience',
        rating: 4.9,
        reviews: 124,
        location: 'Apollo Hospital, Mumbai',
        availableToday: true,
        consultationFee: '₹150',
        image: '/doctor1.jpg',
      },
      {
        id: 2,
        name: 'Dr. Michael Chen',
        specialty: 'Neurologist',
        experience: '12+ Years Experience',
        rating: 4.8,
        reviews: 98,
        location: 'Lilavati Hospital, Mumbai',
        availableToday: true,
        consultationFee: '₹180',
        image: '/doctor2.jpg',
      },
      {
        id: 3,
        name: 'Dr. Emily Williams',
        specialty: 'Dermatologist',
        experience: '8+ Years Experience',
        rating: 4.7,
        reviews: 86,
        location: 'Fortis Hospital, Delhi',
        availableToday: false,
        consultationFee: '₹130',
        image: '/doctor3.jpg',
      },
      {
        id: 4,
        name: 'Dr. David Rodriguez',
        specialty: 'Orthopedic Surgeon',
        experience: '20+ Years Experience',
        rating: 4.9,
        reviews: 215,
        location: 'Max Hospital, Delhi',
        availableToday: true,
        consultationFee: '₹200',
        image: '/doctor4.jpg',
      },
    ],
    available: [
      {
        id: 2,
        name: 'Dr. Michael Chen',
        specialty: 'Neurologist',
        experience: '12+ Years Experience',
        rating: 4.8,
        reviews: 98,
        location: 'Lilavati Hospital, Mumbai',
        availableToday: true,
        consultationFee: '₹180',
        image: '/doctor2.jpg',
      },
      {
        id: 4,
        name: 'Dr. David Rodriguez',
        specialty: 'Orthopedic Surgeon',
        experience: '20+ Years Experience',
        rating: 4.9,
        reviews: 215,
        location: 'Max Hospital, Delhi',
        availableToday: true,
        consultationFee: '₹200',
        image: '/doctor4.jpg',
      },
      {
        id: 5,
        name: 'Dr. Lisa Thompson',
        specialty: 'Gynecologist',
        experience: '10+ Years Experience',
        rating: 4.6,
        reviews: 74,
        location: 'Manipal Hospital, Bangalore',
        availableToday: true,
        consultationFee: '₹170',
        image: '/doctor5.jpg',
      },
      {
        id: 6,
        name: 'Dr. James Wilson',
        specialty: 'Pediatrician',
        experience: '14+ Years Experience',
        rating: 4.7,
        reviews: 143,
        location: 'Rainbow Children\'s Hospital, Hyderabad',
        availableToday: true,
        consultationFee: '₹140',
        image: '/doctor6.jpg',
      },
    ],
    nearest: [
      {
        id: 1,
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        experience: '15+ Years Experience',
        rating: 4.9,
        reviews: 124,
        location: 'Apollo Hospital, Mumbai',
        availableToday: true,
        consultationFee: '₹150',
        image: '/doctor1.jpg',
      },
      {
        id: 7,
        name: 'Dr. Robert Kim',
        specialty: 'Dentist',
        experience: '9+ Years Experience',
        rating: 4.5,
        reviews: 89,
        location: 'Smile Dental Clinic, Pune',
        availableToday: false,
        consultationFee: '₹120',
        image: '/doctor7.jpg',
      },
      {
        id: 8,
        name: 'Dr. Maria Garcia',
        specialty: 'Family Medicine',
        experience: '12+ Years Experience',
        rating: 4.8,
        reviews: 106,
        location: 'Community Health Center, Chennai',
        availableToday: true,
        consultationFee: '₹130',
        image: '/doctor8.jpg',
      },
      {
        id: 9,
        name: 'Dr. John Miller',
        specialty: 'ENT Specialist',
        experience: '11+ Years Experience',
        rating: 4.6,
        reviews: 72,
        location: 'ENT Specialist Center, Ahmedabad',
        availableToday: false,
        consultationFee: '₹160',
        image: '/doctor9.jpg',
      },
    ]
  };

  const activeDoctors = doctors[activeTab];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-indigo-900">Our Top Doctors</h2>
            <p className="mt-2 text-gray-600">Book appointments with our experienced specialists</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/doctors" className="text-blue-600 font-medium flex items-center hover:underline">
              View All Doctors
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="mt-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('topRated')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'topRated'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Today
            </button>
            <button
              onClick={() => setActiveTab('nearest')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nearest'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Nearest You
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {activeDoctors.map((doctor) => (
            <Link key={doctor.id} href={`/doctors/${doctor.id}`}>
              <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
                <div className="relative h-48 bg-blue-50">
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
                    <div className="h-28 w-28 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                      <span className="font-bold">Doctor</span>
                    </div>
                  </div>
                  {doctor.availableToday && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Available Today
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-indigo-900">{doctor.name}</h3>
                  <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                  <p className="text-gray-500 text-xs mt-1">{doctor.experience}</p>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-900">{doctor.rating}</span>
                    </div>
                    <span className="mx-1 text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{doctor.reviews} reviews</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="truncate">{doctor.location}</span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      <span>Next available: Today</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{doctor.consultationFee}</span>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-10 flex justify-center">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
              3
            </button>
            <span className="text-gray-500">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
              8
            </button>
            <button className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
