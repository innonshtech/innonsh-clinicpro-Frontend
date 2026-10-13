'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  BedDouble,
  Building2,
  Layers,
  DoorOpen,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  X,
  History,
  Tag,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Check,
  User,
  Clock,
  Sparkles,
  Wrench,
  Ban,
  Filter,
  RotateCcw,
  Users,
  MoreVertical,
  Edit2,
  CheckCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    activeBtn: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 shadow-2xs',
    countBadge: 'bg-emerald-100 text-emerald-800'
  },
  OCCUPIED: {
    label: 'Occupied',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    activeBtn: 'bg-rose-50 text-rose-700 border-rose-200/70 shadow-2xs',
    countBadge: 'bg-rose-100 text-rose-800'
  },
  RESERVED: {
    label: 'Reserved',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    activeBtn: 'bg-indigo-50 text-indigo-700 border-indigo-200/70 shadow-2xs',
    countBadge: 'bg-indigo-100 text-indigo-800'
  },
  CLEANING: {
    label: 'Cleaning',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    activeBtn: 'bg-amber-50 text-amber-700 border-amber-200/70 shadow-2xs',
    countBadge: 'bg-amber-100 text-amber-800'
  },
  MAINTENANCE: {
    label: 'Maintenance',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    activeBtn: 'bg-orange-50 text-orange-700 border-orange-200/70 shadow-2xs',
    countBadge: 'bg-orange-100 text-orange-800'
  },
  BLOCKED: {
    label: 'Blocked',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    activeBtn: 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs',
    countBadge: 'bg-slate-200 text-slate-700'
  },
  ISOLATION: {
    label: 'Isolation',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    activeBtn: 'bg-purple-50 text-purple-700 border-purple-200/70 shadow-2xs',
    countBadge: 'bg-purple-100 text-purple-800'
  }
};

const ALL_STATUS_KEYS = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'BLOCKED', 'ISOLATION'];

// Centralized Frontend Transition Rules matching Task 3 requirements
const VALID_BED_TRANSITIONS = {
  AVAILABLE: ['RESERVED', 'MAINTENANCE', 'BLOCKED', 'ISOLATION'], // OCCUPIED only via inpatient admission
  OCCUPIED: [], // Ordinary manual status changes blocked; clinical discharge only
  CLEANING: ['AVAILABLE', 'MAINTENANCE', 'BLOCKED'],
  RESERVED: ['AVAILABLE', 'MAINTENANCE', 'BLOCKED'],
  MAINTENANCE: ['CLEANING', 'AVAILABLE', 'BLOCKED'],
  BLOCKED: ['AVAILABLE', 'MAINTENANCE'],
  ISOLATION: ['CLEANING', 'AVAILABLE', 'MAINTENANCE', 'BLOCKED']
};

