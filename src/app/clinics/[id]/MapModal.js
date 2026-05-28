'use client';
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X } from 'lucide-react'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png'
})

export default function MapModal({ address, onClose }) {
  const [position, setPosition] = useState([51.505, -0.09]) // Default position (London)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) return

    // This is a simple geocoding approach without API key
    // Note: For production, you should use a proper geocoding service
    const geocodeAddress = async () => {
      try {
        // Try to get coordinates from browser's geolocation API first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setPosition([pos.coords.latitude, pos.coords.longitude])
              setLoading(false)
            },
            () => fallbackGeocode()
          )
        } else {
          await fallbackGeocode()
        }
      } catch (err) {
        setError('Could not determine location. Showing default map.')
        setLoading(false)
      }
    }

    // Fallback geocoding using OpenStreetMap's Nominatim (no API key needed)
    const fallbackGeocode = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          setError('Address not found. Showing default map.')
        }
      } catch (err) {
        setError('Geocoding service unavailable. Showing default map.')
      } finally {
        setLoading(false)
      }
    }

    geocodeAddress()
  }, [address])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl overflow-hidden shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading map...</p>
          </div>
        ) : (
          <MapContainer 
            center={position} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position}>
              <Popup>{address}</Popup>
            </Marker>
          </MapContainer>
        )}

        {error && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-md">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}