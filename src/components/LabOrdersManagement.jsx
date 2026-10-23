'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ModalPortal from '@/components/ModalPortal';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  FlaskConical,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  RefreshCw,
  AlertCircle,
  User,
  Building2,
  Calendar,
  Package,
  Trash2,
  Filter,
  Check,
  Stethoscope,
  UserCheck,
  Radio,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

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

const getCreatorInfo = (order) => {
  if (!order) return { name: 'Unknown', role: 'N/A' };
  if (order.doctor_name || order.doctorName) {
    const name = order.doctor_name || order.doctorName;
    return {
      name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
      role: 'Doctor'
    };
  }
  const type = (order.ordering_type || '').toLowerCase();
  if (type === 'receptionist' || order.receptionist) {
    const recName = typeof order.receptionist === 'object' && order.receptionist
      ? `${order.receptionist.first_name || ''} ${order.receptionist.last_name || ''}`.trim()
      : (typeof order.receptionist === 'string' ? order.receptionist : 'Receptionist');
    return {
      name: recName || 'Receptionist',
      role: 'Receptionist'
    };
  }
  if (type === 'doctor' || order.doctor) {
    const docFirstLast = typeof order.doctor === 'object' && order.doctor
      ? `${order.doctor.first_name || ''} ${order.doctor.last_name || ''}`.trim()
      : (typeof order.doctor === 'string' ? order.doctor : '');
    const name = docFirstLast ? (docFirstLast.startsWith('Dr.') ? docFirstLast : `Dr. ${docFirstLast}`) : (order.doctor_name || order.doctorName || 'Dr. Doctor');
    return {
      name,
      role: 'Doctor'
    };
  }
  return {
    name: order.created_by_user?.name || order.clinic?.clinic_name || 'Clinic Staff',
    role: 'Staff'
  };
};

const PRIORITY_RANK = {
  critical: 3,
  stat: 3,
  urgent: 2,
  routine: 1
};

export const getPriorityRank = (p) => PRIORITY_RANK[(p || 'routine').toLowerCase()] || 1;

export const getPriorityBadge = (priority) => {
  const p = (priority || 'routine').toLowerCase();
  switch (p) {
    case 'critical':
    case 'stat':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
          Critical / STAT
        </span>
      );
    case 'urgent':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Urgent
        </span>
      );
    case 'routine':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Routine
        </span>
      );
  }
};


const OPD_RADIOLOGY_PRESETS = {
  'X-Ray': [
    { name: 'Chest X-Ray PA View', price: 600 },
    { name: 'Chest AP (Bedside Portable)', price: 750 },
    { name: 'Abdomen Erect & Supine', price: 800 },
    { name: 'Left Knee AP/Lateral', price: 600 },
    { name: 'Right Knee AP/Lateral', price: 600 },
    { name: 'Lumbar Spine AP/Lateral', price: 700 }
  ],
  'CT Scan': [
    { name: 'HRCT Chest Non-Contrast', price: 3500 },
    { name: 'NCCT Head / Brain', price: 2800 },
    { name: 'CECT Whole Abdomen', price: 5000 },
    { name: 'CT Cervical Spine', price: 3200 }
  ],
  'Ultrasound': [
    { name: 'USG Whole Abdomen & Pelvis', price: 1500 },
    { name: 'USG KUB (Kidney, Ureter, Bladder)', price: 1200 },
    { name: 'USG Thyroid / Neck', price: 1400 },
    { name: 'Venous Doppler Lower Limb', price: 2500 }
  ],
  'MRI': [
    { name: 'MRI Brain Non-Contrast', price: 6000 },
    { name: 'MRI Lumbar Spine', price: 6500 },
    { name: 'MRI Cervical Spine', price: 6500 },
    { name: 'MRI Knee Joint', price: 5500 }
  ]
};

