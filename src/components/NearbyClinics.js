'use client';
import { motion } from 'framer-motion'

export default function ClinicsPage() {
  const clinics = [
    {
      id: 1,
      name: "City Health Clinic",
      type: "Multi-specialty Clinic",
      address: "123 Main Street, Sector 12",
      rating: 4.7,
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aG9zcGl0YWx8ZW58MHx8MHx8fDA%3D",
      features: ["24/7 Emergency", "Lab Services", "Pediatrics"]
    },
    {
      id: 2,
      name: "Family Care Clinic",
      type: "Primary Care",
      address: "456 Park Avenue, Sector 15",
      rating: 4.5,
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG9zcGl0YWx8ZW58MHx8MHx8fDA%3D",
      features: ["General Medicine", "Dental Care", "Pharmacy"]
    },
    {
      id: 3,
      name: "Elite Specialist Clinic",
      type: "Specialty Clinic",
      address: "789 Next Gen Building, Sector 20",
      rating: 4.9,
      distance: "2.3 km",
      image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8aG9zcGl0YWx8ZW58MHx8MHx8fDA%3D",
      features: ["Cardiology", "Orthopedics", "Dermatology"]
    },
    {
      id: 4,
      name: "Wellness Centre",
      type: "Holistic Health Clinic",
      address: "101 Green Valley, Sector 8",
      rating: 4.6,
      distance: "1.8 km",
      image: "https://media.istockphoto.com/id/1139755582/photo/medical-equipment-on-the-background-of-group-of-health-workers-in-the-icu.webp?a=1&b=1&s=612x612&w=0&k=20&c=U5oZr7UsC9pOBoostQFuZ2aP2gVE3HGqAn1fUSwU2Lg=",
      features: ["Physiotherapy", "Nutrition", "Mental Health"]
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="bg-gradient-to-b from-teal-50 to-blue-100 min-h-screen py-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4 tracking-tight">
            Nearby Clinics
          </h1>
          <p className="text-xl text-blue-600 max-w-2xl mx-auto">
            Find quality healthcare facilities near your location
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {clinics.map(clinic => (
            <motion.div
              key={clinic.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: clinic.id * 0.1,
                duration: 0.5
              }}
              className="bg-white rounded-3xl overflow-hidden shadow-xl transform transition-transform duration-300 hover:scale-105"
            >
              <img
                src={clinic.image}
                alt={clinic.name}
                className="w-full h-64 object-cover object-center"
              />
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold text-blue-800 mb-1">
                  {clinic.name}
                </h3>
                <p className="text-blue-600 font-medium mb-4">
                  {clinic.type}
                </p>
                <div className="flex items-center mb-4">
                  <span className="text-gray-600 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.999 1.999 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.893 11.401a1 1 0 00-1.414-1.414L9 10.586V1h-1v9.586l4.293-4.293z" />
                    </svg>
                  </span>
                  <span className="text-gray-600">
                    {clinic.address}
                  </span>
                </div>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">
                      ★
                    </span>
                  ))}
                  <span className="text-gray-600 ml-2">
                    {clinic.rating}
                  </span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-gray-600">
                    {clinic.distance} away
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Specialized in: {clinic.features.join(', ')}
                </p>
                <div className="flex items-center">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    href={`/clinics/${clinic.id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium cursor-pointer transition-colors hover:bg-blue-600"
                  >
                    View Details
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600"
          >
            Load More Clinics
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
