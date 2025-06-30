import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { Icon, LatLngTuple } from 'leaflet'
import L from 'leaflet'
import { Plus, DollarSign, User, Navigation, MapPin, Eye, EyeOff, HelpCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useWelcomeModal } from '../hooks/useWelcomeModal'
import { PostNeedModal } from './PostNeedModal'
import { NeedDetailsModal } from './NeedDetailsModal'
import { PaymentModal } from './PaymentModal'
import { WelcomeModal } from './WelcomeModal'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
const proto = Icon.Default.prototype as Record<string, unknown>
delete proto._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Create custom icons for different marker types
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#fff"/>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const userLocationIcon = createCustomIcon('#3B82F6') // Blue for user location
const requestIcon = createCustomIcon('#EF4444') // Red for aid requests

interface AidRequest {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  amount_algo: number | null
  status: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  user_id: string
  category: string
  urgency: string
  address?: string
  fulfillment_status?: 'fulfilled' | 'unfulfilled' | null
  closed_at?: string | null
  assistance_type?: 'monetary' | 'service' | 'both'
  service_description?: string | null
}

interface Profile {
  id: string
  neighborhood_id: string | null
  reputation_score: number | null
}

interface Neighborhood {
  id: string
  lat: number
  lng: number
  radius_miles: number
  state: string
}

function MapEvents({ 
  onMapClick, 
  userLocation, 
  setUserLocation 
}: { 
  onMapClick: (lat: number, lng: number) => void
  userLocation: { lat: number; lng: number } | null
  setUserLocation: (location: { lat: number; lng: number } | null) => void
}) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
    locationfound: (e) => {
      setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
      map.flyTo(e.latlng, 14)
    },
    locationerror: (e) => {
      console.warn('Location access denied or unavailable:', e.message)
    }
  })

  // Request user location on component mount
  useEffect(() => {
    if (!userLocation) {
      map.locate({ setView: false, maxZoom: 16 })
    }
  }, [map, userLocation])

  return null
}

// Add privacy offset to coordinates (within ~100-500 meters)
const addPrivacyOffset = (lat: number, lng: number) => {
  const offsetRange = 0.005 // Roughly 500 meters
  const latOffset = (Math.random() - 0.5) * offsetRange
  const lngOffset = (Math.random() - 0.5) * offsetRange
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset
  }
}

// Helper component to display neighborhood info
function RequestNeighborhood({ userId }: { userId: string }) {
  const [neighborhood, setNeighborhood] = useState<string>('')
  
  useEffect(() => {
    const fetchNeighborhood = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('neighborhood_id')
          .eq('id', userId)
          .single()
        
        if (profile?.neighborhood_id) {
          const { data: hood } = await supabase
            .from('neighborhoods')
            .select('name, city, state')
            .eq('id', profile.neighborhood_id)
            .single()
          
          if (hood) {
            setNeighborhood(`${hood.name}, ${hood.city}`)
          }
        }
      } catch (error) {
        console.error('Error fetching neighborhood:', error)
      }
    }
    
    fetchNeighborhood()
  }, [userId])
  
  return neighborhood ? (
    <p className="text-xs text-gray-600 mb-2">
      📍 {neighborhood}
    </p>
  ) : null
}

