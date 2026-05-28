// components/dashboard/StatsCards.jsx
import { Users, Calendar, MessageSquare, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';

const stats = [
  {
    title: 'Total Patients',
    value: '1,234',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Today\'s Appointments',
    value: '28',
    change: '+5%',
    trend: 'up',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'Pending Messages',
    value: '15',
    change: '-8%',
    trend: 'down',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    title: 'Monthly Revenue',
    value: '₹24,567',
    change: '+18%',
    trend: 'up',
    icon: IndianRupee,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  }
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <TrendIcon className={`w-4 h-4 mr-1 ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                from last month
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
