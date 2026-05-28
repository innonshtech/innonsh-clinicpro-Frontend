'use client';
import { API_BASE_URL } from '@/utils/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function RejectedPage() {
  const params = useParams();
  const router=useRouter();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data based on ID
    const fetchUser = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-by-id/${userId}`);
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

  const handleResubmit = () => {
     localStorage.removeItem('token'); 
    localStorage.removeItem('user');

    router.push('/register')
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Rejected
          </h1>
          
          <p className="text-gray-600 mb-6">
            Unfortunately, your request has been rejected. Please review the details below and consider resubmitting.
          </p>

          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
              <div className="text-sm text-gray-600">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Status:</strong> <span className="text-red-600 font-medium">Rejected</span></p>
                <p><strong>Submitted:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                {user.rejectionReason && (
                  <p><strong>Reason:</strong> {user.rejectionReason}</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-800 mb-2">Common Rejection Reasons:</h4>
            <ul className="text-sm text-red-700 text-left space-y-1">
              <li>• Incomplete or missing information</li>
              <li>• Invalid documentation</li>
              <li>• Does not meet eligibility criteria</li>
              <li>• Technical requirements not satisfied</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Resubmit Request
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('token'); 
    localStorage.removeItem('user');

    router.push('/')
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