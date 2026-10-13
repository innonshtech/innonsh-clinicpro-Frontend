'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  Activity,
  Layers,
  FlaskConical,
  TestTube,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { hasLabPermission, LAB_PERMISSIONS } from '@/constants/labRoles';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function LabAnalyticsPage() {
  const [range, setRange] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    kpis: {
      total_orders: 0,
      pending_orders: 0,
      accepted_orders: 0,
      rejected_orders: 0,
      samples_collected_received: 0,
      samples_collected: 0,
      samples_received: 0,
      samples_rejected: 0,
      samples_recollection: 0,
      tests_completed: 0,
      reports_issued: 0,
      critical_results: 0,
      critical_acknowledged: 0
    },
    charts: {
      orders_trend: [],
      reports_trend: [],
      samples_trend: [],
      order_status_distribution: [],
      sample_workflow_distribution: [],
      top_tests: [],
      tests_by_category: [],
      critical_vs_normal: { total: 0, critical: 0, normal: 0, critical_percentage: 0 }
    },
    recent_activity: []
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const headers = getAuthHeaders();
      let url = `${API_BASE_URL}/api/v1/lab/analytics/overview?range=${range}`;
      if (range === 'custom' && customStart && customEnd) {
        url += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }

      let res;
      try {
        res = await axios.get(url, { headers });
      } catch (err) {
        // Fallback to relative path if backend URL is not reachable
        let fallbackUrl = `/api/v1/lab/analytics/overview?range=${range}`;
        if (range === 'custom' && customStart && customEnd) {
          fallbackUrl += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
        }
        res = await axios.get(fallbackUrl, { headers });
      }

      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics data');
      toast.error('Could not load analytics metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchAnalytics();
    }
  }, [range]);

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      toast.error('Please specify both Start Date and End Date');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      toast.error('Start Date cannot be after End Date');
      return;
    }
    setIsCustomOpen(false);
    fetchAnalytics();
  };

  // Compute maximum count for trend bars
  const maxOrderCount = useMemo(() => {
    const counts = (data.charts?.orders_trend || []).map((d) => d.count);
    return Math.max(...counts, 1);
  }, [data.charts?.orders_trend]);

  const maxReportCount = useMemo(() => {
    const counts = (data.charts?.reports_trend || []).map((d) => d.count);
    return Math.max(...counts, 1);
  }, [data.charts?.reports_trend]);

  const maxTestCount = useMemo(() => {
    const counts = (data.charts?.top_tests || []).map((t) => t.count);
    return Math.max(...counts, 1);
  }, [data.charts?.top_tests]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory Analytics</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational KPIs, specimen workflow distribution, and diagnostic performance
              </p>
            </div>
          </div>
        </div>

        {/* Date Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => {
                setRange('today');
                setIsCustomOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === 'today'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setRange('7d');
                setIsCustomOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === '7d'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                setRange('30d');
                setIsCustomOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === '30d'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                setRange('custom');
                setIsCustomOpen(!isCustomOpen);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                range === 'custom'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Popover */}
      {isCustomOpen && range === 'custom' && (
        <form
          onSubmit={handleApplyCustomRange}
          className="bg-white p-4 rounded-2xl border border-teal-200/80 shadow-md flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Start Date:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">End Date:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Apply Range
          </button>
          <button
            type="button"
            onClick={() => setIsCustomOpen(false)}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-7 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse"></div>
            <div className="h-72 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Section 1: 8 Primary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Total Lab Orders</p>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                {data.kpis?.total_orders || 0}
              </p>
              <div className="flex items-center text-[11px] text-slate-500 mt-1">
                <span>In selected range</span>
              </div>
            </div>

            {/* Card 2: Pending Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Pending Orders</p>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2 tracking-tight">
                {data.kpis?.pending_orders || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting accessioning</p>
            </div>

            {/* Card 3: Accepted Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Accepted / Active</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2 tracking-tight">
                {data.kpis?.accepted_orders || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Processing in lab</p>
            </div>

            {/* Card 4: Rejected Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Rejected Orders</p>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-2 tracking-tight">
                {data.kpis?.rejected_orders || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Cancelled / non-viable</p>
            </div>

            {/* Card 5: Samples Collected / Received */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Samples Accessioned</p>
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <TestTube className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                {data.kpis?.samples_collected_received || 0}
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1">
                <span className="text-teal-600 font-semibold">{data.kpis?.samples_received || 0} in lab</span>
                <span>•</span>
                <span>{data.kpis?.samples_collected || 0} transit</span>
              </div>
            </div>

            {/* Card 6: Tests Completed */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Tests Completed</p>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600 mt-2 tracking-tight">
                {data.kpis?.tests_completed || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Validated findings</p>
            </div>

            {/* Card 7: Reports Issued */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Reports Issued</p>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-teal-600 mt-2 tracking-tight">
                {data.kpis?.reports_issued || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Verified diagnostic PDFs</p>
            </div>

            {/* Card 8: Critical Results */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Critical Panic Findings</p>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2 tracking-tight">
                {data.kpis?.critical_results || 0}
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1">
                <span className="text-emerald-600 font-semibold">{data.kpis?.critical_acknowledged || 0} called</span>
                <span>•</span>
                <span>{(data.kpis?.critical_results || 0) - (data.kpis?.critical_acknowledged || 0)} pending</span>
              </div>
            </div>
          </div>

          {/* Section 2: Charts Row 1 (Orders Trend & Order Distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Trend Over Time */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Orders Intake Trend</h3>
                  <p className="text-xs text-slate-500">Daily volume of incoming laboratory orders</p>
                </div>
                <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg">
                  {data.kpis?.total_orders || 0} Total
                </div>
              </div>

              {data.charts?.orders_trend?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="h-44 flex items-end space-x-2 border-b border-slate-100 pb-2">
                    {data.charts.orders_trend.map((item, idx) => {
                      const heightPercent = Math.max((item.count / maxOrderCount) * 100, item.count > 0 ? 12 : 3);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          {/* Tooltip */}
                          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-0.5 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                            {item.label}: {item.count} orders
                          </div>
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-teal-600 to-cyan-500 group-hover:from-teal-700 group-hover:to-cyan-600 transition-all"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                    <span>{data.charts.orders_trend[0]?.label || ''}</span>
                    <span>{data.charts.orders_trend[Math.floor(data.charts.orders_trend.length / 2)]?.label || ''}</span>
                    <span>{data.charts.orders_trend[data.charts.orders_trend.length - 1]?.label || ''}</span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No orders recorded for this period
                </div>
              )}
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order Status Distribution</h3>
                  <p className="text-xs text-slate-500">Breakdown of orders by current workflow status</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              {/* Progress Bar Segmented */}
              <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
                {data.charts?.order_status_distribution?.map((item, idx) => (
                  <div
                    key={idx}
                    className="h-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                    title={`${item.label}: ${item.count} (${item.percentage}%)`}
                  ></div>
                ))}
              </div>

              {/* Distribution rows */}
              <div className="space-y-3 pt-2">
                {data.charts?.order_status_distribution?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 font-medium">{item.percentage}%</span>
                      <span className="font-bold text-slate-900 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Charts Row 2 (Sample Workflow & Tests by Category) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sample Workflow Status Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Specimen Tracking Funnel</h3>
                  <p className="text-xs text-slate-500">Accessioning and sample integrity lifecycle</p>
                </div>
                <div className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[11px] font-semibold rounded-lg">
                  {data.kpis?.samples_collected_received || 0} In Flow
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                {data.charts?.sample_workflow_distribution?.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">
                        {item.count} <span className="font-normal text-slate-400">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tests Performed */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Diagnostic Volume by Test</h3>
                  <p className="text-xs text-slate-500">Most frequently requested laboratory tests</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
              </div>

              {data.charts?.top_tests?.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {data.charts.top_tests.map((test, idx) => {
                    const pct = Math.round((test.count / maxTestCount) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate pr-2">{test.name}</span>
                          <span className="font-bold text-indigo-600 whitespace-nowrap">{test.count} tests</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No diagnostic test data available for this period
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Charts Row 3 (Reports Issued Trend & Critical vs Normal) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports Issued Over Time */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reports Generation Velocity</h3>
                  <p className="text-xs text-slate-500">Final diagnostic reports issued to patients & doctors</p>
                </div>
                <div className="px-2.5 py-1 bg-teal-50 text-teal-700 text-[11px] font-semibold rounded-lg">
                  {data.kpis?.reports_issued || 0} Issued
                </div>
              </div>

              {data.charts?.reports_trend?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="h-44 flex items-end space-x-2 border-b border-slate-100 pb-2">
                    {data.charts.reports_trend.map((item, idx) => {
                      const heightPercent = Math.max((item.count / maxReportCount) * 100, item.count > 0 ? 12 : 3);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-0.5 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                            {item.label}: {item.count} reports
                          </div>
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-teal-500 to-emerald-400 group-hover:from-teal-600 group-hover:to-emerald-500 transition-all"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                    <span>{data.charts.reports_trend[0]?.label || ''}</span>
                    <span>{data.charts.reports_trend[Math.floor(data.charts.reports_trend.length / 2)]?.label || ''}</span>
                    <span>{data.charts.reports_trend[data.charts.reports_trend.length - 1]?.label || ''}</span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  No reports issued in this period
                </div>
              )}
            </div>

            {/* Critical vs Normal Results */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clinical Safety & Critical Findings</h3>
                  <p className="text-xs text-slate-500">Distribution of normal vs panic threshold alerts</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Standard Results</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {data.charts?.critical_vs_normal?.normal || 0}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {data.charts?.critical_vs_normal?.normal_percentage || 0}% of evaluated tests
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-red-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>Critical Panic Findings</span>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {data.charts?.critical_vs_normal?.critical || 0}
                  </p>
                  <p className="text-[11px] text-red-500/80">
                    {data.charts?.critical_vs_normal?.critical_percentage || 0}% panic alert rate
                  </p>
                </div>
              </div>

              {/* Communication SLA Status */}
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span className="text-slate-700">Physician Panic Notifications Acknowledged</span>
                </div>
                <span className="font-bold text-teal-800">
                  {data.kpis?.critical_acknowledged || 0} / {data.kpis?.critical_results || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Recent Lab Workflow Activity Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Workflow Activity</h3>
                <p className="text-xs text-slate-500">De-identified chronological event stream across the laboratory</p>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                Live Audit Feed
              </span>
            </div>

            {data.recent_activity?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recent_activity.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          act.type === 'critical'
                            ? 'bg-red-500'
                            : act.type === 'report'
                            ? 'bg-teal-500'
                            : act.type === 'sample'
                            ? 'bg-cyan-500'
                            : 'bg-blue-500'
                        }`}
                      ></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                No recent activity recorded for this period
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
