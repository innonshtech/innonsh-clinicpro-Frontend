'use client';
import { useState } from 'react';

export default function PatientHistoryPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [history, setHistory] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy data - simulate fetched data
    const dummyData = {
      name,
      mobile,
      checkups: [
        {
          date: "2024-11-20",
          type: "General Checkup",
          doctor: "Dr. A. Sharma",
          notes: "Routine blood pressure & sugar test."
        },
        {
          date: "2025-01-15",
          type: "Dental",
          doctor: "Dr. R. Mehta",
          notes: "Tooth cleaning and cavity filling."
        }
      ],
      prescriptions: [
        { date: "2025-01-16", medicine: "Amoxicillin", dosage: "500mg twice a day" },
        { date: "2024-11-21", medicine: "Paracetamol", dosage: "650mg as needed" }
      ]
    };

    setHistory(dummyData); // trigger render of history UI
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      {/* FORM SECTION */}
      <div className="flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Track Patient History
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Know the medical records, checkups, prescriptions, and treatments.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-100"
                placeholder="Enter patient's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-100"
                placeholder="Enter 10-digit mobile number"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* HISTORY SECTION */}
      {history && (
        <div className="mt-10 bg-white rounded-2xl shadow-md max-w-4xl mx-auto p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Patient History for {history.name}
          </h3>

          {/* Checkups */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-blue-700 mb-2">Checkups</h4>
            {history.checkups.map((item, index) => (
              <div key={index} className="border-b border-gray-200 py-2">
                <p><strong>Date:</strong> {item.date}</p>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Doctor:</strong> {item.doctor}</p>
                <p><strong>Notes:</strong> {item.notes}</p>
              </div>
            ))}
          </div>

          {/* Prescriptions */}
          <div>
            <h4 className="text-lg font-semibold text-purple-700 mb-2">Prescriptions</h4>
            {history.prescriptions.map((item, index) => (
              <div key={index} className="border-b border-gray-200 py-2">
                <p><strong>Date:</strong> {item.date}</p>
                <p><strong>Medicine:</strong> {item.medicine}</p>
                <p><strong>Dosage:</strong> {item.dosage}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
