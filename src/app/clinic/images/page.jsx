'use client';
import { API_BASE_URL } from '@/utils/api';
// // import { useState,useEffect } from 'react';
// import { Plus, Trash2 } from 'lucide-react';

// const initialImages = [
//   '/clinic/img1.jpg',
//   '/clinic/img2.jpg',
//   '/clinic/img3.jpg',
//   '/clinic/img4.jpg'
// ];

// export default function ManageImages() {



//   const [images, setImages] = useState(initialImages);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [imgToDelete, setImgToDelete] = useState(null);
//  const [isUploading, setIsUploading] = useState(false);
//  const[userID,setID]=useState("");
//   const [error, setError] = useState(null);
// const fetchClinicImages = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/clinic/fetch-images/${userID}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch images');
//       }

//       const data = await response.json();
//       console.log(data);
//       setImages(data.images || []); // Update state with fetched images
//       return data.images || [];
//     } catch (error) {
//       console.error('Error fetching clinic images:', error);
//       return [];
//     }
//   };
//  useEffect(() => {
//     const savedUser = localStorage.getItem('user');
//     const data = JSON.parse(savedUser);
//     console.log(data.id);
//     setID(data.id);
  
  
//   }, []);
//    useEffect(() => {
//     if (userID) {
//       fetchClinicImages();
//     }
//   }, [userID]);

//   const uploadImageToCloudinary = async (file) => {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);

//     const response = await fetch('/api/clinicImages', {
//       method: 'POST',
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error('Upload failed');
//     }

//     const data = await response.json();
//     return data.url;
//   } catch (error) {
//     console.error('Upload error:', error);
//     throw error;
//   }
// };
//   const handleDeleteClick = (img) => {
//     setImgToDelete(img);
//     setShowConfirm(true);
//   };

//   const confirmDelete = () => {
//     setImages(images.filter((img) => img !== imgToDelete));
//     setImgToDelete(null);
//     setShowConfirm(false);
//   };

//   const cancelDelete = () => {
//     setImgToDelete(null);
//     setShowConfirm(false);
//   };

// const handleImageUpload = async (e) => {
//   const files = Array.from(e.target.files);
//   if (files.length === 0) return;

//   setIsUploading(true);
//   setError(null);

//   // Replace with dynamic ID if needed

//   try {
//     for (const file of files) {
//       // 1. Upload to Cloudinary
//       const cloudinaryUrl = await uploadImageToCloudinary(file);
// console.log(cloudinaryUrl);
//       // 2. Save URL to your backend API
//       const response = await fetch(`${API_BASE_URL}/api/clinic/add-image/${userID}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ imageUrl: cloudinaryUrl }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to save image URL to backend');
//       }

//       const result = await response.json();
//       console.log('Image saved to backend:', result);

//       // 3. Update local state
//       setImages((prev) => [...prev, cloudinaryUrl]);
//     }
//   } catch (error) {
//     console.error('Error uploading images:', error);
//     setError('Failed to upload one or more images');
//   } finally {
//     setIsUploading(false);
//     e.target.value = null; // reset input
//   }
// };

// return (
//     <div className="p-6 max-w-6xl mx-auto">
//       <h2 className="text-3xl font-bold mb-2 text-blue-600">Manage Clinic Images</h2>
//       <p className="mb-6 text-gray-600">
//         Upload, view, and manage the images that represent your clinic.
//       </p>

//       {/* Upload Button */}
//       {/* <div className="mb-6">
//         <label
//           htmlFor="upload-input"
//           className="inline-flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg shadow"
//           title="Upload Clinic Images"
//         >
//           <Plus className="w-5 h-5" />
//           Upload Images
//         </label>
//         <input
//           id="upload-input"
//           type="file"
//           multiple
//           accept="image/*"
//           className="hidden"
//           onChange={(e) => {
//             const files = Array.from(e.target.files);
//             const newImages = files.map((file) => URL.createObjectURL(file));
//             setImages((prev) => [...prev, ...newImages]);
//             e.target.value = null; // reset input
//           }}
//         />
//       </div> */}
//       <div className="mb-6">
//         <label
//           htmlFor="upload-input"
//           className={`inline-flex items-center gap-2 cursor-pointer ${
//             isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
//           } text-white px-5 py-3 rounded-lg shadow`}
//           title="Upload Clinic Images"
//         >
//           {isUploading ? (
//             <span className="animate-spin">⏳</span>
//           ) : (
//             <Plus className="w-5 h-5" />
//           )}
//           {isUploading ? 'Uploading...' : 'Upload Images'}
//         </label>
//         <input
//           id="upload-input"
//           type="file"
//           multiple
//           accept="image/*"
//           className="hidden"
//           onChange={handleImageUpload}
//           disabled={isUploading}
//         />
//       </div>