export default function LabOrdersManagement({ userRole = 'doctor', roleTitle = 'Doctor' }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Form State
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(false);

  // Selected Lab's diagnostic services
  const [selectedLabId, setSelectedLabId] = useState('');
  const [labCatalog, setLabCatalog] = useState({ tests: [], packages: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Order Form Data
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  const [selectedItems, setSelectedItems] = useState([]); // [{ item_type: 'test'|'package', test_id/package_id, item_name, item_code, price }]
  const [priority, setPriority] = useState('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [serviceTab, setServiceTab] = useState('tests'); // 'tests' | 'packages' | 'radiology'
  const [serviceSearch, setServiceSearch] = useState('');
  const [radModality, setRadModality] = useState('X-Ray');
  const [radStudyName, setRadStudyName] = useState('');
  const [radIndication, setRadIndication] = useState('');
  const [radInstructions, setRadInstructions] = useState('');
  const [radPrice, setRadPrice] = useState('600');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState('');

  // Close patient dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPatientId = (p) => p?._id || p?.id || p?.patientId || '';
  const getPatientName = (p) => {
    if (!p) return '';
    const first = p.firstName || p.first_name || '';
    const last = p.lastName || p.last_name || '';
    return `${first} ${last}`.trim() || 'Patient';
  };
  const getPatientCode = (p) => p?.patientCode || p?.patient_code || '';
  const getPatientPhone = (p) => p?.phoneNumber || p?.phone_number || '';

  const selectedPatient = useMemo(() => {
    return patients.find((p) => getPatientId(p) === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Fetch Own Orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      setError('');
      const headers = getAuthHeaders();

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/orders`, { headers });
      } catch (beErr) {
        res = await axios.get('/api/v1/lab/orders', { headers });
      }

      const fetched = res.data?.data?.orders || res.data?.orders || [];
      setOrders(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching lab orders:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load lab orders';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Patients
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/patient/list?limit=1000`, { headers });
      } catch (e) {
        res = await axios.get('/api/v1/patient/list?limit=1000', { headers });
      }
      const pList = res.data?.data?.patients || res.data?.patients || [];
      setPatients(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.warn('Error fetching patients for order form:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch Active Labs
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
      const lList = res.data?.data?.labs || res.data?.labs || [];
      setLabs(Array.isArray(lList) ? lList : []);
    } catch (err) {
      console.warn('Error fetching active labs:', err);
    } finally {
      setLoadingLabs(false);
    }
  };

  // Fetch Catalog for Selected Lab
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const openCreateModal = () => {
    if (userRole === 'clinic') return;
    setSelectedPatientId('');
    setPatientSearchQuery('');
    setIsPatientDropdownOpen(false);
    setSelectedLabId('');
    setPriority('routine');
    setLabCatalog({ tests: [], packages: [] });
    setSelectedItems([]);
    setClinicalNotes('');
    setFormError('');
    setCreateModalOpen(true);
    fetchPatients();
    fetchActiveLabs();
  };

  const handleLabChange = (e) => {
    const labId = e.target.value;
    setSelectedLabId(labId);
    setSelectedItems([]); // Clear previously selected items if lab changes
    if (labId) {
      fetchCatalogForLab(labId);
    } else {
      setLabCatalog({ tests: [], packages: [] });
    }
  };

  // Filtered Patients for searchable selector
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.trim().toLowerCase();
    const qVariants = [q, q.replace(/w/g, 'v'), q.replace(/v/g, 'w')];
    const words = q.split(/\s+/).filter(Boolean);

    return patients.filter((p) => {
      const fullName = getPatientName(p).toLowerCase();
      const code = getPatientCode(p).toLowerCase();
      const phone = getPatientPhone(p).replace(/\s+/g, '');
      const cleanQ = q.replace(/\s+/g, '');

      if (qVariants.some((v) => fullName.includes(v) || code.includes(v))) return true;
      if (phone.includes(cleanQ)) return true;

      return words.every((word) => {
        const wVariants = [word, word.replace(/w/g, 'v'), word.replace(/v/g, 'w')];
        return wVariants.some((wv) => fullName.includes(wv) || code.includes(wv) || phone.includes(wv));
      });
    });
  }, [patients, patientSearchQuery]);

  // Filtered Services to add
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

  // Add Item to Order
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

  // Order Total Calculation
  const orderTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [selectedItems]);

  // Submit Create Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!selectedLabId) {
      setFormError('Please select a destination laboratory.');
      return;
    }

    let currentSelectedItems = [...selectedItems];
    if (currentSelectedItems.length === 0 && serviceTab === 'radiology' && radStudyName.trim()) {
      const ind = radIndication.trim() || clinicalNotes.trim();
      if (!ind || ind.length < 3) {
        setFormError('Clinical indication is mandatory for radiology (minimum 3 characters).');
        return;
      }
      const priceNum = Number(radPrice) || 0;
      const code = `RAD-${radModality.replace(/\s+/g, '').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
      currentSelectedItems.push({
        item_type: 'radiology',
        test_id: `rad-${Date.now()}`,
        package_id: null,
        item_name: `${radModality}: ${radStudyName.trim()}`,
        item_code: code,
        modality: radModality,
        study_name: radStudyName.trim(),
        clinical_indication: ind,
        instructions: radInstructions.trim(),
        price: priceNum
      });
      setSelectedItems(currentSelectedItems);
    }

    if (currentSelectedItems.length === 0) {
      setFormError('Please select at least one diagnostic test, package, or radiology study.');
      return;
    }

    // Validate radiology items clinical indication
    for (const item of currentSelectedItems) {
      if (item.item_type === 'radiology' && (!item.clinical_indication || item.clinical_indication.trim().length < 3)) {
        setFormError('A clinical indication (minimum 3 characters) is required for each radiology investigation.');
        return;
      }
    }

    setSubmittingOrder(true);
    const headers = getAuthHeaders();

    const payload = {
      patient_id: selectedPatientId,
      lab_id: selectedLabId,
      priority,
      clinical_notes: clinicalNotes.trim() || null,
      items: currentSelectedItems.map((i) => ({
        item_type: i.item_type,
        test_id: i.test_id || undefined,
        package_id: i.package_id || undefined,
        item_name: i.item_name || undefined,
        item_code: i.item_code || undefined,
        modality: i.modality || undefined,
        study_name: i.study_name || undefined,
        clinical_indication: i.clinical_indication || undefined,
        instructions: i.instructions || undefined,
        price: i.price !== undefined ? Number(i.price) : undefined
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
      setCreateModalOpen(false);
      await fetchOrders();
    } catch (err) {
      console.error('Error creating lab order:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create lab order';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filter & Search Logic for Order List
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      if (statusFilter !== 'all' && (o.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const num = (o.order_number || '').toLowerCase();
        const pName = `${o.patient?.first_name || ''} ${o.patient?.last_name || ''}`.toLowerCase();
        const lName = (o.lab?.lab_name || '').toLowerCase();
        const docName = `${o.doctor?.first_name || ''} ${o.doctor?.last_name || ''}`.toLowerCase();
        const recName = `${o.receptionist?.first_name || ''} ${o.receptionist?.last_name || ''}`.toLowerCase();
        const prio = (o.priority || 'routine').toLowerCase();
        if (!num.includes(q) && !pName.includes(q) && !lName.includes(q) && !docName.includes(q) && !recName.includes(q) && !prio.includes(q)) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
    });
  }, [orders, statusFilter, searchTerm]);

  // Tab counts
  const counts = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => (o.status || 'pending').toLowerCase() === 'pending').length;
    const accepted = orders.filter((o) => (o.status || '').toLowerCase() === 'accepted').length;
    const rejected = orders.filter((o) => (o.status || '').toLowerCase() === 'rejected').length;
    return { total, pending, accepted, rejected };
  }, [orders]);

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-spin"></span>
            In Progress
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <Toaster position="top-right" />

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <FlaskConical className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">{roleTitle} Diagnostic Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {userRole === 'clinic'
              ? 'View and monitor diagnostic lab orders requested by doctors and receptionists for your clinic.'
              : 'Order diagnostic tests & health packages from registered laboratories for your patients.'}
          </p>
        </div>

        {userRole !== 'clinic' && (
          <button
            id="btn-create-lab-order"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lab Order</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-doctor-orders"
              type="text"
              placeholder="Search by Order #, Patient name, or Lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
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

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Orders</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Pending</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800">
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Accepted</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800">
                {counts.accepted}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-red-50 text-red-700 border border-red-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Rejected</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800">
                {counts.rejected}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingOrders ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading lab orders...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Error Loading Orders</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FlaskConical className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No lab orders found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No orders match your filter criteria. Try clearing search filters.'
                : userRole === 'clinic'
                ? 'No diagnostic orders have been created by doctors or receptionists yet.'
                : 'You have not created any diagnostic orders yet.'}
            </p>
            {userRole !== 'clinic' && (
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Order</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100/90 text-slate-900 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6 text-slate-900 font-bold">Order ID</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Priority</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Patient</th>
                  {userRole === 'clinic' && <th className="py-3.5 px-4 text-slate-900 font-bold">Created By</th>}
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Destination Lab</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Order Date</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Items Summary</th>
                  <th className="py-3.5 px-4 text-slate-900 font-bold">Status</th>
                  {userRole !== 'doctor' && userRole !== 'clinic' && userRole !== 'receptionist' && (
                    <th className="py-3.5 px-4 text-right text-slate-900 font-bold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                  const creator = getCreatorInfo(order);
                  const orderKey = order.id || order._id || order.order_number;

                  return (
                    <tr
                      key={orderKey}
                      onClick={() => setViewingOrder(order)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 sm:px-6 font-medium">
                        <button
                          type="button"
                          id={`btn-order-${orderKey}`}
                          data-testid={`btn-order-${order.order_number || order.orderNumber || order.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingOrder(order);
                          }}
                          className="font-mono text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-900 px-2.5 py-1 rounded-md border border-teal-200/70 inline-block transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-teal-500"
                          title="Click to view order details"
                        >
                          {order.order_number || order.orderNumber || (order.id ? 'RAD-' + String(order.id).slice(0, 8) : 'View Order')}
                        </button>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {getPriorityBadge(order.priority)}
                      </td>

                      <td className="py-4 px-4">
                        {userRole === 'clinic' ? (
                          <div>
                            <span className="font-semibold text-slate-900 block text-xs">
                              {order.patient?.first_name} {order.patient?.last_name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block text-xs">
                                {order.patient?.first_name} {order.patient?.last_name}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Created By & Role (Specifically for Clinic history) */}
                      {userRole === 'clinic' && (
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              creator.role === 'Doctor' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {creator.role === 'Doctor' ? (
                                <Stethoscope className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold text-slate-900 block truncate max-w-[140px]" title={creator.name}>
                                {creator.name}
                              </span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border leading-none ${
                                creator.role === 'Doctor'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                                  : 'bg-purple-50 text-purple-700 border-purple-200/60'
                              }`}>
                                {creator.role}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="py-4 px-4">
                        {userRole === 'clinic' ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-900 block">
                              {order.lab?.lab_name || 'Laboratory'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {order.lab?.city || 'Facility'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                              <FlaskConical className="w-3 h-3" />
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-slate-900 block">
                                {order.lab?.lab_name || 'Laboratory'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {order.lab?.city || 'Facility'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-xs">
                            {itemCount} {itemCount === 1 ? 'Service' : 'Services'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {(order.items || []).slice(0, 2).map((it, idx) => (
                              <span
                                key={it.id || idx}
                                className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded border border-slate-200 truncate max-w-[130px]"
                                title={it.item_name}
                              >
                                {it.item_name}
                              </span>
                            ))}
                            {itemCount > 2 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded font-medium">
                                +{itemCount - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(order.status)}</td>

                      {userRole !== 'doctor' && userRole !== 'clinic' && userRole !== 'receptionist' && (
                        <td className="py-4 px-4 text-right">
                          <button
                            id={`btn-view-${orderKey}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrder(order);
                            }}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. CREATE LAB ORDER MODAL                                 */}
      {/* ========================================================= */}
      <ModalPortal isOpen={createModalOpen && userRole !== 'clinic'} onClose={() => setCreateModalOpen(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Lab Order</h2>
                  <p className="text-xs text-slate-500">
                    Select a patient, assign a laboratory, and pick required diagnostic tests or packages.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                    <span className="font-semibold block">Cannot create order</span>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              {/* Step 1: Patient Selection (Single Searchable Selector) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Select Patient <span className="text-red-500">*</span>
                </label>

                {selectedPatient ? (
                  /* Selected Patient Card */
                  <div className="flex items-center justify-between p-3 bg-teal-50/70 border border-teal-200 rounded-xl transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {getPatientName(selectedPatient)}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {getPatientCode(selectedPatient) ? `${getPatientCode(selectedPatient)} • ` : ''}
                          {getPatientPhone(selectedPatient) || selectedPatient.gender || 'Patient'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-change-patient"
                      onClick={() => {
                        setSelectedPatientId('');
                        setPatientSearchQuery('');
                        setIsPatientDropdownOpen(true);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold px-2.5 py-1.5 hover:bg-teal-100/60 rounded-lg transition-colors shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Single Searchable Patient Input */
                  <div className="relative" ref={patientDropdownRef}>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="input-patient-search"
                        type="text"
                        placeholder="Search or select patient..."
                        value={patientSearchQuery}
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value);
                          setIsPatientDropdownOpen(true);
                        }}
                        onFocus={() => setIsPatientDropdownOpen(true)}
                        className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white text-slate-800 transition-colors shadow-xs"
                      />
                      {patientSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPatientSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isPatientDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                        {loadingPatients ? (
                          <div className="p-3 text-center text-xs text-slate-500">Loading patients...</div>
                        ) : filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            {patientSearchQuery
                              ? `No patients found matching "${patientSearchQuery}"`
                              : 'No patients available'}
                          </div>
                        ) : (
                          filteredPatients.map((p) => {
                            const pid = getPatientId(p);
                            const pName = getPatientName(p);
                            const pCode = getPatientCode(p);
                            const pPhone = getPatientPhone(p);

                            return (
                              <div
                                key={pid}
                                id={`patient-option-${pid}`}
                                onClick={() => {
                                  setSelectedPatientId(pid);
                                  setIsPatientDropdownOpen(false);
                                  setPatientSearchQuery('');
                                  if (formError === 'Please select a patient.') {
                                    setFormError('');
                                  }
                                }}
                                className="p-2.5 px-3.5 hover:bg-teal-50/60 cursor-pointer transition-colors flex items-center justify-between group"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-900 block truncate">
                                    {pName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block truncate">
                                    {pCode ? `${pCode} • ` : ''}
                                    {pPhone || p.gender || ''}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                  Select
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Laboratory Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Select Destination Laboratory <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-lab"
                  value={selectedLabId}
                  onChange={handleLabChange}
                  disabled={loadingLabs}
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
                    Select a lab to view its available diagnostic catalog and pricing.
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
                        id="tab-btn-catalog-tests"
                        onClick={() => setServiceTab('tests')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          serviceTab === 'tests' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Individual Tests ({labCatalog.tests?.length || 0})
                      </button>
                      <button
                        type="button"
                        id="tab-btn-catalog-packages"
                        onClick={() => setServiceTab('packages')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          serviceTab === 'packages' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Packages ({labCatalog.packages?.length || 0})
                      </button>
                      <button
                        type="button"
                        id="tab-btn-catalog-radiology"
                        onClick={() => setServiceTab('radiology')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                          serviceTab === 'radiology' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Radiology / Imaging</span>
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
                    {/* Radiology / Imaging Ordering Section */}
                    {serviceTab === 'radiology' ? (
                      <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-sky-950 flex items-center gap-2">
                            <Radio className="w-4 h-4 text-sky-600" />
                            Order Radiology Investigation
                          </h4>
                          <span className="text-[11px] text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                            Destination: {labs.find(l => (l.id === selectedLabId || l._id === selectedLabId))?.lab_name || 'Selected Facility'}
                          </span>
                        </div>

                        {/* Modality selector buttons */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Imaging Modality</label>
                          <div className="grid grid-cols-4 gap-2">
                            {['X-Ray', 'CT Scan', 'Ultrasound', 'MRI'].map((mod) => (
                              <button
                                key={mod}
                                type="button"
                                onClick={() => {
                                  setRadModality(mod);
                                  const firstPreset = OPD_RADIOLOGY_PRESETS[mod]?.[0];
                                  if (firstPreset) {
                                    setRadStudyName(firstPreset.name);
                                    setRadPrice(String(firstPreset.price));
                                  }
                                }}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                                  radModality === mod
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {mod}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Presets */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Common Protocols</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(OPD_RADIOLOGY_PRESETS[radModality] || []).map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setRadStudyName(preset.name);
                                  setRadPrice(String(preset.price));
                                }}
                                className="px-2 py-1 bg-white hover:bg-sky-100 hover:text-sky-800 border border-slate-200 rounded text-[11px] text-slate-700 transition-colors"
                              >
                                {preset.name} (₹{preset.price})
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Inputs: Study Name, Indication, Instructions, Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Investigation / Study Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="input-opd-study-name"
                              placeholder="e.g. Chest X-Ray PA View"
                              value={radStudyName}
                              onChange={(e) => setRadStudyName(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Clinical Indication <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="input-opd-clinical-indication"
                              placeholder="e.g. Chronic cough and fever; evaluate for infiltrate"
                              value={radIndication}
                              onChange={(e) => setRadIndication(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Specific Instructions (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Patient requires lead apron; fasting 4 hrs"
                              value={radInstructions}
                              onChange={(e) => setRadInstructions(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Estimated Tariff / Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="600"
                              value={radPrice}
                              onChange={(e) => setRadPrice(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            id="btn-add-opd-radiology-item"
                            onClick={() => {
                              if (!radStudyName.trim()) {
                                toast.error('Study name is required.');
                                return;
                              }
                              const ind = radIndication.trim() || clinicalNotes.trim();
                              if (!ind || ind.length < 3) {
                                toast.error('Clinical indication is mandatory (min 3 characters).');
                                return;
                              }
                              const priceNum = Number(radPrice) || 0;
                              const code = `RAD-${radModality.replace(/\s+/g, '').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
                              setSelectedItems((prev) => [
                                ...prev,
                                {
                                  item_type: 'radiology',
                                  test_id: `rad-${Date.now()}`,
                                  package_id: null,
                                  item_name: `${radModality}: ${radStudyName.trim()}`,
                                  item_code: code,
                                  modality: radModality,
                                  study_name: radStudyName.trim(),
                                  clinical_indication: ind,
                                  instructions: radInstructions.trim(),
                                  price: priceNum
                                }
                              ]);
                              toast.success(`Added ${radModality}: ${radStudyName.trim()} to order items`);
                              setRadStudyName('');
                              setRadIndication('');
                              setRadInstructions('');
                            }}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Radiology Investigation</span>
                          </button>
                        </div>
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

                      </>
                    )}

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
                  id="select-order-priority"
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
                      Critical / STAT: Immediate priority handling at collection and laboratory bench.
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
                  5. Clinical Notes / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting sample required, routine health checkup, or relevant patient history..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Order Summary Card */}
              {selectedItems.length > 0 && (
                <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 block">Order Total Amount</span>
                    <span className="text-xs text-slate-400">
                      Includes {selectedItems.length} selected diagnostic {selectedItems.length === 1 ? 'item' : 'items'}
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
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-submit-order"
                onClick={handleCreateOrder}
                disabled={submittingOrder}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingOrder && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>Submit Order</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ========================================================= */}
      {/* 5. VIEW ORDER DETAILS MODAL                               */}
      {/* ========================================================= */}
      {viewingOrder && (
        <ModalPortal isOpen={Boolean(viewingOrder)} onClose={() => setViewingOrder(null)}>
        <div 
          onClick={() => setViewingOrder(null)}
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Order Details</h2>
                  <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {viewingOrder?.order_number || viewingOrder?.orderNumber || (viewingOrder?.id ? 'RAD-' + String(viewingOrder.id).slice(0, 8) : 'Order Details')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingOrder && (
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="flex items-center justify-between p-4 bg-teal-50/70 border border-teal-200/70 rounded-xl">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Order Status</div>
                    <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Order Priority</div>
                    <div className="mt-1">{getPriorityBadge(viewingOrder.priority)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-teal-800 font-medium">Total Amount</div>
                    <div className="text-xl font-extrabold text-teal-950">
                      ₹{Number(viewingOrder.total_amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Patient
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {(viewingOrder.patient && (viewingOrder.patient.first_name || viewingOrder.patient.last_name))
                        ? `${viewingOrder.patient.first_name || ''} ${viewingOrder.patient.last_name || ''}`.trim()
                        : (viewingOrder.patient_name || viewingOrder.patientName || (typeof viewingOrder.patient === 'string' ? viewingOrder.patient : 'Patient'))}
                    </p>
                    {(viewingOrder.patient?.patient_code || viewingOrder.patient?.id || viewingOrder.patient_code || viewingOrder.patientCode || viewingOrder.admission_number || viewingOrder.admission_id) && (
                      <p className="text-slate-600 mt-1">
                        {viewingOrder.admission_number || viewingOrder.admission_id ? 'Admission #:' : 'Patient ID:'} <span className="font-mono">{viewingOrder.patient?.patient_code || viewingOrder.patient?.id || viewingOrder.patient_code || viewingOrder.patientCode || viewingOrder.admission_number || viewingOrder.admission_id}</span>
                      </p>
                    )}
                    <p className="text-slate-600 mt-0.5">
                      Phone: {viewingOrder.patient?.phone_number || viewingOrder.patient_phone || viewingOrder.phone || 'N/A'}
                    </p>
                  </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Destination Lab
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {viewingOrder.lab?.lab_name || viewingOrder.destination_lab_name || viewingOrder.lab_name || 'Laboratory'}
                  </p>
                  <p className="text-slate-600 mt-1">
                    Location: {viewingOrder.lab?.city || viewingOrder.destination_lab_city || viewingOrder.city || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Creator Information Card */}
              {(() => {
                const creator = getCreatorInfo(viewingOrder);
                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Created By
                    </span>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-sm">
                        {creator.name}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        creator.role === 'Doctor'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                          : 'bg-purple-50 text-purple-700 border-purple-200/60'
                      }`}>
                        {creator.role}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Finalized Diagnostic Report Display */}
              {viewingOrder.report && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-emerald-700" />
                      <div>
                        <span className="font-bold text-emerald-950 text-xs block">Finalized Diagnostic Radiology Report</span>
                        <span className="text-[11px] text-emerald-800">
                          Signed by {viewingOrder.report.uploadedBy?.name || 'Diagnostic Specialist'} on {formatDate(viewingOrder.report.uploadedAt)}
                        </span>
                      </div>
                    </div>
                    {viewingOrder.report.isCritical && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Critical Alert Flagged
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Clinical Findings:</span>
                    <p className="text-xs text-slate-900 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-emerald-100">
                      {viewingOrder.report.findings}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Specialist Impression:</span>
                    <p className="text-xs font-semibold text-emerald-950 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-emerald-100">
                      {viewingOrder.report.impression}
                    </p>
                  </div>

                  {viewingOrder.report.recommendations && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recommendations:</span>
                      <p className="text-xs text-slate-700 mt-0.5 bg-white p-2 rounded-lg border border-emerald-100">
                        {viewingOrder.report.recommendations}
                      </p>
                    </div>
                  )}

                  {viewingOrder.report.file?.fileUrl && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={viewingOrder.report.file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View / Download Final Scan PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {viewingOrder.clinical_notes && (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs">
                  <span className="font-semibold text-amber-900 block mb-1">Clinical Notes:</span>
                  <p className="text-slate-700">{viewingOrder.clinical_notes}</p>
                </div>
              )}

              {viewingOrder.rejection_reason && (
                <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200/70 text-xs text-red-800">
                  <span className="font-bold block mb-1">Lab Rejection Reason:</span>
                  <p>{viewingOrder.rejection_reason}</p>
                </div>
              )}

              {(() => {
                const radItems = (viewingOrder.items || []).filter(i => i.item_type === 'radiology');
                const standardItems = (viewingOrder.items || []).filter(i => i.item_type !== 'radiology');
                const isRadOrder = radItems.length > 0 || Boolean(viewingOrder.study_name || viewingOrder.modality || viewingOrder.investigation_type);

                return (
                  <div className="space-y-4">
                    {/* Radiology Investigations Card */}
                    {isRadOrder && (
                      <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-sky-700" />
                            <span className="font-bold text-sky-950 text-xs">
                              Radiology & Imaging Investigation
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                            {radItems[0]?.modality || viewingOrder.modality || viewingOrder.investigation_type || 'Radiology'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Study / Protocol:
                            </span>
                            <span className="font-semibold text-slate-900 block mt-0.5">
                              {radItems[0]?.study_name || viewingOrder.study_name || radItems[0]?.item_name || 'Radiology Study'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Clinical Indication:
                            </span>
                            <span className="text-slate-800 block mt-0.5">
                              {radItems[0]?.clinical_indication || viewingOrder.clinical_indication || viewingOrder.clinical_notes || 'Diagnostic Investigation'}
                            </span>
                          </div>

                          {(radItems[0]?.instructions || viewingOrder.instructions) && (
                            <div className="sm:col-span-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Instructions / Notes:
                              </span>
                              <span className="text-slate-700 italic block mt-0.5">
                                {radItems[0]?.instructions || viewingOrder.instructions}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Patient Context:
                            </span>
                            <span className="text-slate-800 block mt-0.5">
                              {viewingOrder.admission_id || viewingOrder.admission_number || viewingOrder.originType === 'IPD' ? (
                                <span className="font-semibold text-indigo-700">
                                  Inpatient (Admission: {viewingOrder.admission_number || viewingOrder.admission_id?.slice(0, 8)})
                                </span>
                              ) : (
                                <span className="text-slate-700">
                                  Outpatient (Code: {viewingOrder.patient?.patient_code || viewingOrder.patient_code || 'OPD'})
                                </span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Destination Lab:
                            </span>
                            <span className="text-slate-800 font-medium block mt-0.5">
                              {viewingOrder.lab?.lab_name || viewingOrder.destination_lab_name || viewingOrder.lab_name || 'Assigned Laboratory'}
                            </span>
                          </div>
                        </div>

                        {radItems.length > 1 && (
                          <div className="pt-2 border-t border-sky-200/60 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-600 block">
                              Additional Ordered Imaging Studies ({radItems.length - 1}):
                            </span>
                            {radItems.slice(1).map((r, rIdx) => (
                              <div key={rIdx} className="p-2 bg-white rounded-lg border border-sky-100 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-900">{r.modality}: {r.study_name || r.item_name}</span>
                                  {r.clinical_indication && (
                                    <p className="text-[11px] text-slate-500">Indication: {r.clinical_indication}</p>
                                  )}
                                </div>
                                <span className="font-bold text-slate-800">₹{Number(r.price || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pathology Tests & Packages (if any) */}
                    {standardItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                          Ordered Pathology Tests & Packages ({standardItems.length})
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {standardItems.map((it, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                              <div>
                                <span className="font-semibold text-slate-900 block">{it.item_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {it.item_code} • {it.item_type}
                                </span>
                              </div>
                              <div className="font-bold text-slate-800">
                                ₹{Number(it.price || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Created: {formatDate(viewingOrder.created_at || viewingOrder.createdAt)}</span>
                <span>Updated: {formatDate(viewingOrder.updated_at || viewingOrder.updatedAt || viewingOrder.created_at || viewingOrder.createdAt)}</span>
              </div>
            </div>
            )}

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
