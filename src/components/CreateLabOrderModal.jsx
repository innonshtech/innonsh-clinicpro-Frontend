'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import ModalPortal from '@/components/ModalPortal';
import {
  FlaskConical,
  Plus,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  User,
  Trash2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function CreateLabOrderModal({
  isOpen,
  onClose,
  initialPatient = null,
  onOrderCreated,
  clinicId = null
}) {
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState('');

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [labCatalog, setLabCatalog] = useState({ tests: [], packages: [] });
  const [serviceTab, setServiceTab] = useState('tests'); // 'tests' | 'packages'
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [priority, setPriority] = useState('routine');

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Patient resolution
  const patientId = initialPatient?.id || initialPatient?._id || initialPatient?.patient_id || '';
  const patientName = initialPatient?.patient_name || initialPatient?.name ||
    `${initialPatient?.first_name || ''} ${initialPatient?.last_name || ''}`.trim() || 'Inpatient';
  const patientCode = initialPatient?.patient_code || initialPatient?.code || '';
  const patientInfo = initialPatient?.phone_number || initialPatient?.phone || initialPatient?.gender || '';

  // Reset and fetch active labs when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLabId('');
      setPriority('routine');
      setLabCatalog({ tests: [], packages: [] });
      setSelectedItems([]);
      setClinicalNotes('');
      setFormError('');
      setServiceSearch('');
      setServiceTab('tests');
      fetchActiveLabs();
    }
  }, [isOpen]);

  const fetchActiveLabs = async () => {
    try {
      setLoadingLabs(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/active`, { headers });
      } catch (e) {
        res = await axios.get('/api/v1/lab/active', { headers });
      }
      const list = res.data?.data?.labs || res.data?.labs || [];
      setLabs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Error fetching active laboratories:', err);
      setLabs([]);
    } finally {
      setLoadingLabs(false);
    }
  };

  const fetchCatalogForLab = async (labId) => {
    if (!labId) {
      setLabCatalog({ tests: [], packages: [] });
      return;
    }
    try {
      setLoadingCatalog(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/catalog?labId=${labId}`, { headers });
      } catch (e) {
        res = await axios.get(`/api/v1/lab/catalog?labId=${labId}`, { headers });
      }
      const data = res.data?.data || res.data || { tests: [], packages: [] };
      setLabCatalog({
        tests: Array.isArray(data.tests) ? data.tests : [],
        packages: Array.isArray(data.packages) ? data.packages : []
      });
    } catch (err) {
      console.error('Error fetching lab catalog:', err);
      toast.error('Failed to load tests and packages for selected laboratory');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleLabChange = (e) => {
    const labId = e.target.value;
    setSelectedLabId(labId);
    setSelectedItems([]);
    if (labId) {
      fetchCatalogForLab(labId);
    } else {
      setLabCatalog({ tests: [], packages: [] });
    }
  };

  const availableServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (serviceTab === 'tests') {
      const selectedTestIds = new Set(
        selectedItems.filter((i) => i.item_type === 'test').map((i) => i.test_id)
      );
      return (labCatalog.tests || [])
        .filter((t) => !selectedTestIds.has(t.id))
        .filter((t) => {
          if (!q) return true;
          return (
            (t.test_name || '').toLowerCase().includes(q) ||
            (t.test_code || '').toLowerCase().includes(q) ||
            (t.department || '').toLowerCase().includes(q)
          );
        });
    } else {
      const selectedPkgIds = new Set(
        selectedItems.filter((i) => i.item_type === 'package').map((i) => i.package_id)
      );
      return (labCatalog.packages || [])
        .filter((p) => !selectedPkgIds.has(p.id))
        .filter((p) => {
          if (!q) return true;
          return (
            (p.package_name || '').toLowerCase().includes(q) ||
            (p.package_code || '').toLowerCase().includes(q)
          );
        });
    }
  }, [labCatalog, serviceTab, serviceSearch, selectedItems]);

  const handleAddItem = (item, type) => {
    if (type === 'test') {
      setSelectedItems((prev) => [
        ...prev,
        {
          item_type: 'test',
          test_id: item.id,
          package_id: null,
          item_name: item.test_name,
          item_code: item.test_code,
          price: Number(item.price) || 0
        }
      ]);
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          item_type: 'package',
          test_id: null,
          package_id: item.id,
          item_name: item.package_name,
          item_code: item.package_code,
          price: Number(item.package_price) || 0
        }
      ]);
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const orderTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedItems]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!patientId) {
      setFormError('Patient context is required for lab order creation.');
      return;
    }
    if (!selectedLabId) {
      setFormError('Please select a destination laboratory.');
      return;
    }
    if (selectedItems.length === 0) {
      setFormError('Please select at least one diagnostic test or package.');
      return;
    }

    setIsSubmitting(true);
    const headers = getAuthHeaders();

    const payload = {
      patient_id: patientId,
      lab_id: selectedLabId,
      priority,
      clinical_notes: clinicalNotes.trim() || null,
      items: selectedItems.map((i) => ({
        item_type: i.item_type,
        test_id: i.test_id || undefined,
        package_id: i.package_id || undefined
      }))
    };

    try {
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/v1/lab/orders`, payload, { headers });
      } catch (beErr) {
        res = await axios.post('/api/v1/lab/orders', payload, { headers });
      }

      const created = res.data?.data?.order || res.data?.order;
      toast.success(`Lab order ${created?.order_number || ''} created successfully!`);
      if (onOrderCreated) {
        onOrderCreated(created);
      }
      onClose();
    } catch (err) {
      console.error('Error creating lab order:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create lab order';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Inpatient Lab Requisition</h2>
              <p className="text-xs text-slate-500">
                Order diagnostic tests and pathology investigations for this admitted patient.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreateOrder} className="overflow-y-auto p-6 space-y-5 flex-1">
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Cannot create lab requisition</span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Step 1: Locked Inpatient Context */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Inpatient Context <span className="text-xs text-teal-600 font-normal">(Locked to Admission)</span>
            </label>
            <div className="flex items-center justify-between p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    {patientName}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {patientCode ? `${patientCode} • ` : ''}
                    {patientInfo || 'Admitted Inpatient'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-200/60 text-teal-800 rounded border border-teal-300">
                Current Inpatient
              </span>
            </div>
          </div>

          {/* Step 2: Laboratory Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Select Destination Laboratory <span className="text-red-500">*</span>
            </label>
            <select
              id="select-inpatient-lab"
              value={selectedLabId}
              onChange={handleLabChange}
              disabled={loadingLabs || isSubmitting}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 text-slate-800 disabled:opacity-60"
            >
              {loadingLabs ? (
                <option value="">Loading active laboratories...</option>
              ) : labs.length === 0 ? (
                <option value="" disabled>No active laboratories available</option>
              ) : (
                <option value="">-- Choose Diagnostic Lab --</option>
              )}
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lab_name} {l.city ? `• ${l.city}` : ''}
                </option>
              ))}
            </select>
            {loadingLabs ? (
              <p className="text-[11px] text-teal-600 mt-1 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin inline" /> Loading laboratories...
              </p>
            ) : labs.length === 0 ? (
              <p className="text-[11px] text-amber-600 mt-1">
                No active laboratories available.
              </p>
            ) : !selectedLabId ? (
              <p className="text-[11px] text-slate-400 mt-1">
                Select a lab to view available tests and packages.
              </p>
            ) : null}
          </div>

          {/* Step 3: Diagnostic Services (Tests / Packages) */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                3. Select Diagnostic Tests & Packages <span className="text-red-500">*</span>
              </label>

              {/* Service Tabs */}
              {selectedLabId && (
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setServiceTab('tests')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      serviceTab === 'tests' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Individual Tests ({labCatalog.tests?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTab('packages')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      serviceTab === 'packages' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Packages ({labCatalog.packages?.length || 0})
                  </button>
                </div>
              )}
            </div>

            {!selectedLabId ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                <p className="text-xs text-slate-500">
                  Select a destination laboratory above to view available tests and packages.
                </p>
              </div>
            ) : (
              <>
                {/* Search Services */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${serviceTab === 'tests' ? 'tests by name or code' : 'health packages'}...`}
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>

                {/* Available Services List */}
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/60 divide-y divide-slate-100">
                  {loadingCatalog ? (
                    <div className="p-3 text-center text-xs text-slate-500">Loading lab services...</div>
                  ) : availableServices.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {serviceSearch
                        ? 'No matching services found'
                        : serviceTab === 'tests'
                        ? 'No active tests available for this laboratory'
                        : 'No active packages available for this laboratory'}
                    </div>
                  ) : (
                    availableServices.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 px-3 flex items-center justify-between hover:bg-teal-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {item.test_code || item.package_code}
                          </span>
                          <span className="text-xs font-medium text-slate-800">
                            {item.test_name || item.package_name}
                          </span>
                          {item.department && (
                            <span className="text-[11px] text-slate-400">({item.department})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-700">
                            ₹{item.price || item.package_price}
                          </span>
                          <button
                            type="button"
                            id={`btn-add-item-${item.id}`}
                            onClick={() => handleAddItem(item, serviceTab === 'tests' ? 'test' : 'package')}
                            className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Items List */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Selected Order Items ({selectedItems.length})</span>
                    <span className="text-teal-700 font-bold text-xs">
                      Total: ₹{orderTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 italic">
                      No tests or packages added yet. Pick from the list above.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                              {item.item_code}
                            </span>
                            <span className="font-medium text-slate-900">{item.item_name}</span>
                            <span className="text-[10px] text-slate-400 uppercase">({item.item_type})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Step 4: Order Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Order Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="select-inpatient-order-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 text-slate-800"
            >
              <option value="routine">Routine — Standard processing</option>
              <option value="urgent">Urgent — Requires expedited processing</option>
              <option value="critical">Critical / STAT — Requires immediate priority according to clinic workflow</option>
            </select>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
              {priority === 'critical' ? (
                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-medium">
                  Critical / STAT: Immediate priority at collection and bench processing.
                </span>
              ) : priority === 'urgent' ? (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                  Urgent: Expedited turnaround ahead of standard queue.
                </span>
              ) : (
                <span className="text-slate-500">
                  Routine: Standard processing within standard turnaround timelines.
                </span>
              )}
            </div>
          </div>

          {/* Step 5: Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. Clinical Notes / Specimen Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Bedside collection, urgent fasting sample, patient admitted in ward..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Order Summary Card */}
          {selectedItems.length > 0 && (
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-600 block">Total Requisition Tariff</span>
                <span className="text-xs text-slate-400">
                  {selectedItems.length} diagnostic {selectedItems.length === 1 ? 'investigation' : 'investigations'} selected
                </span>
              </div>
              <div className="text-xl font-bold text-teal-950">
                ₹{orderTotal.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-submit-inpatient-lab-order"
            onClick={handleCreateOrder}
            disabled={isSubmitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isSubmitting ? 'Creating Requisition...' : 'Submit Lab Requisition'}</span>
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
