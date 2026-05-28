'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import {
  FileText, User, Calendar, HeartPulse, Pill, ClipboardList,
  Search, Filter, Download, Printer, Eye, Plus, X, Save, UserPlus
} from 'lucide-react';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('token')?.trim();
        const res = await fetch(`${API_BASE_URL}/api/v1/visit/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (result.success && result.data.visits) {
          const mapped = result.data.visits.map((v, index) => ({
            id: `MR-${new Date(v.createdAt).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
            patientName: `${v.patientId?.firstName || 'Unknown'} ${v.patientId?.lastName || 'Patient'}`,
            patientId: v.patientId?.patientCode || v.patientId?._id || 'N/A',
            date: new Date(v.createdAt).toLocaleDateString(),
            visitType: 'Consultation',
            diagnosis: v.diagnosis || 'General Observation',
            medications: v.medicines?.map(m => `${m.name} (${m.dosage || 'N/A'})`).join(', ') || 'None',
            notes: v.notes || 'No findings recorded'
          }));
          setRecords(mapped);
        }
      } catch (err) {
        console.error("Records Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record => 
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-1">View and manage patient clinical histories</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-12 text-gray-400 font-medium">Loading clinical records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-center py-12 text-gray-400 font-medium italic">No past consultation records found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase">Record #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase">PATIENT CODE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase">Diagnosis</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    onClick={() => { setSelectedRecord(record); setIsViewModalOpen(true); }}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{record.patientId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isViewModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" /> Medical Summary
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-bold">Patient: <span className="text-slate-800">{selectedRecord.patientName}</span></p>
                <p className="text-xs text-slate-500 font-bold">Date: <span className="text-slate-800">{selectedRecord.date}</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Diagnosis</label>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedRecord.diagnosis}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prescribed Medications</label>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedRecord.medications}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Clinical Notes</label>
                <p className="text-sm font-medium text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl leading-relaxed">{selectedRecord.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
