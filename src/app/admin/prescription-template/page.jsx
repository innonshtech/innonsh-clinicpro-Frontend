'use client';
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { Save, Sparkles, RefreshCw, CheckCircle, AlertCircle, Palette, FileText, Image as ImageIcon } from 'lucide-react';

export default function PrescriptionTemplateAdmin() {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Template State
  const [template, setTemplate] = useState({
    clinicLogo: '',
    doctorName: 'Dr. Sarah Jenkins',
    qualification: 'MD, MBBS (Cardiology)',
    headerText: 'Providing Quality Healthcare with Compassion',
    footerText: 'This prescription is valid only with a physical signature. For emergencies, please visit the nearest hospital.',
    primaryColor: '#2563eb', // Blue-600
    layoutStyle: 'classic' // classic, modern, minimalist
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      // Fetch clinic-specific prescription template from localStorage (Mock Persistence for Multi-Clinic)
      const saved = localStorage.getItem(`rx_template_${selectedClinic}`);
      if (saved) {
        try {
          setTemplate(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Load default template values
        const currentClinic = clinics.find(c => c._id === selectedClinic);
        setTemplate({
          clinicLogo: currentClinic?.logo || '',
          doctorName: 'Dr. Sarah Jenkins',
          qualification: 'MD, MBBS',
          headerText: `${currentClinic?.clinicName || 'Clinic'} - Patient Care Registry`,
          footerText: 'Valid for 15 days from date of consultation.',
          primaryColor: '#2563eb',
          layoutStyle: 'classic'
        });
      }
    }
  }, [selectedClinic, clinics]);

  const fetchClinics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-all-clinics`);
      const result = await res.json();
      if (result.success) {
        setClinics(result.data.clinics || []);
        if (result.data.clinics.length > 0) {
          setSelectedClinic(result.data.clinics[0]._id);
        }
      }
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: 'Failed to fetch clinics.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClinic) return;
    setIsSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      // Multi-clinic local storage persistence
      localStorage.setItem(`rx_template_${selectedClinic}`, JSON.stringify(template));

      // Simulate a small delay for premium feels
      await new Promise(r => setTimeout(r, 1000));
      setStatusMsg({ type: 'success', text: 'Template configuration deployed successfully!' });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setTemplate(prev => ({ ...prev, clinicLogo: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Fetching Clinics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
          Prescription Template Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize high-fidelity PDF layouts for different associated healthcare providers.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Editor Controls (Left - 5 cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Clinic Domain</label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {clinics.map(clinic => (
                <option key={clinic._id} value={clinic._id}>{clinic.clinicName}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Clinic Logo/Seal</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                {template.clinicLogo ? (
                  <img src={template.clinicLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold rounded-xl text-slate-700 transition-colors">
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Doctor Name</label>
              <input
                type="text"
                value={template.doctorName}
                onChange={(e) => setTemplate({ ...template, doctorName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Qualification</label>
              <input
                type="text"
                value={template.qualification}
                onChange={(e) => setTemplate({ ...template, qualification: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Header Subtext</label>
            <input
              type="text"
              value={template.headerText}
              onChange={(e) => setTemplate({ ...template, headerText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Footer Disclaimers</label>
            <textarea
              rows={3}
              value={template.footerText}
              onChange={(e) => setTemplate({ ...template, footerText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Theme Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={template.primaryColor}
                  onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                  className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-mono">{template.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Layout Preset</label>
              <select
                value={template.layoutStyle}
                onChange={(e) => setTemplate({ ...template, layoutStyle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="classic">Standard Classic</option>
                <option value="modern">Modern Clean</option>
                <option value="minimal">Minimalist Rx</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Template Config
          </button>

          {statusMsg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {statusMsg.text}
            </div>
          )}
        </div>

        {/* Live Preview (Right - 7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prescription Format Preview</label>

          <div 
            className="bg-white border border-slate-200 shadow-xl aspect-[1/1.4] max-w-[550px] mx-auto flex flex-col justify-between relative overflow-hidden text-slate-800"
            style={{ fontFamily: 'sans-serif' }}
          >
            {/* Top Header */}
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-teal-700">
                    {clinics.find(c => c._id === selectedClinic)?.clinicName || 'Health Care Medical Clinic'}
                  </h2>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">{template.doctorName}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{template.qualification}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Specialist Doctor For Medicine</p>
                  <p className="text-[10px] text-slate-400 font-mono">Reg No: 4573847</p>
                </div>
                
                <div className="flex flex-col items-end">
                  {template.clinicLogo ? (
                    <img src={template.clinicLogo} alt="logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold text-lg border border-teal-100">
                      H+
                    </div>
                  )}
                  <span className="text-xs font-black text-teal-700 mt-2">Healthcare</span>
                </div>
              </div>

              {/* Patient Details Row */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-b border-teal-600/30 py-3 mt-6 text-[11px] font-medium text-slate-700">
                <div className="flex border-b border-dotted border-slate-300 pb-1">
                  <span className="text-slate-400 w-20">Patient Name:</span>
                  <span className="font-bold">John Smith</span>
                </div>
                <div className="flex border-b border-dotted border-slate-300 pb-1">
                  <span className="text-slate-400 w-12">Age:</span>
                  <span className="font-bold">34 Years</span>
                </div>
                <div className="flex border-b border-dotted border-slate-300 pb-1">
                  <span className="text-slate-400 w-20">Address:</span>
                  <span className="font-bold truncate">New York, USA</span>
                </div>
                <div className="flex border-b border-dotted border-slate-300 pb-1">
                  <span className="text-slate-400 w-12">Date:</span>
                  <span className="font-bold">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Split Middle Prescription Workspace */}
            <div className="flex flex-1 border-t border-slate-200">
              {/* Left RX Column */}
              <div className="w-1/4 bg-teal-50/40 border-r border-teal-100 p-6">
                <span className="font-serif font-black text-4xl text-teal-700 block mb-4">℞</span>
              </div>

              {/* Right Medicine Content Workspace */}
              <div className="w-3/4 p-8 space-y-4">
                <div className="text-xs text-slate-700 font-medium">
                  <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">Paracetamol 500mg</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Dosage: 1-0-1 | Duration: 5 Days</p>
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">Amoxicillin 250mg</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Dosage: 1-1-1 | Duration: 7 Days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Footer with Triangles */}
            <div className="relative bg-teal-800 text-white p-4">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-teal-900 transform skew-x-[30deg] -translate-x-4"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-teal-900 transform -skew-x-[30deg] translate-x-4"></div>
              
              <div className="relative z-10 flex justify-between items-center text-[10px] px-4 font-medium">
                <div className="flex items-center gap-2">
                  <span>📞 +123 456 789</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌐 yourwebsite.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍 Road 7, Hill House</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
