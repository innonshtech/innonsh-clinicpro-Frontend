'use client';
import { Stethoscope, Pill, Calendar, Clipboard, Activity, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function Services() {
  const servicesList = [
    {
      title: 'Find Doctors',
      description: 'Book appointments with qualified doctors near you',
      icon: <Stethoscope className="h-6 w-6" />,
      color: 'bg-blue-100 text-blue-600',
      link: '/doctors'
    },
    {
      title: 'Online Consultation',
      description: 'Consult with doctors via video call',
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-green-100 text-green-600',
      link: '/teleconsultation'
    },
    {
      title: 'Medicine Delivery',
      description: 'Order medicines and get them delivered at home',
      icon: <Pill className="h-6 w-6" />,
      color: 'bg-purple-100 text-purple-600',
      link: '/medicines'
    },
    {
      title: 'Health Records',
      description: 'Store your medical records securely',
      icon: <Clipboard className="h-6 w-6" />,
      color: 'bg-orange-100 text-orange-600',
      link: '/records'
    },
    {
      title: 'Health Checkups',
      description: 'Book preventive health checkup packages',
      icon: <Activity className="h-6 w-6" />,
      color: 'bg-rose-100 text-rose-600',
      link: '/health-checkups'
    },
    {
      title: 'Emergency Care',
      description: 'Get immediate assistance for urgent medical needs',
      icon: <HeartPulse className="h-6 w-6" />,
      color: 'bg-red-100 text-red-600',
      link: '/emergency'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-indigo-900">Our Services</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Comprehensive healthcare services for all your needs
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service, index) => (
            <Link key={index} href={service.link}>
              <div className="group relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div className={`inline-flex p-3 rounded-lg ${service.color}`}>
                  {service.icon}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                  {service.title}
                </h3>
                <p className="mt-2 text-gray-500">{service.description}</p>
                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline">
                  Learn more →
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 border-2 border-transparent rounded-xl group-hover:border-blue-600 pointer-events-none transition-all duration-300"></div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/services" className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-300">
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
