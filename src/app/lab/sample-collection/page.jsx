'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  TestTube,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  FlaskConical,
  RefreshCw,
  X,
  QrCode,
  Calendar,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

const SAMPLE_TYPES = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'Swab',
  'Tissue',
  'Other'
];

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function SampleCollectionPage() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');

  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [recentSamples, setRecentSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'history'

  // Collection Modal State
  const [collectingOrder, setCollectingOrder] = useState(null);
  const [collectForm, setCollectForm] = useState({
    sample_type: 'Blood',
    collected_by: '',
    collected_at: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // 1. Fetch eligible accepted orders
      let ordRes;
      try {
        ordRes = await axios.get(`${API_BASE_URL}/api/v1/lab/samples/eligible-orders`, { headers });
      } catch (e) {
        ordRes = await axios.get('/api/v1/lab/samples/eligible-orders', { headers });
      }
      const fetchedOrders = ordRes.data?.data?.orders || ordRes.data?.orders || [];
      setEligibleOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);

      // 2. Fetch recently collected samples
      let smpRes;
      try {
        smpRes = await axios.get(`${API_BASE_URL}/api/v1/lab/samples`, { headers });
      } catch (e) {
        smpRes = await axios.get('/api/v1/lab/samples', { headers });
      }
      const fetchedSamples = smpRes.data?.data?.samples || smpRes.data?.samples || [];
      setRecentSamples(Array.isArray(fetchedSamples) ? fetchedSamples : []);

      // Check if URL specifies an orderId to collect immediately
      if (preselectedOrderId && Array.isArray(fetchedOrders)) {
        const found = fetchedOrders.find(o => o.id === preselectedOrderId);
        if (found) {
          openCollectModal(found);
        }
      }
    } catch (err) {
      console.error('Error fetching sample collection data:', err);
      toast.error(err.response?.data?.message || 'Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedOrderId]);

  // Open modal
  const openCollectModal = (order) => {
    let labUser = null;
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) labUser = JSON.parse(uStr);
    } catch (e) {}

    // Guess sample type from first test if available
    let defaultType = 'Blood';
    if (order.items && order.items.length > 0) {
      const firstItemName = (order.items[0].item_name || '').toLowerCase();
      if (firstItemName.includes('urine')) defaultType = 'Urine';
      else if (firstItemName.includes('stool')) defaultType = 'Stool';
      else if (firstItemName.includes('swab')) defaultType = 'Swab';
      else if (firstItemName.includes('sputum')) defaultType = 'Sputum';
    }

    setCollectingOrder(order);
    setCollectForm({
      sample_type: defaultType,
      collected_by: labUser?.name || 'Lab Phlebotomist',
      collected_at: new Date().toISOString().slice(0, 16),
      notes: ''
    });
  };

  // Submit collection
  const handleSubmitCollection = async (e) => {
    e.preventDefault();
    if (!collectingOrder) return;

    if (!collectForm.sample_type) {
      toast.error('Please specify a sample type');
      return;
    }

    setSubmitting(true);
    const headers = getAuthHeaders();

    const payload = {
      order_id: collectingOrder.id,
      sample_type: collectForm.sample_type,
      collected_by: collectForm.collected_by.trim() || 'Lab Phlebotomist',
      collected_at: collectForm.collected_at ? new Date(collectForm.collected_at).toISOString() : new Date().toISOString(),
      notes: collectForm.notes.trim() || null
    };

    try {
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/samples/collect`, payload, { headers });
      } catch (beErr) {
        res = await axios.post('/api/v1/lab/samples/collect', payload, { headers });
      }

      const createdSample = res.data?.data?.sample || res.data?.sample;
      toast.success(
        `Sample collected successfully! Barcode generated: ${createdSample?.barcode || 'Assigned'}`
      );
      setCollectingOrder(null);
      await fetchData();
    } catch (err) {
      console.error('Error submitting sample collection:', err);
      toast.error(err.response?.data?.message || 'Failed to record sample collection');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return eligibleOrders;
    const q = searchTerm.trim().toLowerCase();
    return eligibleOrders.filter(o => {
      const num = (o.order_number || '').toLowerCase();
      const pName = `${o.patient?.first_name || ''} ${o.patient?.last_name || ''}`.toLowerCase();
      const clinic = (o.clinic?.clinic_name || '').toLowerCase();
      return num.includes(q) || pName.includes(q) || clinic.includes(q);
    });
  }, [eligibleOrders, searchTerm]);

  const filteredSamples = useMemo(() => {
    if (!searchTerm.trim()) return recentSamples;
    const q = searchTerm.trim().toLowerCase();
    return recentSamples.filter(s => {
      const bcode = (s.barcode || '').toLowerCase();
      const oNum = (s.order?.order_number || s.order_number || '').toLowerCase();
      const pName = `${s.order?.patient?.first_name || s.patient_name || ''} ${s.order?.patient?.last_name || ''}`.toLowerCase();
      const sType = (s.sample_type || '').toLowerCase();
      return bcode.includes(q) || oNum.includes(q) || pName.includes(q) || sType.includes(q);
    });
  }, [recentSamples, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <TestTube className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Specimen Intake</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sample Collection</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Log patient specimen collection, assign unique tracking barcodes, and advance diagnostic workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/lab/sample-tracking"
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <span>View Sample Tracking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Search and Navigation Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient name, Order #, or Barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders Ready for Collection ({eligibleOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            <span>Collected Specimens ({recentSamples.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading collection queue...</p>
        </div>
      ) : activeTab === 'orders' ? (
        /* Orders Ready for Collection Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Orders Awaiting Collection</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Orders accepted by your lab will appear here ready for specimen collection.
              </p>
              <Link
                href="/lab/orders"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                <span>Check Incoming Orders</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Order ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Ordering Clinic</th>
                    <th className="py-3.5 px-4">Tests / Package</th>
                    <th className="py-3.5 px-4">Order Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/70">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block text-xs">
                                {order.patient?.first_name} {order.patient?.last_name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {order.patient?.gender ? `${order.patient.gender} • ` : ''}{order.patient?.phone_number || 'Patient'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>{order.clinic?.clinic_name || 'Independent Practice'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
                            <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            id={`btn-collect-${order.id}`}
                            onClick={() => openCollectModal(order)}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <TestTube className="w-3.5 h-3.5" />
                            <span>Collect Sample</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Recently Collected Specimens History */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredSamples.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <TestTube className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Samples Recorded Yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Once samples are collected, barcodes and specimen tracking data will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Barcode / Label</th>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Sample Type</th>
                    <th className="py-3.5 px-4">Collected By</th>
                    <th className="py-3.5 px-4">Collection Date</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSamples.map((sample) => (
                    <tr key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-teal-600" />
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {sample.barcode}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-semibold text-teal-700">
                          {sample.order?.order_number || sample.order_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900 text-xs block">
                          {sample.order?.patient?.first_name || sample.patient_name || 'Patient'} {sample.order?.patient?.last_name || ''}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {sample.sample_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {sample.collected_by || 'Phlebotomist'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(sample.collected_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {sample.collection_status || 'Collected'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Collect Sample Modal */}
      {collectingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <TestTube className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Sample Collection</h2>
                  <span className="text-xs font-mono text-teal-700">
                    Order: {collectingOrder.order_number}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCollectingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCollection} className="p-6 space-y-4 overflow-y-auto">
              {/* Order & Patient Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-semibold text-slate-900">
                  <span>Patient: {collectingOrder.patient?.first_name} {collectingOrder.patient?.last_name}</span>
                  <span className="font-mono text-slate-500">{collectingOrder.patient?.patient_code || ''}</span>
                </div>
                <p className="text-slate-600">
                  Facility: {collectingOrder.clinic?.clinic_name || 'Direct Practice'}
                </p>
                <div className="pt-1 text-[11px] text-teal-700">
                  Tests: {collectingOrder.items?.map(it => it.item_name).join(', ') || 'Diagnostic tests'}
                </div>
              </div>

              {/* Sample Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specimen / Sample Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-sample-type"
                  value={collectForm.sample_type}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, sample_type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  required
                >
                  {SAMPLE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Phlebotomist / Collector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collected By (Phlebotomist / Staff) <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-collected-by"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={collectForm.collected_by}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, collected_by: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Collection Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={collectForm.collected_at}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, collected_at: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Notes / Fasting Status <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting 12 hrs, collected from left arm vein, 5ml vial..."
                  value={collectForm.notes}
                  onChange={(e) => setCollectForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Barcode Notice */}
              <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl flex items-center gap-2.5 text-xs text-teal-800">
                <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                <span>A unique tracking barcode (SMP-YYYYMMDD-XXXX) will be generated automatically upon submission.</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingOrder(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-collection"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Confirm Collection & Generate Barcode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