export function Map() {
  const { user } = useAuth()
  const { showWelcomeModal, closeWelcomeModal, showWelcomeModalManually } = useWelcomeModal()
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([])
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [userNeighborhood, setUserNeighborhood] = useState<Neighborhood | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showPrivacyMode, setShowPrivacyMode] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  const defaultCenter: LatLngTuple = [40.7128, -74.0060] // New York City

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
    // Always load all aid requests, regardless of user status
    loadAllAidRequests()
  }, [user])

  useEffect(() => {
    if (userProfile?.neighborhood_id) {
      loadUserNeighborhood()
    }
  }, [userProfile])

  // Remove neighborhood filtering - always show all requests
  useEffect(() => {
    // Reload all requests when neighborhood changes
    loadAllAidRequests()
  }, [userNeighborhood])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, neighborhood_id, reputation_score')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setLoading(false)
    }
  }

  const loadUserNeighborhood = async () => {
    if (!userProfile?.neighborhood_id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, lat, lng, radius_miles, state')
        .eq('id', userProfile.neighborhood_id)
        .single()

      if (error) throw error
      setUserNeighborhood(data)
    } catch (error) {
      console.error('Error loading user neighborhood:', error)
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const loadLocalAidRequests = async () => {
    if (!userNeighborhood) {
      setLoading(false)
      return
    }

    try {
      // Get all open aid requests
      const { data: allRequests, error } = await supabase
        .from('aid_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter requests by distance from user's neighborhood center
      const localRequests = (allRequests || []).filter(request => {
        const distance = calculateDistance(
          userNeighborhood.lat,
          userNeighborhood.lng,
          request.lat,
          request.lng
        )
        return distance <= userNeighborhood.radius_miles
      })

      setAidRequests(localRequests)
    } catch (error) {
      console.error('Error loading local aid requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllAidRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAidRequests(data || [])
      
      // Auto-fit map to show all requests if there are any
      if (data && data.length > 0 && mapRef.current) {
        const bounds = data.reduce((bounds, request) => {
          return bounds.extend([request.lat, request.lng])
        }, mapRef.current.leafletElement?.getBounds() || L.latLngBounds([]))
        
        // Only auto-fit on initial load
        if (!userLocation) {
          setTimeout(() => {
            mapRef.current?.fitBounds(bounds, { padding: [50, 50] })
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error loading aid requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!user) return
    
    // Check if user has negative reputation
    if (userProfile?.reputation_score !== null && userProfile.reputation_score < 0) {
      alert('Users with negative reputation must be verified to post requests. Please complete verification first.')
      return
    }
    
    setClickedLocation({ lat, lng })
    setShowPostModal(true)
  }

  const handlePostSuccess = () => {
    setShowPostModal(false)
    setClickedLocation(null)
    // Always reload all requests
    loadAllAidRequests()
  }

  const handleMarkerClick = (request: AidRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
    // Fly to the request location
    if (mapRef.current) {
      mapRef.current.flyTo([request.lat, request.lng], 15, {
        duration: 1.5
      })
    }
  }

  const handleFundRequest = (request: AidRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(false)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setSelectedRequest(null)
    if (userNeighborhood) {
      loadLocalAidRequests()
    } else {
      loadAllAidRequests()
    }
  }

  const handleLocateUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16)
    } else if (mapRef.current) {
      // Try to get user location
      mapRef.current.locate({ setView: true, maxZoom: 16 })
    }
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return ''
    return `$${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100'
      case 'funded': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-orange-600 bg-orange-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)]">
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {user && (
          <MapEvents 
            onMapClick={handleMapClick} 
            userLocation={userLocation}
            setUserLocation={setUserLocation}
          />
        )}

        {/* User's current location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">Your Location</span>
                </div>
                <p className="text-sm text-gray-600">
                  Current GPS position
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        
        {/* Aid request markers with privacy offset */}
        {aidRequests.map((request) => {
          const displayLocation = showPrivacyMode 
            ? addPrivacyOffset(request.lat, request.lng)
            : { lat: request.lat, lng: request.lng }
          
          return (
            <Marker
              key={request.id}
              position={[displayLocation.lat, displayLocation.lng]}
              icon={requestIcon}
              eventHandlers={{
                click: () => handleMarkerClick(request),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">{request.title}</h3>
                  {request.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{request.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-green-600">
                      {request.amount_algo ? formatAmount(request.amount_algo) : ''}
                      {request.assistance_type === 'service' && 'Service'}
                      {request.assistance_type === 'both' && request.amount_algo && ' + Service'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{request.category}</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">{request.urgency}</span>
                  </div>
                  <RequestNeighborhood userId={request.user_id} />
                  {showPrivacyMode && (
                    <p className="text-xs text-gray-500 mb-2 italic">
                      📍 Approximate location for privacy
                    </p>
                  )}
                  <button 
                    onClick={() => handleMarkerClick(request)}
                    className="w-full mt-2 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
        {/* Help Button */}
        <button
          onClick={showWelcomeModalManually}
          className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          title="Show welcome guide"
        >
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </button>

        {/* Privacy Toggle */}
        <button
          onClick={() => setShowPrivacyMode(!showPrivacyMode)}
          className={`p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
            showPrivacyMode 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-gray-600'
          }`}
          title={showPrivacyMode ? 'Privacy mode ON' : 'Privacy mode OFF'}
        >
          {showPrivacyMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>

      {/* Bottom Left Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col space-y-2 z-[1000]">
        {/* GPS Location Button */}
        <button
          onClick={handleLocateUser}
          className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          title="Find my location"
        >
          <Navigation className="h-5 w-5 text-blue-600" />
        </button>

        {/* Show Info Panel Button (when panel is hidden) */}
        {!showInfoPanel && (
          <button
            onClick={() => setShowInfoPanel(true)}
            className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            title="Show info panel"
          >
            <MapPin className="h-5 w-5 text-blue-600" />
          </button>
        )}
      </div>

      {/* Floating Action Button */}
      {user && (
        <button
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 z-[1000]"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Enhanced Info Panel - Now closeable */}
      {showInfoPanel && (
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-sm z-[1000] transform transition-all duration-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-full">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold text-lg">AidMap</h2>
            </div>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Close info panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            Connect with your community to give and receive help.
          </p>
          
          {user ? (
            <div>
              <p className="text-blue-600 text-sm font-medium mb-2">
                Click anywhere on the map to post a need, or click markers to help others.
              </p>
              
              {userLocation && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 mb-2">
                  <Navigation className="h-3 w-3" />
                  <span>GPS location enabled</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-xs mb-2">
                {showPrivacyMode ? (
                  <>
                    <Eye className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Privacy mode: ON</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-600">Privacy mode: OFF</span>
                  </>
                )}
              </div>
              
              <p className="text-green-600 text-xs">
                Showing all community aid requests
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Sign in to post needs and help others in your community.
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center space-x-1 text-green-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">{aidRequests.length} active needs</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-600">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Community powered</span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      {showPrivacyMode && (
        <div className="absolute bottom-20 left-4 bg-green-50 border border-green-200 rounded-lg p-3 max-w-xs z-[1000]">
          <div className="flex items-start space-x-2">
            <Eye className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-800">Privacy Protected</h4>
              <p className="text-xs text-green-700">
                Request locations are offset for privacy while maintaining navigation utility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={closeWelcomeModal}
      />

      {showPostModal && (
        <PostNeedModal
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false)
            setClickedLocation(null)
          }}
          onSuccess={handlePostSuccess}
          initialLocation={clickedLocation}
        />
      )}

      {showDetailsModal && selectedRequest && (
        <NeedDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedRequest(null)
          }}
          aidRequest={selectedRequest}
          onFund={handleFundRequest}
        />
      )}

      {showPaymentModal && selectedRequest && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedRequest(null)
          }}
          aidRequest={selectedRequest}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}