'use client';
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function LineChart({ data, color = 'blue' }) {
  const colorMap = {
    red: 'rgb(239, 68, 68)',
    blue: 'rgb(59, 130, 246)',
    green: 'rgb(16, 185, 129)',
    purple: 'rgb(168, 85, 247)'
  }

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Heart Rate',
        data: data.map(item => item.value),
        borderColor: colorMap[color],
        backgroundColor: colorMap[color] + '20',
        tension: 0.3,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    },
    maintainAspectRatio: false
  }

  return <Line data={chartData} options={options} />
}
