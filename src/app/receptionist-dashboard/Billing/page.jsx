'use client';
import { useState, useRef, useEffect } from 'react';
import {
  FiDownload,
  FiPrinter,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
  FiClock,
  FiX,
  FiEye
} from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '@/utils/api';

// --- SHARED COMPONENT: CLINICAL INVOICE ---
const InvoiceContent = ({ invoice, isPrint = false, refProp }) => {
  const medicines = invoice?.items?.filter(i => i.type === 'medicine') || [];
  const billItems = invoice?.items?.filter(i => i.type !== 'medicine') || [];

  return (
    <div ref={isPrint ? refProp : null} className={`p-8 max-w-3xl mx-auto ${isPrint ? '' : 'bg-white rounded-xl shadow-lg'}`}>
      <div className="border-b border-blue-200 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">INVOICE</h1>
            <p className="text-blue-600 mt-2">#{invoice?.id || 'INV-000'}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-800 font-semibold">Your Medical Clinic</p>
            <p className="text-blue-600 text-sm">Health Street, Medical Plaza</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Bill To</h2>
          <p className="text-blue-600 font-bold">{invoice?.client || 'Client Name'}</p>
        </div>
        <div className="text-right">
          <div className="mb-1"><span className="text-blue-600">Date: </span><span className="text-blue-800 font-medium">{invoice?.date}</span></div>
          <div className="mb-1"><span className="text-blue-600">Due Date: </span><span className="text-blue-800 font-medium">{invoice?.dueDate}</span></div>
          <div>
            <span className="text-blue-600">Status: </span>
            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${invoice?.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {invoice?.status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="border border-blue-200 rounded-lg overflow-hidden mb-8 shadow-sm">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-blue-600 uppercase tracking-widest">Description</th>
              <th className="px-6 py-3 text-right text-xs font-black text-blue-600 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-200">
            {billItems.map((item, index) => (
              <tr key={index} className="hover:bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-medium">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right font-bold">₹{item.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice?.diagnosis && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-blue-100">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FiEye /> Diagnosis & Clinical Notes
            </h3>
            <p className="text-sm font-bold text-slate-700">{invoice.diagnosis}</p>
          </div>
          {invoice?.followUpDate && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FiCalendar /> Recommended Follow-up
              </h3>
              <p className="text-sm font-black text-amber-700">
                {new Date(invoice.followUpDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}

      {medicines.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FiEye /> Prescription Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medicines.map((med, idx) => (
              <div key={idx} className="p-3 bg-white border border-blue-50 rounded-xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">{med.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-blue-100">
        <div className="w-64 text-right">
          <span className="text-blue-800 font-black text-lg block uppercase text-[10px] tracking-widest">Total Due</span>
          <span className="text-blue-800 font-black text-3xl block">₹{invoice?.amount?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef();

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const text = await res.text();
      
      if (!res.ok) {
        console.error(`Fetch failed with status ${res.status}:`, text);
        setLoading(false);
        return;
      }

      let response;
      try {
        response = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response. Response text:', text);
        setLoading(false);
        return;
      }

      if (response.success) {
        setInvoices(response.data.bills.map(bill => ({
          id: bill.billingId,
          _id: bill._id,
          client: `${bill.patientId?.firstName} ${bill.patientId?.lastName}`,
          patientCode: bill.patientId?.patientCode || 'N/A',
          date: new Date(bill.createdAt).toLocaleDateString(),
          dueDate: new Date(new Date(bill.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          amount: bill.finalAmount,
          diagnosis: bill.diagnosis || bill.visitId?.diagnosis,
          followUpDate: bill.followUpDate || bill.visitId?.followUpDate,
          status: bill.status.charAt(0).toUpperCase() + bill.status.slice(1),
          items: [
            ...bill.items.map(item => ({
              description: item.name,
              quantity: 1,
              price: item.amount,
              type: item.type
            })),
            ...(bill.items.some(i => i.type === 'medicine') ? [] : (bill.visitId?.medicines?.map(m => ({
              description: `${m.name} (${m.dosage})`,
              quantity: 1,
              price: 0,
              type: 'medicine'
            })) || []))
          ]
        })));
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `@page { size: auto; margin: 10mm; }`,
    onBeforePrint: () => setIsPrintModalOpen(false)
  });

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setIsPrintModalOpen(false);
    setSelectedInvoice(null);
  };

  const updateInvoiceStatus = async (id, newStatus) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/payment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          paymentAmount: selectedInvoice?.amount || 0,
          paymentMethod: 'cash'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchBills();
        closeModal();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-600 mt-1">Manage patient invoices, payments, and financial records</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-6">
        <div className="mb-6 relative max-w-md">
          <input
            type="text"
            placeholder="Search by Patient Code, Name, or Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-blue-50/20"
          />
          <FiSearch className="absolute left-3.5 top-3 text-blue-400" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-blue-100 shadow-sm">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Patient Code</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-blue-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-blue-400">Loading...</td></tr>
              ) : invoices.filter(invoice => 
                    (invoice.patientCode || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (invoice.client || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (invoice.id || '').toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-blue-50/50 cursor-pointer select-none" onDoubleClick={() => openInvoiceModal(invoice)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">{invoice.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{invoice.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">{invoice.patientCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800 font-bold">₹{invoice.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-[10px] font-black rounded-full uppercase tracking-widest 
                      ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => { setSelectedInvoice(invoice); setIsPrintModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all text-lg" title="Print Invoice"><FiPrinter /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-blue-50 p-6">
              <h2 className="text-xl font-black text-blue-800 uppercase tracking-tight">Invoice Details</h2>
              <button onClick={closeModal} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><FiX size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              <InvoiceContent invoice={selectedInvoice} />
            </div>
            <div className="bg-white px-8 py-6 border-t border-blue-50 flex justify-end gap-3">
              {selectedInvoice.status !== 'Paid' && (
                <button
                  onClick={() => updateInvoiceStatus(selectedInvoice._id, 'Paid')}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Collect Payment'}
                </button>
              )}
              <button onClick={closeModal} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-blue-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-blue-800 uppercase tracking-widest">Print Preview</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl"><FiX /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InvoiceContent invoice={selectedInvoice} isPrint={true} refProp={printRef} />
            </div>
            <div className="p-6 bg-slate-50 border-t border-blue-50 flex justify-end gap-3">
              <button onClick={handlePrint} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200">Confirm & Print</button>
              <button onClick={closeModal} className="px-10 py-4 bg-white text-slate-400 font-bold rounded-2xl border border-slate-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <InvoiceContent invoice={selectedInvoice} isPrint={true} refProp={printRef} />
      </div>
    </div>
    </div>
  );
}
