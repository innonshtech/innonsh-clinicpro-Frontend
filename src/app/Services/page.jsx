'use client';
import { Stethoscope, Pill, Calendar, Clipboard, Activity, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Services() {
  const servicesList = [
    {
      title: 'Find Doctors',
      description: 'Book appointments with qualified doctors near you',
      icon: <Stethoscope className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
     
    },
    {
      title: 'Top Clinics',
      description: 'Get consultations and treatments from top clinics of the city',
      icon: <Calendar className="h-6 w-6" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
     
    },
    {
      title: 'Medicine Delivery',
      description: 'Order medicines and get them delivered at home',
      icon: <Pill className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    
    },
    {
      title: 'Health Records',
      description: 'Store your medical records securely',
      icon: <Clipboard className="h-6 w-6" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
   
    },
    {
      title: 'Health Checkups',
      description: 'Book preventive health checkup packages',
      icon: <Activity className="h-6 w-6" />,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
     
    },
    {
      title: 'Emergency Care',
      description: 'Get immediate assistance for urgent medical needs',
      icon: <HeartPulse className="h-6 w-6" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
    
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Our Healthcare Services
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Comprehensive healthcare solutions designed for your wellbeing
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
                              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 h-full overflow-hidden">
                  {/* Gradient background for icon */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${service.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  
                  {/* Icon container */}
                  <div className={`w-16 h-16 rounded-xl ${service.bgColor} flex items-center justify-center mb-6 relative z-10`}>
                    <div className={`bg-gradient-to-br ${service.color} p-3 rounded-lg text-white`}>
                      {service.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 relative z-10">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6 relative z-10">{service.description}</p>
                  
                  
                    
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 border-2 border-transparent rounded-2xl group-hover:border-blue-500/30 pointer-events-none transition-all duration-300"></div>
                
            
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          
        </motion.div>
      </div>
    </section>
  );
}
