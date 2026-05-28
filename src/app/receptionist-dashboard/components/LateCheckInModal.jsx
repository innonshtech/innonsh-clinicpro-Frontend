'use client';
import React from 'react';
import { X, AlertTriangle, ArrowDownToLine, Zap } from 'lucide-react';

export default function LateCheckInModal({ patientName, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-amber-500 p-8 text-white text-center relative">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Late Arrival Detected</h3>
          <p className="text-amber-50 text-sm font-medium mt-1 uppercase tracking-widest opacity-90">
            {patientName} is arriving after slot time
          </p>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-gray-500 text-center font-medium px-4 mb-6">
            How would you like to handle this patient's position in the queue?
          </p>

          <button
            onClick={() => onSelect('keep_priority')}
            className="w-full flex items-center justify-between p-5 bg-blue-50 border border-blue-100 rounded-3xl hover:bg-blue-100 transition-all group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-blue-600 text-white rounded-2xl">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-black text-blue-900">Keep Priority</p>
                <p className="text-xs text-blue-600 font-bold">Inject into next available spot</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('end_of_queue')}
            className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-slate-100 transition-all group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-slate-600 text-white rounded-2xl">
                <ArrowDownToLine size={20} />
              </div>
              <div>
                <p className="font-black text-slate-900">Move to End</p>
                <p className="text-xs text-slate-500 font-bold">Place at the very back of queue</p>
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors pt-4"
          >
            Cancel Check-in
          </button>
        </div>
      </div>
    </div>
  );
}