//       {error && (
//         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
//           {error}
//         </div>
//       )}

//       {/* Images Grid */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
//         {images.length === 0 && (
//           <p className="col-span-full text-center text-gray-500">
//             No images uploaded yet.
//           </p>
//         )}
//         {images.map((img) => (
//           <div
//             key={img}
//             className="relative rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
//           >
//             <img
//               src={img}
//               alt="Clinic"
//               className="w-full h-48 object-cover"
//               loading="lazy"
//               onError={(e) => {
//                 e.target.onerror = null;
//               }}
//             />
//             <button
//               onClick={() => handleDeleteClick(img)}
//               className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full text-white shadow"
//               aria-label="Delete Image"
//               title="Delete Image"
//             >
//               <Trash2 className="w-5 h-5" />
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Delete Confirmation Modal */}
//       {showConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
//             <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
//             <p className="mb-6">Are you sure you want to delete this image?</p>
//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={cancelDelete}
//                 className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { Plus, Trash2, ImageOff, AlertCircle, Loader2 } from 'lucide-react';

export default function ManageImages() {
  const [images, setImages] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imgToDelete, setImgToDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userID, setID] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClinicImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userID) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-images/${userID}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const responseData = await response.json();

      if (responseData.success) {
        setImages(responseData.data.images || []);
      } else {
        setError(responseData.message || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching clinic images:', error);
      setError('Failed to load images. Please try again later.');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);
        setID(data.id);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Invalid user data');
      }
    } else {
      setError('User not found. Please login again.');
    }
  }, []);

  useEffect(() => {
    if (userID) {
      fetchClinicImages();
    }
  }, [userID]);

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/clinicImages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleDeleteClick = (img) => {
    setImgToDelete(img);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      // Call API to delete image from backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/delete-image/${userID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imageUrl: imgToDelete }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        setImages(responseData.data.images || images.filter((img) => img !== imgToDelete));
      } else {
        setError(responseData.message || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    } finally {
      setImgToDelete(null);
      setShowConfirm(false);
    }
  };

  const cancelDelete = () => {
    setImgToDelete(null);
    setShowConfirm(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed');
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Image size should be less than 5MB');
        }

        const cloudinaryUrl = await uploadImageToCloudinary(file);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/v1/clinic/add-image/${userID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ imageUrl: cloudinaryUrl }),
        });

        const responseData = await response.json();

        if (responseData.success) {
          setImages(responseData.data.images || (prev => [...prev, cloudinaryUrl]));
        } else {
          throw new Error(responseData.message || 'Failed to save image URL');
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.message || 'Failed to upload one or more images');
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset input
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-blue-600">Manage Clinic Images</h2>
      <p className="mb-6 text-gray-600">
        Upload, view, and manage the images that represent your clinic.
      </p>

      {/* Upload Button */}
      <div className="mb-6">
        <label
          htmlFor="upload-input"
          className={`inline-flex items-center gap-2 cursor-pointer ${
            isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white px-5 py-3 rounded-lg shadow transition-colors`}
          title="Upload Clinic Images"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </label>
        <input
          id="upload-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        <p className="mt-2 text-sm text-gray-500">
          Supported formats: JPG, PNG, WEBP. Max size: 5MB per image.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading images...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <ImageOff className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No images added yet</h3>
          <p className="text-gray-500 mt-1">Upload images to showcase your clinic</p>
        </div>
      )}

      {/* Images Grid */}
      {!isLoading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img}
              className="relative rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow group"
            >
              <img
                src={img}
                alt="Clinic"
                className="w-full h-48 object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-image.jpg'; // Fallback image
                }}
              />
              <button
                onClick={() => handleDeleteClick(img)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete Image"
                title="Delete Image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this image?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
