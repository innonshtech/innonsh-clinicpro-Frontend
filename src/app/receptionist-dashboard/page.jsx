'use client';
import React from 'react';
import DashboardStats from './components/DashboardStats';
import DashboardQuickActions from './components/DashboardQuickActions';
import TodaysAppointments from './components/TodaysPatients';
import FollowUpMonitor from './components/FollowUpMonitor';
import DoctorStatusRoster from './components/DoctorStatusRoster';

export default function RestructuredDashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage patients, doctors, and daily appointments.</p>
        </div>
      </div>

      {/* 1. Performance Metrics */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Performance Metrics</h2>
        <DashboardStats />
      </section>

      {/* 2. Quick Action Operations (Add Patient, Appt, Bill) */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Fast Track Operations</h2>
        <DashboardQuickActions />
      </section>

      {/* 3. Main Operational Monitor (Unified Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Today's Full Schedule (Primary) */}
        <div className="xl:col-span-12">
          <TodaysAppointments />
        </div>

        {/* Doctor Roster & Follow-up split */}
        <div className="xl:col-span-8">
          <DoctorStatusRoster />
        </div>

        <div className="xl:col-span-4">
          <FollowUpMonitor />
        </div>

      </div>

    </div>
  );
}

