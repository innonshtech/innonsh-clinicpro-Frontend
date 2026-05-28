'use client';
// app/components/Dashboard/QuickActionCards.jsx
import Link from 'next/link'
import { 
  UserPlusIcon, 
  CalendarDaysIcon, 
  ChatBubbleLeftIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'

export default function QuickActionCards({ stats = {} }) {
  // Provide default values in case stats is undefined or missing properties
  const safeStats = {
    totalPatients: 0,
    todayAppointments: 0,
    newMessages: 0,
    followUps: 0,
    ...stats
  }

  const cards = [
    {
      title: 'Add New Patient',
      value: safeStats.totalPatients,
      label: 'Total Patients',
      icon: UserPlusIcon,
      href: '/receptionist-dashboard/patients/add',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: "Today's Appointments",
      value: safeStats.todayAppointments,
      label: 'Scheduled Today',
      icon: CalendarDaysIcon,
      href: '/receptionist-dashboard/appointments',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'New Messages',
      value: safeStats.newMessages,
      label: 'Unread Messages',
      icon: ChatBubbleLeftIcon,
      href: '/receptionist-dashboard/messages',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Upcoming Follow-ups',
      value: safeStats.followUps,
      label: 'This Week',
      icon: ClockIcon,
      href: '/receptionist-dashboard/appointments',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Link key={index} href={card.href}>
          <div className={`${card.bgColor} rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-3xl font-bold ${card.textColor} mb-1`}>
                  {card.value ?? 0}
                </p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
