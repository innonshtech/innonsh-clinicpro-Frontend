'use client';
import { API_BASE_URL } from '@/utils/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function PendingRequestPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data based on ID
    const fetchUser = async () => {
      try {
        // Replace with your actual API endpoint
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-by-id/${userId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        if (result.success) {
          setUser(result.data.clinic);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Pending
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your request is currently being reviewed. We'll notify you once it's processed.
          </p>

          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
              <div className="text-sm text-gray-600">
                <p><strong>User ID:</strong> {user._id}</p>
                   <p><strong>Clinic Name:</strong> {user.clinicName}</p>
                <p><strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending</span></p>
                <p><strong>Submitted:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
            
            <button
            onClick={() => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');// 🔐 Clear the token
    router.push('/');      
  }}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
}