export default function BedManagementPage() {
  const router = useRouter();

  const [clinicId, setClinicId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isIpdEnabled, setIsIpdEnabled] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hierarchy Data
  const [hierarchy, setHierarchy] = useState({
    buildings: [],
    floors: [],
    wards: [],
    rooms: [],
    beds: [],
    tree: []
  });
  const [admissions, setAdmissions] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [bedFilter, setBedFilter] = useState('ALL');

  // Action Menu dropdown state & Confirmation Modal for Delete vs Deactivate
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Collapse / Expand Map
  const [expanded, setExpanded] = useState({});

  // Entity Creation / Edit Modal
  const [modalType, setModalType] = useState(null); // 'building' | 'floor' | 'ward' | 'room' | 'bed'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingEntity, setEditingEntity] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalError, setModalError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Bed Details & History Modal
  const [selectedBed, setSelectedBed] = useState(null);
  const [bedDetails, setBedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({ newStatus: '', reason: '' });
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const cId = user.id || user._id;
      setClinicId(cId);
      setClinicName(user.name || user.clinicName || 'Clinic');
      verifyAndLoad(cId);
    } catch (e) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => setOpenActionMenuId(null);
    if (openActionMenuId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [openActionMenuId]);

  const verifyAndLoad = async (cId) => {
    setLoading(true);
    try {
      const pRes = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${cId}`, {
        headers: getAuthHeaders()
      });
      const pData = await pRes.json();
      const ipdActive = pData.data?.clinic?.modules?.ipd === true;
      setIsIpdEnabled(ipdActive);

      if (ipdActive) {
        await Promise.all([loadHierarchy(cId), loadAdmissions(cId)]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying clinic IPD module:', err);
      setLoading(false);
    }
  };

  const loadHierarchy = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.data?.hierarchy) {
        const h = data.data.hierarchy;
        setHierarchy(h);

        // Auto-expand all levels by default so user immediately sees everything
        const exp = {};
        (h.buildings || []).forEach(b => { exp['b_' + b.id] = true; });
        (h.floors || []).forEach(f => { exp['f_' + f.id] = true; });
        (h.wards || []).forEach(w => { exp['w_' + w.id] = true; });
        (h.rooms || []).forEach(r => { exp['r_' + r.id] = true; });
        setExpanded(prev => ({ ...exp, ...prev }));
      }
    } catch (e) {
      console.error('Failed to load hierarchy:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmissions = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.data?.admissions) {
        setAdmissions(data.data.admissions || []);
      }
    } catch (e) {
      console.error('Failed to load admissions:', e);
    }
  };

  const isOpen = (key) => {
    return expanded[key] !== undefined ? Boolean(expanded[key]) : true;
  };

  const toggle = (key) => {
    setExpanded(p => {
      const current = p[key] !== undefined ? p[key] : true;
      return { ...p, [key]: !current };
    });
  };

  const expandAll = () => {
    const exp = {};
    (hierarchy.buildings || []).forEach(b => { exp['b_' + b.id] = true; });
    (hierarchy.floors || []).forEach(f => { exp['f_' + f.id] = true; });
    (hierarchy.wards || []).forEach(w => { exp['w_' + w.id] = true; });
    (hierarchy.rooms || []).forEach(r => { exp['r_' + r.id] = true; });
    setExpanded(exp);
  };

  const collapseAll = () => {
    const exp = {};
    (hierarchy.buildings || []).forEach(b => { exp['b_' + b.id] = false; });
    (hierarchy.floors || []).forEach(f => { exp['f_' + f.id] = false; });
    (hierarchy.wards || []).forEach(w => { exp['w_' + w.id] = false; });
    (hierarchy.rooms || []).forEach(r => { exp['r_' + r.id] = false; });
    setExpanded(exp);
  };

  // Open modal for Create or Edit
  const openEntityModal = (type, mode = 'create', entity = null, context = {}) => {
    setModalType(type);
    setModalMode(mode);
    setEditingEntity(entity);
    setModalError('');

    if (mode === 'edit' && entity) {
      if (type === 'building') {
        setFormData({
          name: entity.name || '',
          code: entity.code || '',
          description: entity.description || ''
        });
      } else if (type === 'floor') {
        setFormData({
          buildingId: entity.building_id || context.buildingId || '',
          floorNumber: entity.floor_number ?? '',
          name: entity.name || ''
        });
      } else if (type === 'ward') {
        setFormData({
          buildingId: context.buildingId || '',
          floorId: entity.floor_id || context.floorId || '',
          name: entity.name || '',
          type: entity.ward_type || entity.type || 'General',
          genderDesignation: entity.gender_type || entity.gender || entity.genderDesignation || 'Mixed'
        });
      } else if (type === 'room') {
        setFormData({
          wardId: entity.ward_id || context.wardId || '',
          roomNumber: entity.room_number || '',
          roomType: entity.room_type || entity.type || 'Standard',
          dailyRate: entity.daily_rate !== undefined ? entity.daily_rate : ''
        });
      } else if (type === 'bed') {
        setFormData({
          wardId: context.wardId || '',
          roomId: entity.room_id || context.roomId || '',
          bedNumber: entity.bed_number || '',
          dailyRate: entity.daily_rate !== undefined ? entity.daily_rate : 500
        });
      }
    } else {
      // Create mode
      let defaults = {};
      if (type === 'floor') {
        const bId = context.buildingId || hierarchy.buildings[0]?.id || '';
        const bFloors = (hierarchy.floors || []).filter(f => f.building_id === bId);
        const nextNum = bFloors.length > 0 ? Math.max(...bFloors.map(f => Number(f.floor_number) || 0)) + 1 : 1;
        defaults = { buildingId: bId, floorNumber: nextNum, name: `Floor ${nextNum}` };
      } else if (type === 'ward') {
        const bId = context.buildingId || hierarchy.buildings[0]?.id || '';
        const bFloors = (hierarchy.floors || []).filter(f => f.building_id === bId);
        const fId = context.floorId || bFloors[0]?.id || hierarchy.floors[0]?.id || '';
        defaults = { buildingId: bId, floorId: fId, name: '', type: 'General', genderDesignation: 'Mixed' };
      } else if (type === 'room') {
        defaults = { wardId: context.wardId || hierarchy.wards[0]?.id || '', roomNumber: '', roomType: 'Standard' };
      } else if (type === 'bed') {
        const room = (hierarchy.rooms || []).find(r => r.id === context.roomId);
        defaults = {
          wardId: context.wardId || room?.ward_id || hierarchy.wards[0]?.id || '',
          roomId: context.roomId || hierarchy.rooms[0]?.id || '',
          bedNumber: '',
          dailyRate: 500
        };
      }
      setFormData(defaults);
    }
  };

  // Backwards compatibility wrapper for create
  const openCreateModal = (type, context = {}) => openEntityModal(type, 'create', null, context);

  // Submit Entity Create or Update
  const handleEntitySubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError('');

    try {
      if (modalMode === 'edit' && editingEntity) {
        const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            clinicId,
            entityType: modalType,
            id: editingEntity.id,
            data: formData
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Failed to update ${modalType}`);
        }

        setSuccessMsg(`${modalType.toUpperCase()} updated successfully!`);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            clinicId,
            entityType: modalType,
            data: formData
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Failed to create ${modalType}`);
        }

        setSuccessMsg(`${modalType.toUpperCase()} created successfully!`);

        // Auto-expand created entity's hierarchy path
        if (formData.buildingId) setExpanded(p => ({ ...p, ['b_' + formData.buildingId]: true }));
        if (formData.floorId) setExpanded(p => ({ ...p, ['f_' + formData.floorId]: true }));
        if (formData.wardId) setExpanded(p => ({ ...p, ['w_' + formData.wardId]: true }));
        if (formData.roomId) setExpanded(p => ({ ...p, ['r_' + formData.roomId]: true }));
      }

      setTimeout(() => setSuccessMsg(''), 4000);
      setModalType(null);
      setEditingEntity(null);
      setFormData({});
      await loadHierarchy(clinicId);
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Legacy alias
  const handleCreateEntity = handleEntitySubmit;

  // Open Delete or Deactivate Action Modal with clear semantics
  const handleOpenActionModal = (actionType, entityType, id, name, hasReferences, reason = '') => {
    setOpenActionMenuId(null);
    setActionConfirm({
      isOpen: true,
      actionType,
      entityType,
      id,
      name,
      hasReferences,
      reason
    });
  };

  // Execute confirmed Delete or Deactivate action
  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    const { actionType, entityType, id, name, hasReferences, reason } = actionConfirm;

    setActionLoading(true);
    try {
      if (actionType === 'delete') {
        if (hasReferences && entityType !== 'bed') {
          alert(`Cannot delete ${entityType}: ${reason}`);
          setActionLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, entityType, id })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Failed to delete ${entityType}`);
        }

        if (data.data?.result?.deactivated) {
          setSuccessMsg(data.message || `${entityType.toUpperCase()} has historical records and was safely deactivated instead.`);
        } else {
          setSuccessMsg(`${entityType.toUpperCase()} "${name}" permanently deleted.`);
        }
        setTimeout(() => setSuccessMsg(''), 5000);
        setActionConfirm(null);
        await loadHierarchy(clinicId);
      } else {
        // Safe Deactivation or Reactivation
        const action = actionType === 'activate' ? 'activate' : 'deactivate';
        const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, entityType, id, action })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Failed to ${action} ${entityType}`);
        }

        if (action === 'activate') {
          setSuccessMsg(
            entityType === 'bed'
              ? `Bed "${name}" reactivated and status set to AVAILABLE.`
              : `${entityType.toUpperCase()} "${name}" reactivated successfully.`
          );
        } else {
          setSuccessMsg(
            entityType === 'bed'
              ? `Bed "${name}" deactivated and status set to BLOCKED.`
              : `${entityType.toUpperCase()} "${name}" safely deactivated.`
          );
        }
        setTimeout(() => setSuccessMsg(''), 5000);
        setActionConfirm(null);
        await loadHierarchy(clinicId);
      }
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Deactivation legacy wrapper
  const handleDeactivate = (entityType, id, name) => {
    handleOpenActionModal('deactivate', entityType, id, name, false);
  };

  // Inspect Bed Details & History
  const handleOpenBedDetails = async (bed) => {
    setSelectedBed(bed);
    setStatusUpdateData({ newStatus: bed.status, reason: '' });
    setDetailsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${bed.id}?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBedDetails(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch bed details:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Update Bed Status
  const handleUpdateBedStatus = async (e) => {
    e.preventDefault();
    if (!selectedBed) return;

    const { newStatus, reason } = statusUpdateData;
    if (newStatus === selectedBed.status) {
      alert('Selected status is already active.');
      return;
    }

    if (selectedBed.status === 'OCCUPIED' && newStatus === 'AVAILABLE') {
      alert('An OCCUPIED bed cannot be made AVAILABLE directly. It must first be discharged to CLEANING, then transitioned CLEANING -> AVAILABLE.');
      return;
    }

    if (newStatus === 'OCCUPIED') {
      alert('Beds can only become OCCUPIED through an active doctor inpatient admission.');
      return;
    }

    setStatusUpdateLoading(true);
    try {
      let res;
      if (selectedBed.status === 'CLEANING' && newStatus === 'AVAILABLE') {
        res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${selectedBed.id}/mark-cleaned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, reason: reason || 'Cleaning verified' })
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${selectedBed.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, status: newStatus, reason })
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update bed status');
      }

      setSuccessMsg(`Bed ${selectedBed.bed_number} status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 4000);

      await loadHierarchy(clinicId);
      const updated = { ...selectedBed, status: newStatus };
      setSelectedBed(updated);
      handleOpenBedDetails(updated);
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Quick Action: CLEANING -> AVAILABLE
  const handleQuickMarkCleaned = async (e, bed) => {
    e.stopPropagation();
    if (!window.confirm(`Mark Bed ${bed.bed_number} as clean and available for admissions?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${bed.id}/mark-cleaned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ clinicId, reason: 'Housekeeping cleaning verified' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status');
      }
      setSuccessMsg(`Bed ${bed.bed_number} is now AVAILABLE for admission!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadHierarchy(clinicId);
    } catch (err) {
      alert(err.message || 'Failed to update bed');
    }
  };

  // Helper for admission info
  const getBedAdmission = (bedId) => {
    return (admissions || []).find(
      a => (a.bed_id === bedId || a.bedId === bedId) && a.status === 'admitted'
    );
  };

  // Status Summary Counts
  const statusCounts = useMemo(() => {
    const counts = { TOTAL: 0 };
    ALL_STATUS_KEYS.forEach(k => { counts[k] = 0; });

    (hierarchy.beds || []).forEach(b => {
      counts.TOTAL += 1;
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    });

    return counts;
  }, [hierarchy.beds]);

  // Cascading Filter Derivations
  const availableFloors = useMemo(() => {
    const allFloors = hierarchy.floors || [];
    if (buildingFilter === 'ALL') return allFloors;
    return allFloors.filter(f => f.building_id === buildingFilter);
  }, [hierarchy.floors, buildingFilter]);

  const availableWards = useMemo(() => {
    const allWards = hierarchy.wards || [];
    if (floorFilter !== 'ALL') {
      return allWards.filter(w => w.floor_id === floorFilter);
    }
    if (buildingFilter !== 'ALL') {
      const validFloorIds = new Set(availableFloors.map(f => f.id));
      return allWards.filter(w => validFloorIds.has(w.floor_id) || w.building_id === buildingFilter);
    }
    return allWards;
  }, [hierarchy.wards, floorFilter, buildingFilter, availableFloors]);

  const availableRooms = useMemo(() => {
    const allRooms = hierarchy.rooms || [];
    if (wardFilter !== 'ALL') {
      return allRooms.filter(r => r.ward_id === wardFilter);
    }
    const validWardIds = new Set(availableWards.map(w => w.id));
    return allRooms.filter(r => validWardIds.has(r.ward_id));
  }, [hierarchy.rooms, wardFilter, availableWards]);

  const availableBeds = useMemo(() => {
    const allBeds = hierarchy.beds || [];
    if (roomFilter !== 'ALL') {
      return allBeds.filter(b => b.room_id === roomFilter);
    }
    const validRoomIds = new Set(availableRooms.map(r => r.id));
    return allBeds.filter(b => validRoomIds.has(b.room_id));
  }, [hierarchy.beds, roomFilter, availableRooms]);

  // Cascading filter change handlers: changing parent filter automatically clears invalid child selections
  const handleBuildingChange = (bId) => {
    setBuildingFilter(bId);
    if (floorFilter !== 'ALL') {
      const validFloors = (hierarchy.floors || []).filter(f => bId === 'ALL' || f.building_id === bId);
      if (!validFloors.some(f => f.id === floorFilter)) setFloorFilter('ALL');
    }
    if (wardFilter !== 'ALL') {
      const validFloors = (hierarchy.floors || []).filter(f => bId === 'ALL' || f.building_id === bId);
      const validFloorIds = new Set(validFloors.map(f => f.id));
      const validWards = (hierarchy.wards || []).filter(w => validFloorIds.has(w.floor_id) || (bId !== 'ALL' && w.building_id === bId));
      if (!validWards.some(w => w.id === wardFilter)) setWardFilter('ALL');
    }
    if (roomFilter !== 'ALL') setRoomFilter('ALL');
    if (bedFilter !== 'ALL') setBedFilter('ALL');
  };

  const handleFloorChange = (fId) => {
    setFloorFilter(fId);
    if (fId !== 'ALL') {
      const flr = (hierarchy.floors || []).find(f => f.id === fId);
      if (flr && buildingFilter !== flr.building_id) setBuildingFilter(flr.building_id);
    }
    if (wardFilter !== 'ALL') {
      const validWards = (hierarchy.wards || []).filter(w => fId === 'ALL' || w.floor_id === fId);
      if (!validWards.some(w => w.id === wardFilter)) setWardFilter('ALL');
    }
    if (roomFilter !== 'ALL') setRoomFilter('ALL');
    if (bedFilter !== 'ALL') setBedFilter('ALL');
  };

  const handleWardChange = (wId) => {
    setWardFilter(wId);
    if (wId !== 'ALL') {
      const wrd = (hierarchy.wards || []).find(w => w.id === wId);
      if (wrd) {
        if (floorFilter !== wrd.floor_id) setFloorFilter(wrd.floor_id);
        const flr = (hierarchy.floors || []).find(f => f.id === wrd.floor_id);
        if (flr && buildingFilter !== flr.building_id) setBuildingFilter(flr.building_id);
      }
    }
    if (roomFilter !== 'ALL') setRoomFilter('ALL');
    if (bedFilter !== 'ALL') setBedFilter('ALL');
  };

  const handleRoomChange = (rId) => {
    setRoomFilter(rId);
    if (rId !== 'ALL') {
      const rm = (hierarchy.rooms || []).find(r => r.id === rId);
      if (rm) {
        if (wardFilter !== rm.ward_id) setWardFilter(rm.ward_id);
        const wrd = (hierarchy.wards || []).find(w => w.id === rm.ward_id);
        if (wrd) {
          if (floorFilter !== wrd.floor_id) setFloorFilter(wrd.floor_id);
          const flr = (hierarchy.floors || []).find(f => f.id === wrd.floor_id);
          if (flr && buildingFilter !== flr.building_id) setBuildingFilter(flr.building_id);
        }
      }
    }
    if (bedFilter !== 'ALL') setBedFilter('ALL');
  };

  const handleBedChange = (bId) => {
    setBedFilter(bId);
    if (bId !== 'ALL') {
      const bd = (hierarchy.beds || []).find(b => b.id === bId);
      if (bd) {
        if (roomFilter !== bd.room_id) setRoomFilter(bd.room_id);
        const rm = (hierarchy.rooms || []).find(r => r.id === bd.room_id);
        if (rm) {
          if (wardFilter !== rm.ward_id) setWardFilter(rm.ward_id);
          const wrd = (hierarchy.wards || []).find(w => w.id === rm.ward_id);
          if (wrd) {
            if (floorFilter !== wrd.floor_id) setFloorFilter(wrd.floor_id);
            const flr = (hierarchy.floors || []).find(f => f.id === wrd.floor_id);
            if (flr && buildingFilter !== flr.building_id) setBuildingFilter(flr.building_id);
          }
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBuildingFilter('ALL');
    setFloorFilter('ALL');
    setWardFilter('ALL');
    setRoomFilter('ALL');
    setBedFilter('ALL');
  };

  // Filter Hierarchy
  const displayTree = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return (hierarchy.buildings || [])
      .filter(b => buildingFilter === 'ALL' || b.id === buildingFilter)
      .map(building => {
        const bMatch = q
          ? building.name.toLowerCase().includes(q) || (building.code || '').toLowerCase().includes(q)
          : false;

        const floors = (hierarchy.floors || [])
          .filter(f => f.building_id === building.id)
          .filter(f => floorFilter === 'ALL' || f.id === floorFilter)
          .map(floor => {
            const fMatch = q
              ? floor.name.toLowerCase().includes(q) || String(floor.floor_number).includes(q)
              : false;

            const wards = (hierarchy.wards || [])
              .filter(w => w.floor_id === floor.id)
              .filter(w => wardFilter === 'ALL' || w.id === wardFilter)
              .map(ward => {
                const wMatch = q
                  ? ward.name.toLowerCase().includes(q) || (ward.ward_type || '').toLowerCase().includes(q)
                  : false;

                const rooms = (hierarchy.rooms || [])
                  .filter(r => r.ward_id === ward.id)
                  .filter(r => roomFilter === 'ALL' || r.id === roomFilter)
                  .map(room => {
                    const rMatch = q
                      ? room.room_number.toLowerCase().includes(q) || (room.room_type || '').toLowerCase().includes(q)
                      : false;

                    const beds = (hierarchy.beds || [])
                      .filter(bed => bed.room_id === room.id)
                      .filter(bed => bedFilter === 'ALL' || bed.id === bedFilter)
                      .filter(bed => statusFilter === 'ALL' || bed.status === statusFilter)
                      .filter(bed => {
                        if (!q) return true;
                        const matchBed = bed.bed_number.toLowerCase().includes(q);
                        const adm = getBedAdmission(bed.id);
                        const matchPat = adm ? (adm.patientName || '').toLowerCase().includes(q) : false;
                        return bMatch || fMatch || wMatch || rMatch || matchBed || matchPat;
                      });

                    return { ...room, beds, isMatch: rMatch };
                  })
                  .filter(room => {
                    if (!q && statusFilter === 'ALL' && bedFilter === 'ALL') return true;
                    if (roomFilter === room.id) return true;
                    if (q && (bMatch || fMatch || wMatch || room.isMatch)) return true;
                    return room.beds.length > 0;
                  });

                return { ...ward, rooms, isMatch: wMatch };
              })
              .filter(ward => {
                if (!q && statusFilter === 'ALL' && roomFilter === 'ALL' && bedFilter === 'ALL') return true;
                if (wardFilter === ward.id) return true;
                if (q && (bMatch || fMatch || ward.isMatch)) return true;
                return ward.rooms.length > 0;
              });

            return { ...floor, wards, isMatch: fMatch };
          })
          .filter(floor => {
            if (!q && statusFilter === 'ALL' && wardFilter === 'ALL' && roomFilter === 'ALL' && bedFilter === 'ALL') return true;
            if (floorFilter === floor.id) return true;
            if (q && (bMatch || floor.isMatch)) return true;
            return floor.wards.length > 0;
          });

        return { ...building, floors, isMatch: bMatch };
      })
      .filter(building => {
        if (!q && statusFilter === 'ALL' && floorFilter === 'ALL' && wardFilter === 'ALL' && roomFilter === 'ALL' && bedFilter === 'ALL' && buildingFilter === 'ALL') return true;
        if (buildingFilter === building.id) return true;
        if (q && building.isMatch) return true;
        return building.floors.length > 0;
      });
  }, [hierarchy, searchTerm, statusFilter, buildingFilter, floorFilter, wardFilter, roomFilter, bedFilter, admissions]);

  if (loading && isIpdEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying hospital bed configuration...</p>
      </div>
    );
  }

  if (isIpdEnabled === false) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm mt-12">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">IPD Module Not Enabled</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          Bed &amp; Ward Management requires the Inpatient Department (IPD) module to be enabled for this clinic account.
        </p>
        <Link
          href="/clinic"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. MAIN HEADER — MATCH LAB ORDERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <BedDouble className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">BED &amp; WARD MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bed &amp; Ward Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Building &rarr; Floor &rarr; Ward &rarr; Room &rarr; Bed hierarchy and real-time bed occupancy
          </p>
        </div>

        {/* Header Actions inside the container */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start sm:self-auto">
          <button
            onClick={() => openCreateModal('building')}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-colors shadow-2xs gap-2"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Add Building</span>
          </button>
          <button
            onClick={() => openCreateModal('bed')}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2"
          >
            <BedDouble className="w-4 h-4" />
            <span>Add Bed</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. SEARCH + FILTER SECTION & COMPACT LAB ORDERS-STYLE STATUS TABS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        {/* Top: Full-Width Search Input + Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by bed number, room, ward, floor, building, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => clinicId && loadHierarchy(clinicId)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0"
            title="Refresh beds &amp; infrastructure"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Middle: Compact Lab Orders-Style All 8 Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
            {/* All Beds */}
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>All Beds</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                statusFilter === 'ALL' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {statusCounts.TOTAL}
              </span>
            </button>

            {/* 7 individual statuses */}
            {ALL_STATUS_KEYS.map(key => {
              const cfg = STATUS_CONFIG[key];
              const isSelected = statusFilter === key;
              const count = statusCounts[key] || 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(isSelected ? 'ALL' : key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? cfg.activeBtn
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    isSelected ? cfg.countBadge : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: Filter Dropdowns ([ All Statuses ▼ ] [ All Buildings ▼ ] [ All Floors ▼ ] [ All Wards ▼ ] [ All Rooms ▼ ] [ All Beds ▼ ]) and [ Reset ] */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* All Statuses Dropdown */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[145px] truncate"
              >
                <option value="ALL">All Statuses</option>
                {ALL_STATUS_KEYS.map(st => (
                  <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* All Buildings Dropdown */}
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={buildingFilter}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[150px] truncate"
              >
                <option value="ALL">All Buildings</option>
                {(hierarchy.buildings || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* All Floors Dropdown */}
            <div className="relative">
              <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={floorFilter}
                onChange={(e) => handleFloorChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[145px] truncate"
              >
                <option value="ALL">All Floors</option>
                {availableFloors.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* All Wards Dropdown */}
            <div className="relative">
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={wardFilter}
                onChange={(e) => handleWardChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[155px] truncate"
              >
                <option value="ALL">All Wards</option>
                {availableWards.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* All Rooms Dropdown */}
            <div className="relative">
              <DoorOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={roomFilter}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[145px] truncate"
              >
                <option value="ALL">All Rooms</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_number}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* All Beds Dropdown */}
            <div className="relative">
              <BedDouble className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={bedFilter}
                onChange={(e) => handleBedChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none cursor-pointer hover:border-slate-300 transition-colors max-w-[145px] truncate"
              >
                <option value="ALL">All Beds</option>
                {availableBeds.map(b => (
                  <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Reset Button */}
          <div className="self-end lg:self-auto shrink-0">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="h-3 w-3 text-slate-500" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 4. HOSPITAL INFRASTRUCTURE HEADER & COMPACT EXPAND/COLLAPSE */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Hospital Infrastructure{' '}
            <span className="text-xs font-medium text-slate-500">
              ({(hierarchy.buildings || []).length} {(hierarchy.buildings || []).length === 1 ? 'Building' : 'Buildings'})
            </span>
          </h2>

          {/* Compact secondary Expand All / Collapse All control */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
            >
              Expand All
            </button>
            <div className="h-3 w-px bg-slate-200" />
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {displayTree.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No hospital infrastructure found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-5 leading-relaxed">
              {(hierarchy.buildings || []).length === 0
                ? 'Get started by creating your hospital Building, then configure Floors, Wards, Rooms, and Beds.'
                : 'No units match your current search and filter criteria.'}
            </p>
            {(hierarchy.buildings || []).length === 0 ? (
              <button
                onClick={() => openCreateModal('building')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Create First Building
              </button>
            ) : (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
              </button>
            )}
          </div>
        ) : (
          displayTree.map(building => {
            const bOpen = isOpen('b_' + building.id);
            const totalFloors = building.floors.length;
            const totalWardsInBuilding = building.floors.reduce((sum, f) => sum + f.wards.length, 0);
            const totalRoomsInBuilding = building.floors.reduce((sum, f) => sum + f.wards.reduce((wSum, w) => wSum + w.rooms.length, 0), 0);
            const totalBedsInBuilding = building.floors.reduce(
              (sum, f) => sum + f.wards.reduce((wSum, w) => wSum + w.rooms.reduce((rSum, r) => rSum + r.beds.length, 0), 0),
              0
            );

            const hasOpenMenuInBuilding = openActionMenuId && (
              openActionMenuId === 'b_' + building.id ||
              building.floors.some(f =>
                openActionMenuId === 'f_' + f.id ||
                f.wards.some(w =>
                  openActionMenuId === 'w_' + w.id ||
                  w.rooms.some(r =>
                    openActionMenuId === 'r_' + r.id ||
                    r.beds.some(b => openActionMenuId === 'bed_' + b.id)
                  )
                )
              )
            );

            return (
              /* ONE Main Container Card per Building */
              <div
                key={building.id}
                className={`bg-white border border-slate-200 shadow-sm rounded-2xl transition-all ${
                  hasOpenMenuInBuilding ? 'relative z-30' : 'relative z-0'
                }`}
              >
                {/* Level 1: Building Header Row */}
                <div
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    bOpen ? 'border-b border-slate-100 rounded-t-2xl' : 'rounded-2xl'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggle('b_' + building.id)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                      title={bOpen ? 'Collapse Building' : 'Expand Building'}
                    >
                      {bOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">{building.name}</h3>
                        {building.is_active === false && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Inactive
                          </span>
                        )}
                        {building.code && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {building.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {totalFloors} Floor{totalFloors === 1 ? '' : 's'} · {totalWardsInBuilding} Ward{totalWardsInBuilding === 1 ? '' : 's'} · {totalRoomsInBuilding} Room{totalRoomsInBuilding === 1 ? '' : 's'} · {totalBedsInBuilding} Bed{totalBedsInBuilding === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => openCreateModal('floor', { buildingId: building.id })}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3 text-slate-500" /> Add Floor
                    </button>
                    {/* Building Action Menu */}
                    {(() => {
                      const bHasChildren = (hierarchy.floors || []).some(f => f.building_id === building.id);
                      const bReason = bHasChildren ? 'it contains floors in the hierarchy' : '';
                      const menuKey = 'b_' + building.id;

                      return (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === menuKey ? null : menuKey);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Building actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {openActionMenuId === menuKey && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 z-40 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openEntityModal('building', 'edit', building);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <div>
                                  <div>Edit Building</div>
                                  <div className="text-[10px] text-slate-400 font-normal">Modify name & code</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(building.is_active === false ? 'activate' : 'deactivate', 'building', building.id, building.name, bHasChildren, bReason)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                  building.is_active === false
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                }`}
                              >
                                {building.is_active === false ? (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <div>
                                      <div>Reactivate Building</div>
                                      <div className="text-[10px] text-slate-400 font-normal">Restore to active use</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <div>
                                      <div>Deactivate Building</div>
                                      <div className="text-[10px] text-slate-400 font-normal">Safely disable entity</div>
                                    </div>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenActionModal('delete', 'building', building.id, building.name, bHasChildren, bReason)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                  bHasChildren
                                    ? 'text-slate-500 hover:bg-slate-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 className={`h-3.5 w-3.5 shrink-0 ${bHasChildren ? 'text-slate-400' : 'text-rose-500'}`} />
                                <div>
                                  <div>Delete Building</div>
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {bHasChildren ? 'Contains active floors' : 'Permanently remove'}
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Level 1 Content: Floors inside Building (Simple rows, no nested cards) */}
                {bOpen && (
                  <div className="bg-white">
                    {building.floors.length === 0 ? (
                      <div className="px-5 py-3 pl-8 sm:pl-10 flex items-center gap-3 text-xs text-slate-500">
                        <span>No floors yet</span>
                        <button
                          onClick={() => openCreateModal('floor', { buildingId: building.id })}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
                        >
                          <Plus className="h-3 w-3" /> Add Floor
                        </button>
                      </div>
                    ) : (
                      building.floors.map(floor => {
                        const fOpen = isOpen('f_' + floor.id);
                        const totalWardsOnFloor = floor.wards.length;
                        const totalRoomsOnFloor = floor.wards.reduce((wSum, w) => wSum + w.rooms.length, 0);
                        const totalBedsOnFloor = floor.wards.reduce(
                          (wSum, w) => wSum + w.rooms.reduce((rSum, r) => rSum + r.beds.length, 0),
                          0
                        );

                        return (
                          <div key={floor.id} className={`border-b border-slate-100 last:border-b-0 ${openActionMenuId === 'f_' + floor.id ? 'relative z-20' : ''}`}>
                            {/* Floor Row: Simple row with subtle divider */}
                            <div className="px-4 sm:px-5 py-3 pl-6 sm:pl-8 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  onClick={() => toggle('f_' + floor.id)}
                                  className="p-1 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                                  title={fOpen ? 'Collapse Floor' : 'Expand Floor'}
                                >
                                  {fOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                  <Layers className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-900">
                                      {floor.name} {floor.floor_number ? `(Floor ${floor.floor_number})` : ''}
                                    </span>
                                    {floor.is_active === false && (
                                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        Inactive
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                      · {totalWardsOnFloor} Ward{totalWardsOnFloor === 1 ? '' : 's'} · {totalBedsOnFloor} Bed{totalBedsOnFloor === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => openCreateModal('ward', { buildingId: building.id, floorId: floor.id })}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="h-3 w-3 text-slate-500" /> Add Ward
                                </button>
                                {/* Floor Action Menu */}
                                {(() => {
                                  const fHasChildren = (hierarchy.wards || []).some(w => w.floor_id === floor.id);
                                  const fReason = fHasChildren ? 'it contains wards in the hierarchy' : '';
                                  const menuKey = 'f_' + floor.id;

                                  return (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenActionMenuId(openActionMenuId === menuKey ? null : menuKey);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
                                        title="Floor actions"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </button>

                                      {openActionMenuId === menuKey && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-1 z-40 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null);
                                              openEntityModal('floor', 'edit', floor, { buildingId: building.id });
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                                          >
                                            <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                            <div>
                                              <div>Edit Floor</div>
                                              <div className="text-[10px] text-slate-400 font-normal">Modify number & name</div>
                                            </div>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleOpenActionModal(floor.is_active === false ? 'activate' : 'deactivate', 'floor', floor.id, floor.name, fHasChildren, fReason)}
                                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                              floor.is_active === false
                                                ? 'text-emerald-700 hover:bg-emerald-50'
                                                : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                            }`}
                                          >
                                            {floor.is_active === false ? (
                                              <>
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                <div>
                                                  <div>Reactivate Floor</div>
                                                  <div className="text-[10px] text-slate-400 font-normal">Restore to active use</div>
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                <div>
                                                  <div>Deactivate Floor</div>
                                                  <div className="text-[10px] text-slate-400 font-normal">Safely disable entity</div>
                                                </div>
                                              </>
                                            )}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleOpenActionModal('delete', 'floor', floor.id, floor.name, fHasChildren, fReason)}
                                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                              fHasChildren
                                                ? 'text-slate-500 hover:bg-slate-50'
                                                : 'text-rose-600 hover:bg-rose-50'
                                            }`}
                                          >
                                            <Trash2 className={`h-3.5 w-3.5 shrink-0 ${fHasChildren ? 'text-slate-400' : 'text-rose-500'}`} />
                                            <div>
                                              <div>Delete Floor</div>
                                              <div className="text-[10px] text-slate-400 font-normal">
                                                {fHasChildren ? 'Contains active wards' : 'Permanently remove'}
                                              </div>
                                            </div>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Level 2 Content: Wards inside Floor (Simple rows, NO rounded box/background) */}
                            {fOpen && (
                              <div className="pb-2">
                                {floor.wards.length === 0 ? (
                                  <div className="py-2 pl-12 sm:pl-16 flex items-center gap-3 text-xs text-slate-500">
                                    <span>No wards yet</span>
                                    <button
                                      onClick={() => openCreateModal('ward', { buildingId: building.id, floorId: floor.id })}
                                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
                                    >
                                      <Plus className="h-3 w-3" /> Add Ward
                                    </button>
                                  </div>
                                ) : (
                                  floor.wards.map(ward => {
                                    const wOpen = isOpen('w_' + ward.id);
                                    const totalRoomsInWard = ward.rooms.length;
                                    const totalBedsInWard = ward.rooms.reduce((sum, r) => sum + r.beds.length, 0);

                                    return (
                                      <div key={ward.id} className={`py-1 ${openActionMenuId === 'w_' + ward.id ? 'relative z-20' : ''}`}>
                                        {/* Ward Row: Clean unboxed row */}
                                        <div className="px-4 sm:px-5 py-1.5 pl-10 sm:pl-14 flex items-center justify-between gap-3 hover:bg-slate-50/40 transition-colors">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <button
                                              onClick={() => toggle('w_' + ward.id)}
                                              className="p-1 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                                              title={wOpen ? 'Collapse Ward' : 'Expand Ward'}
                                            >
                                              {wOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            </button>
                                            <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                              <Users className="h-3 w-3" />
                                            </div>
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-xs sm:text-sm text-slate-900">{ward.name}</span>
                                                {ward.is_active === false && (
                                                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    Inactive
                                                  </span>
                                                )}
                                                {ward.ward_type && (
                                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {ward.ward_type}
                                                  </span>
                                                )}
                                                {ward.gender_type && (
                                                  <span className="text-[10px] text-slate-400 font-medium">
                                                    {ward.gender_type}
                                                  </span>
                                                )}
                                                <span className="text-xs text-slate-400">
                                                  · {totalRoomsInWard} Room{totalRoomsInWard === 1 ? '' : 's'} · {totalBedsInWard} Bed{totalBedsInWard === 1 ? '' : 's'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                              onClick={() => openCreateModal('room', { wardId: ward.id })}
                                              className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                                            >
                                              <Plus className="h-3 w-3 text-slate-500" /> Add Room
                                            </button>
                                            {/* Ward Action Menu */}
                                            {(() => {
                                              const wHasChildren = (hierarchy.rooms || []).some(r => r.ward_id === ward.id);
                                              const wReason = wHasChildren ? 'it contains rooms/beds in the hierarchy' : '';
                                              const menuKey = 'w_' + ward.id;

                                              return (
                                                <div className="relative">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenActionMenuId(openActionMenuId === menuKey ? null : menuKey);
                                                    }}
                                                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
                                                    title="Ward actions"
                                                  >
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                  </button>

                                                  {openActionMenuId === menuKey && (
                                                    <div
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="absolute right-0 top-full mt-1 z-40 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                                                    >
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setOpenActionMenuId(null);
                                                          openEntityModal('ward', 'edit', ward, { buildingId: building.id, floorId: floor.id });
                                                        }}
                                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                                                      >
                                                        <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        <div>
                                                          <div>Edit Ward</div>
                                                          <div className="text-[10px] text-slate-400 font-normal">Modify name & settings</div>
                                                        </div>
                                                      </button>

                                                      <button
                                                        type="button"
                                                        onClick={() => handleOpenActionModal(ward.is_active === false ? 'activate' : 'deactivate', 'ward', ward.id, ward.name, wHasChildren, wReason)}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                          ward.is_active === false
                                                            ? 'text-emerald-700 hover:bg-emerald-50'
                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                                        }`}
                                                      >
                                                        {ward.is_active === false ? (
                                                          <>
                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                            <div>
                                                              <div>Reactivate Ward</div>
                                                              <div className="text-[10px] text-slate-400 font-normal">Restore to active use</div>
                                                            </div>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                            <div>
                                                              <div>Deactivate Ward</div>
                                                              <div className="text-[10px] text-slate-400 font-normal">Safely disable entity</div>
                                                            </div>
                                                          </>
                                                        )}
                                                      </button>

                                                      <button
                                                        type="button"
                                                        onClick={() => handleOpenActionModal('delete', 'ward', ward.id, ward.name, wHasChildren, wReason)}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                          wHasChildren
                                                            ? 'text-slate-500 hover:bg-slate-50'
                                                            : 'text-rose-600 hover:bg-rose-50'
                                                        }`}
                                                      >
                                                        <Trash2 className={`h-3.5 w-3.5 shrink-0 ${wHasChildren ? 'text-slate-400' : 'text-rose-500'}`} />
                                                        <div>
                                                          <div>Delete Ward</div>
                                                          <div className="text-[10px] text-slate-400 font-normal">
                                                            {wHasChildren ? 'Contains active rooms' : 'Permanently remove'}
                                                          </div>
                                                        </div>
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>

                                        {/* Level 3 Content: Rooms inside Ward (Simple rows, NO card, NO vertical guide line) */}
                                        {wOpen && (
                                          <div className="pb-1">
                                            {ward.rooms.length === 0 ? (
                                              <div className="py-2 pl-14 sm:pl-20 flex items-center gap-3 text-xs text-slate-500">
                                                <span>No rooms yet</span>
                                                <button
                                                  onClick={() => openCreateModal('room', { wardId: ward.id })}
                                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
                                                >
                                                  <Plus className="h-3 w-3" /> Add Room
                                                </button>
                                              </div>
                                            ) : (
                                              ward.rooms.map(room => {
                                                const rOpen = isOpen('r_' + room.id);
                                                const totalBedsInRoom = room.beds.length;

                                                return (
                                                  <div key={room.id} className={`py-1 ${openActionMenuId === 'r_' + room.id ? 'relative z-20' : ''}`}>
                                                    {/* Room Row: Simple row */}
                                                    <div className="px-4 sm:px-5 py-1.5 pl-14 sm:pl-20 flex items-center justify-between gap-3 hover:bg-slate-50/30 transition-colors">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <button
                                                          onClick={() => toggle('r_' + room.id)}
                                                          className="p-1 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                                                          title={rOpen ? 'Collapse Room' : 'Expand Room'}
                                                        >
                                                          {rOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                        </button>
                                                        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                          <DoorOpen className="h-3 w-3" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                                                          <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                                            Room {room.room_number}
                                                          </span>
                                                          {room.is_active === false && (
                                                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                              Inactive
                                                            </span>
                                                          )}
                                                          {room.room_type && (
                                                            <span className="text-xs text-slate-500 font-normal">
                                                              {room.room_type}
                                                            </span>
                                                          )}
                                                          <span className="text-xs text-slate-400">
                                                            · {totalBedsInRoom} Bed{totalBedsInRoom === 1 ? '' : 's'}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <button
                                                          onClick={() => openCreateModal('bed', { wardId: ward.id, roomId: room.id })}
                                                          className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                                                        >
                                                          <Plus className="h-3 w-3 text-slate-500" /> Add Bed
                                                        </button>
                                                        {/* Room Action Menu */}
                                                        {(() => {
                                                          const rHasChildren = (hierarchy.beds || []).some(b => b.room_id === room.id);
                                                          const rReason = rHasChildren ? 'it contains beds in the hierarchy' : '';
                                                          const menuKey = 'r_' + room.id;

                                                          return (
                                                            <div className="relative">
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  setOpenActionMenuId(openActionMenuId === menuKey ? null : menuKey);
                                                                }}
                                                                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
                                                                title="Room actions"
                                                              >
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                              </button>

                                                              {openActionMenuId === menuKey && (
                                                                <div
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="absolute right-0 top-full mt-1 z-40 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                                                                >
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                      setOpenActionMenuId(null);
                                                                      openEntityModal('room', 'edit', room, { wardId: ward.id });
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                                                                  >
                                                                    <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                                    <div>
                                                                      <div>Edit Room</div>
                                                                      <div className="text-[10px] text-slate-400 font-normal">Modify number & rate</div>
                                                                    </div>
                                                                  </button>

                                                                  <button
                                                                    type="button"
                                                                    onClick={() => handleOpenActionModal(room.is_active === false ? 'activate' : 'deactivate', 'room', room.id, `Room ${room.room_number}`, rHasChildren, rReason)}
                                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                                      room.is_active === false
                                                                        ? 'text-emerald-700 hover:bg-emerald-50'
                                                                        : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                                                    }`}
                                                                  >
                                                                    {room.is_active === false ? (
                                                                      <>
                                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                        <div>
                                                                          <div>Reactivate Room</div>
                                                                          <div className="text-[10px] text-slate-400 font-normal">Restore to active use</div>
                                                                        </div>
                                                                      </>
                                                                    ) : (
                                                                      <>
                                                                        <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                                        <div>
                                                                          <div>Deactivate Room</div>
                                                                          <div className="text-[10px] text-slate-400 font-normal">Safely disable entity</div>
                                                                        </div>
                                                                      </>
                                                                    )}
                                                                  </button>

                                                                  <button
                                                                    type="button"
                                                                    onClick={() => handleOpenActionModal('delete', 'room', room.id, `Room ${room.room_number}`, rHasChildren, rReason)}
                                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                                      rHasChildren
                                                                        ? 'text-slate-500 hover:bg-slate-50'
                                                                        : 'text-rose-600 hover:bg-rose-50'
                                                                    }`}
                                                                  >
                                                                    <Trash2 className={`h-3.5 w-3.5 shrink-0 ${rHasChildren ? 'text-slate-400' : 'text-rose-500'}`} />
                                                                    <div>
                                                                      <div>Delete Room</div>
                                                                      <div className="text-[10px] text-slate-400 font-normal">
                                                                        {rHasChildren ? 'Contains active beds' : 'Permanently remove'}
                                                                      </div>
                                                                    </div>
                                                                  </button>
                                                                </div>
                                                              )}
                                                            </div>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>

                                                    {/* Level 4 Content: BED CARDS (The ONLY cards inside the building) */}
                                                    {rOpen && (
                                                      <div>
                                                        {room.beds.length === 0 ? (
                                                          <div className="py-2 pl-18 sm:pl-26 flex items-center gap-3 text-xs text-slate-500">
                                                            <span>No beds yet</span>
                                                            <button
                                                              onClick={() => openCreateModal('bed', { wardId: ward.id, roomId: room.id })}
                                                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
                                                            >
                                                              <Plus className="h-3 w-3" /> Add Bed
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pt-2 pb-3 px-4 sm:px-5 pl-16 sm:pl-26">
                                                            {room.beds.map(bed => {
                                                              const adm = getBedAdmission(bed.id);
                                                              const statusCfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.AVAILABLE;

                                                              return (
                                                                <div
                                                                  key={bed.id}
                                                                  className={`bg-white border rounded-xl p-3 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between min-h-[135px] ${
                                                                    openActionMenuId === 'bed_' + bed.id ? 'relative z-30' : 'relative z-auto'
                                                                  } ${
                                                                    bed.status === 'OCCUPIED'
                                                                      ? 'border-rose-200/70 bg-rose-50/15'
                                                                      : bed.status === 'CLEANING'
                                                                      ? 'border-amber-200/70 bg-amber-50/15'
                                                                      : 'border-slate-200 hover:border-slate-300'
                                                                  }`}
                                                                >
                                                                  <div className="space-y-2">
                                                                    {/* Bed Header: [icon] Bed 01 + Status Pill */}
                                                                    <div className="flex items-center justify-between gap-1">
                                                                      <div className="flex items-center gap-1.5 min-w-0">
                                                                        <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                                          <BedDouble className="h-3 w-3" />
                                                                        </div>
                                                                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                                                          Bed {bed.bed_number}
                                                                        </span>
                                                                      </div>
                                                                      <div className="flex items-center gap-1">
                                                                        {bed.is_active === false && (
                                                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                                                                            Inactive
                                                                          </span>
                                                                        )}
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusCfg.badge}`}>
                                                                        {statusCfg.label}
                                                                      </span>
                                                                    </div>
                                                                    </div>

                                                                    {/* Bed Details: Prioritized without redundant hierarchy text */}
                                                                    {bed.status === 'OCCUPIED' && adm ? (
                                                                      <div className="space-y-0.5 text-xs pt-0.5">
                                                                        <p className="font-semibold text-slate-900 truncate">
                                                                          {adm.patientName}
                                                                        </p>
                                                                        <p className="text-[11px] font-mono text-slate-500">
                                                                          #{adm.admission_number || adm.admissionNumber}
                                                                        </p>
                                                                        {adm.admittingDoctorName && (
                                                                          <p className="text-[11px] text-slate-600 truncate">
                                                                            Dr. {adm.admittingDoctorName}
                                                                          </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500 font-medium pt-0.5">
                                                                          ₹{Number(bed.daily_rate).toFixed(0)} / day
                                                                        </p>
                                                                      </div>
                                                                    ) : bed.status === 'CLEANING' ? (
                                                                      <div className="space-y-1.5 pt-0.5">
                                                                        <p className="text-xs font-semibold text-slate-700">
                                                                          ₹{Number(bed.daily_rate).toFixed(0)} / day
                                                                        </p>
                                                                        <button
                                                                          onClick={(e) => handleQuickMarkCleaned(e, bed)}
                                                                          className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-2xs transition-colors flex items-center justify-center gap-1"
                                                                        >
                                                                          <CheckCircle2 className="h-3 w-3" /> Mark Available
                                                                        </button>
                                                                      </div>
                                                                    ) : (
                                                                      <div className="pt-0.5">
                                                                        <p className="text-xs font-semibold text-slate-800">
                                                                          ₹{Number(bed.daily_rate).toFixed(0)} / day
                                                                        </p>
                                                                      </div>
                                                                    )}
                                                                  </div>

                                                                  {/* Bed Card Footer */}
                                                                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                                    <button
                                                                      onClick={() => handleOpenBedDetails(bed)}
                                                                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors text-xs"
                                                                    >
                                                                      <Eye className="h-3 w-3" /> Details &amp; History
                                                                    </button>
                                                                    {/* Bed Action Menu */}
                                                                    {(() => {
                                                                      const hasBedAdmissions = (admissions || []).some(a => a.bed_id === bed.id || a.bedId === bed.id);
                                                                      const hasBedTransitions = bed.status !== 'AVAILABLE';
                                                                      const isBedReferenced = hasBedAdmissions || hasBedTransitions;
                                                                      const bedReason = hasBedAdmissions
                                                                        ? 'inpatient admissions reference this bed'
                                                                        : hasBedTransitions
                                                                        ? 'historical status and audit logs exist for this bed'
                                                                        : '';
                                                                      const menuKey = 'bed_' + bed.id;

                                                                      return (
                                                                        <div className="relative">
                                                                          <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              setOpenActionMenuId(openActionMenuId === menuKey ? null : menuKey);
                                                                            }}
                                                                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                                                                            title="Bed actions"
                                                                          >
                                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                                          </button>

                                                                          {openActionMenuId === menuKey && (
                                                                            <div
                                                                              onClick={(e) => e.stopPropagation()}
                                                                              className="absolute right-0 bottom-full mb-1 z-40 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                                                                            >
                                                                              <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                  setOpenActionMenuId(null);
                                                                                  openEntityModal('bed', 'edit', bed, { wardId: ward.id, roomId: room.id });
                                                                                }}
                                                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                                                                              >
                                                                                <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                                                <div>
                                                                                  <div>Edit Bed</div>
                                                                                  <div className="text-[10px] text-slate-400 font-normal">Edit bed number & rate</div>
                                                                                </div>
                                                                              </button>

                                                                              <button
                                                                                type="button"
                                                                                onClick={() => handleOpenActionModal(bed.is_active === false ? 'activate' : 'deactivate', 'bed', bed.id, `Bed ${bed.bed_number}`, isBedReferenced, bedReason)}
                                                                                disabled={bed.status === 'OCCUPIED'}
                                                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                                                  bed.status === 'OCCUPIED'
                                                                                    ? 'opacity-50 cursor-not-allowed text-slate-400'
                                                                                    : bed.is_active === false
                                                                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                                                                }`}
                                                                              >
                                                                                {bed.is_active === false ? (
                                                                                  <>
                                                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                                    <div>
                                                                                      <div>Reactivate Bed</div>
                                                                                      <div className="text-[10px] text-slate-400 font-normal">Set status to AVAILABLE</div>
                                                                                    </div>
                                                                                  </>
                                                                                ) : (
                                                                                  <>
                                                                                    <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                                                    <div>
                                                                                      <div>Deactivate Bed</div>
                                                                                      <div className="text-[10px] text-slate-400 font-normal">Set status to BLOCKED</div>
                                                                                    </div>
                                                                                  </>
                                                                                )}
                                                                              </button>

                                                                              <button
                                                                                type="button"
                                                                                onClick={() => handleOpenActionModal('delete', 'bed', bed.id, `Bed ${bed.bed_number}`, isBedReferenced, bedReason)}
                                                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                                                                  isBedReferenced
                                                                                    ? 'text-slate-500 hover:bg-slate-50'
                                                                                    : 'text-rose-600 hover:bg-rose-50'
                                                                                }`}
                                                                              >
                                                                                <Trash2 className={`h-3.5 w-3.5 shrink-0 ${isBedReferenced ? 'text-slate-400' : 'text-rose-500'}`} />
                                                                                <div>
                                                                                  <div>Delete Bed</div>
                                                                                  <div className="text-[10px] text-slate-400 font-normal">
                                                                                    {isBedReferenced ? 'Historical records exist' : 'Permanently remove'}
                                                                                  </div>
                                                                                </div>
                                                                              </button>
                                                                            </div>
                                                                          )}
                                                                        </div>
                                                                      );
                                                                    })()}
                                                                  </div>
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. BED DETAILS & AUDIT HISTORY MODAL */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 pb-10 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl flex flex-col max-h-[calc(100vh-7.5rem)] text-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <span className="font-bold text-sm text-slate-900">Bed {selectedBed.bed_number} Details &amp; History</span>
              <button
                onClick={() => { setSelectedBed(null); setBedDetails(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="px-6 pt-5 pb-8 overflow-y-auto space-y-5 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {detailsLoading ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mb-2" />
                  <p className="italic">Loading bed details and audit history...</p>
                </div>
              ) : bedDetails ? (
                <>
                  {/* Location Context */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Hierarchy Location</span>
                    <p className="font-semibold text-slate-800">
                      {bedDetails.building?.name || 'Building'} &rarr; {bedDetails.floor?.name || 'Floor'} &rarr; {bedDetails.ward?.name || 'Ward'} &rarr; Room {bedDetails.room?.room_number || '-'} &rarr; Bed {bedDetails.bed?.bed_number}
                    </p>
                    <div className="flex items-center justify-between pt-1.5 text-xs text-slate-600">
                      <span>Daily Rate: <strong className="text-slate-900">₹{Number(bedDetails.bed?.daily_rate).toFixed(0)} / day</strong></span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[bedDetails.bed?.status]?.badge || 'bg-slate-100 text-slate-800'}`}>
                        {bedDetails.bed?.status}
                      </span>
                    </div>
                  </div>

                  {/* Active Inpatient Info */}
                  {bedDetails.currentAdmission && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-rose-600" />
                          Current Inpatient: {bedDetails.currentAdmission.patientName}
                        </span>
                        <span className="font-mono text-[10px] bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded">
                          #{bedDetails.currentAdmission.admissionNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Admitted on: {new Date(bedDetails.currentAdmission.admissionDate).toLocaleDateString()}
                      </p>
                      {bedDetails.currentAdmission.admittingDoctorName && (
                        <p className="text-[11px] text-slate-600">
                          Admitting Doctor: Dr. {bedDetails.currentAdmission.admittingDoctorName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status Update Form */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <span className="font-bold uppercase text-[11px] text-slate-700 block flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-blue-600" />
                      Update Bed Status
                    </span>

                    {/* Business Rule Notice for OCCUPIED beds */}
                    {selectedBed.status === 'OCCUPIED' ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                        <p className="font-semibold text-xs flex items-center gap-1.5">
                          <Ban className="h-4 w-4 text-amber-600 shrink-0" />
                          Occupied Bed Lifecycle Guard
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          This bed is currently assigned to an active inpatient admission. Manual status updates are restricted. To release this bed, complete the Doctor Inpatient Discharge workflow (which safely moves the bed from <strong>OCCUPIED &rarr; CLEANING</strong>).
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Quick Action for CLEANING beds */}
                        {selectedBed.status === 'CLEANING' && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-xs text-emerald-900">Bed is Sanitizing (CLEANING)</p>
                              <p className="text-[10px] text-emerald-700">Ready to return bed to service after housekeeping?</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                handleQuickMarkCleaned(e, selectedBed);
                                setSelectedBed(null);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Available
                            </button>
                          </div>
                        )}

                        <form onSubmit={handleUpdateBedStatus} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Status</label>
                              <select
                                value={statusUpdateData.newStatus}
                                onChange={e => setStatusUpdateData(p => ({ ...p, newStatus: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                              >
                                {ALL_STATUS_KEYS.map(st => {
                                  const isCurrent = selectedBed.status === st;
                                  const isAllowed = isCurrent || (VALID_BED_TRANSITIONS[selectedBed.status] || []).includes(st);
                                  const isAdmissionOnly = st === 'OCCUPIED';
                                  const isDisabled = isAdmissionOnly || !isAllowed;

                                  let labelSuffix = '';
                                  if (isCurrent) labelSuffix = ' (Current)';
                                  else if (isAdmissionOnly) labelSuffix = ' (Admission Only)';
                                  else if (!isAllowed) labelSuffix = ' (Invalid Transition)';

                                  return (
                                    <option
                                      key={st}
                                      value={st}
                                      disabled={isDisabled}
                                    >
                                      {STATUS_CONFIG[st].label}{labelSuffix}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason / Note</label>
                              <input
                                type="text"
                                placeholder="e.g. Scheduled sanitization"
                                value={statusUpdateData.reason}
                                onChange={e => setStatusUpdateData(p => ({ ...p, reason: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={
                                statusUpdateLoading ||
                                statusUpdateData.newStatus === selectedBed.status ||
                                !(VALID_BED_TRANSITIONS[selectedBed.status] || []).includes(statusUpdateData.newStatus)
                              }
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                              {statusUpdateLoading ? 'Updating...' : 'Save Status Change'}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>

                  {/* Audit Trail List */}
                  <div className="border-t border-slate-100 pt-4 space-y-2.5">
                    <span className="font-bold uppercase text-[11px] text-slate-700 block flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      Status Audit Trail
                    </span>
                    {(!bedDetails.history || bedDetails.history.length === 0) ? (
                      <p className="text-slate-400 italic py-2 bg-slate-50 rounded-xl text-center">
                        No prior status changes recorded for this bed.
                      </p>
                    ) : (
                      <div
                        className="space-y-2 max-h-48 overflow-y-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {bedDetails.history.map((h, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between font-semibold">
                              <span>
                                {h.previous_status || 'INITIAL'} &rarr; <span className="text-blue-700">{h.new_status}</span>
                              </span>
                              <span className="text-slate-400 font-normal text-[10px]">
                                {new Date(h.created_at).toLocaleString()}
                              </span>
                            </div>
                            {h.reason && <p className="text-slate-600 italic">"{h.reason}"</p>}
                            <div className="flex items-center justify-between pt-0.5 text-slate-400 text-[10px]">
                              {h.user_role && <span>By role: <strong className="text-slate-600">{h.user_role}</strong></span>}
                              {h.related_admission_id && <span className="font-mono text-[9px] bg-slate-200/60 px-1 rounded">Ref: {h.related_admission_id.slice(0, 8)}...</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean bottom spacer for comfortable breathing room */}
                  <div className="h-6 shrink-0"></div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 6. ENTITY CREATION MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl text-xs overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <span className="font-bold text-sm text-slate-900 capitalize">{modalMode === 'edit' ? `Edit ${modalType}` : `Create ${modalType}`}</span>
              <button
                onClick={() => { setModalType(null); setEditingEntity(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEntitySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Building Fields */}
              {modalType === 'building' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Building Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Hospital Tower"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Building Code</label>
                    <input
                      type="text"
                      placeholder="e.g. BLD-A"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Floor Fields */}
              {modalType === 'floor' && (
                <>
                  {modalMode === 'edit' ? (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Building</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        {(hierarchy.buildings || []).find(b => b.id === formData.buildingId)?.name || 'Parent Building'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Parent Building *</label>
                      <select
                        required
                        value={formData.buildingId || ''}
                        onChange={e => setFormData({ ...formData, buildingId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="">Select Building</option>
                        {(hierarchy.buildings || []).map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Floor Number *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1"
                      value={formData.floorNumber !== undefined ? formData.floorNumber : ''}
                      onChange={e => setFormData({ ...formData, floorNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Floor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. First Floor"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Ward Fields */}
              {modalType === 'ward' && (
                <>
                  {modalMode === 'edit' ? (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Floor</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        {(() => {
                          const flr = (hierarchy.floors || []).find(f => f.id === formData.floorId);
                          const bld = (hierarchy.buildings || []).find(b => b.id === flr?.building_id);
                          return `${bld?.name || 'Building'} → ${flr?.name || 'Floor'} (Floor ${flr?.floor_number ?? ''})`;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Parent Floor *</label>
                      <select
                        required
                        value={formData.floorId || ''}
                        onChange={e => setFormData({ ...formData, floorId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="">Select Floor</option>
                        {(hierarchy.floors || []).map(f => {
                          const b = (hierarchy.buildings || []).find(bld => bld.id === f.building_id);
                          return (
                            <option key={f.id} value={f.id}>
                              {b?.name || 'Building'} &rarr; {f.name} (Floor {f.floor_number})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Ward Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Intensive Care Unit (ICU)"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ward Type</label>
                      <select
                        value={formData.type || 'General'}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="General">General</option>
                        <option value="ICU">ICU</option>
                        <option value="CCU">CCU</option>
                        <option value="NICU">NICU</option>
                        <option value="Maternity">Maternity</option>
                        <option value="Pediatric">Pediatric</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                      <select
                        value={formData.genderDesignation || 'Mixed'}
                        onChange={e => setFormData({ ...formData, genderDesignation: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="Mixed">Mixed</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Room Fields */}
              {modalType === 'room' && (
                <>
                  {modalMode === 'edit' ? (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ward</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        {(hierarchy.wards || []).find(w => w.id === formData.wardId)?.name || 'Parent Ward'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Parent Ward *</label>
                      <select
                        required
                        value={formData.wardId || ''}
                        onChange={e => setFormData({ ...formData, wardId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="">Select Ward</option>
                        {(hierarchy.wards || []).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Room Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101"
                      value={formData.roomNumber || ''}
                      onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Room Type</label>
                    <select
                      value={formData.roomType || 'Standard'}
                      onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="Standard">Standard Multi-Bed</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="Private">Private Single</option>
                      <option value="Isolation">Isolation</option>
                    </select>
                  </div>
                </>
              )}

              {/* Bed Fields */}
              {modalType === 'bed' && (
                <>
                  {modalMode === 'edit' ? (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Room</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        {(() => {
                          const rm = (hierarchy.rooms || []).find(r => r.id === formData.roomId);
                          const wd = (hierarchy.wards || []).find(w => w.id === rm?.ward_id);
                          return `${wd?.name || 'Ward'} → Room ${rm?.room_number || ''}`;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Parent Ward *</label>
                        <select
                          required
                          value={formData.wardId || ''}
                          onChange={e => {
                            const wId = e.target.value;
                            const firstR = (hierarchy.rooms || []).find(r => r.ward_id === wId);
                            setFormData({ ...formData, wardId: wId, roomId: firstR?.id || '' });
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                        >
                          <option value="">Select Ward</option>
                          {(hierarchy.wards || []).map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Parent Room *</label>
                        <select
                          required
                          value={formData.roomId || ''}
                          onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                        >
                          <option value="">Select Room</option>
                          {(hierarchy.rooms || [])
                            .filter(r => !formData.wardId || r.ward_id === formData.wardId)
                            .map(r => (
                              <option key={r.id} value={r.id}>Room {r.room_number}</option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Bed Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bed-01"
                      value={formData.bedNumber || ''}
                      onChange={e => setFormData({ ...formData, bedNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Daily Rate (₹/day) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.dailyRate !== undefined ? formData.dailyRate : 500}
                      onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => { setModalType(null); setEditingEntity(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      {modalMode === 'edit' ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    modalMode === 'edit' ? `Save Changes` : `Create ${modalType}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 6. CONFIRMATION MODAL FOR DELETE VS DEACTIVATE */}
      {actionConfirm && actionConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            {actionConfirm.actionType === 'delete' && actionConfirm.hasReferences ? (
              /* Case 1: Cannot delete referenced entity -> Explain why and offer Deactivate */
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cannot Permanently Delete {actionConfirm.entityType.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="font-semibold text-slate-800">"{actionConfirm.name}"</strong> cannot be permanently deleted because {actionConfirm.reason || 'historical records or active child entities depend on it'}.
                  </p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    To preserve hospital clinical integrity and historical records, you can safely <span className="font-semibold text-slate-800">deactivate</span> it instead. {actionConfirm.entityType === 'bed' ? 'The bed status will be set to BLOCKED.' : ''}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionConfirm(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setActionConfirm(prev => ({ ...prev, actionType: 'deactivate' }));
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" /> Deactivate Instead
                  </button>
                </div>
              </div>
            ) : actionConfirm.actionType === 'delete' ? (
              /* Case 2: Permanent deletion for unused entity */
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Permanently Delete {actionConfirm.entityType.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Are you sure you want to permanently delete <strong className="font-semibold text-slate-800">"{actionConfirm.name}"</strong>?
                  </p>
                  <p className="text-xs text-rose-700 mt-2 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 leading-relaxed">
                    This entity has no child dependencies and no historical records. It will be permanently removed from the hospital hierarchy. This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionConfirm(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteAction}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Confirm Delete</span>
                  </button>
                </div>
              </div>
            ) : actionConfirm.actionType === 'activate' ? (
              /* Case 3: Reactivation */
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reactivate {actionConfirm.entityType.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Are you sure you want to reactivate <strong className="font-semibold text-slate-800">"{actionConfirm.name}"</strong>?
                  </p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {actionConfirm.entityType === 'bed'
                      ? 'The bed status will be transitioned back to AVAILABLE and returned to active inpatient service.'
                      : `This ${actionConfirm.entityType} will be restored to active service in the hospital.`}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionConfirm(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    <span>Confirm Reactivation</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Case 4: Deactivation */
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Ban className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Deactivate {actionConfirm.entityType.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Are you sure you want to deactivate <strong className="font-semibold text-slate-800">"{actionConfirm.name}"</strong>?
                  </p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {actionConfirm.entityType === 'bed'
                      ? 'The bed will be set to BLOCKED status and safely taken out of active admission service. All historical admissions and audit records will remain completely preserved.'
                      : `This ${actionConfirm.entityType} will be safely disabled from active use without deleting any historical records.`}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionConfirm(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteAction}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    <span>Confirm Deactivation</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
