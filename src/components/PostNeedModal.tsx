import React, { useState, useEffect } from 'react'
import { X, MapPin, DollarSign, FileText, Tag, AlertTriangle, HandshakeIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface PostNeedModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialLocation?: { lat: number; lng: number } | null
}

const categories = [
  'food',
  'transportation',
  'childcare',
  'medical',
  'housing',
  'other'
]

const urgencyLevels = [
  'low',
  'medium',
  'high',
  'critical'
]

export function PostNeedModal({ isOpen, onClose, onSuccess, initialLocation }: PostNeedModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [urgency, setUrgency] = useState('medium')
  const [lat, setLat] = useState(initialLocation?.lat || 40.7128)
  const [lng, setLng] = useState(initialLocation?.lng || -74.0060)
  const [address, setAddress] = useState('')
  const [assistanceType, setAssistanceType] = useState<'monetary' | 'service' | 'both'>('monetary')
  const [serviceDescription, setServiceDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userNeighborhood, setUserNeighborhood] = useState<{name: string, city: string, state: string} | null>(null)

  useEffect(() => {
    if (initialLocation) {
      setLat(initialLocation.lat)
      setLng(initialLocation.lng)
    }
  }, [initialLocation])

  useEffect(() => {
    // Fetch user's neighborhood information
    const fetchUserNeighborhood = async () => {
      if (!user) return
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('neighborhood_id')
          .eq('id', user.id)
          .single()
        
        if (profile?.neighborhood_id) {
          const { data: neighborhood } = await supabase
            .from('neighborhoods')
            .select('name, city, state')
            .eq('id', profile.neighborhood_id)
            .single()
          
          if (neighborhood) {
            setUserNeighborhood(neighborhood)
          }
        }
      } catch (error) {
        console.error('Error fetching neighborhood:', error)
      }
    }
    
    fetchUserNeighborhood()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      let amountUSD: number | null = null
      if (assistanceType === 'monetary' || assistanceType === 'both') {
        amountUSD = parseFloat(amount)
        if (isNaN(amountUSD) || amountUSD <= 0) {
          setError('Please enter a valid amount for monetary assistance')
          setLoading(false)
          return
        }
      }
      
      if ((assistanceType === 'service' || assistanceType === 'both') && !serviceDescription.trim()) {
        setError('Please describe the service or help you need')
        setLoading(false)
        return
      }
      
      const { error } = await supabase
        .from('aid_requests')
        .insert([
          {
            user_id: user.id,
            title,
            description,
            category,
            urgency,
            amount_algo: amountUSD,
            lat,
            lng,
            address: address || null,
            status: 'open',
            assistance_type: assistanceType,
            service_description: (assistanceType === 'service' || assistanceType === 'both') ? serviceDescription : null
          }
        ])

      if (error) throw error

      onSuccess()
      // Reset form
      setTitle('')
      setDescription('')
      setAmount('')
      setCategory('food')
      setUrgency('medium')
      setAddress('')
      setAssistanceType('monetary')
      setServiceDescription('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]">
      <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Post Aid Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              What do you need help with? *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                placeholder="e.g., Groceries for family, School supplies"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Additional details *
            </label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 resize-none"
              placeholder="Provide more context about your need..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                Urgency *
              </label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  id="urgency"
                  required
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {urgencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Assistance Needed *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAssistanceType('monetary')}
                className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  assistanceType === 'monetary'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Money</span>
              </button>
              <button
                type="button"
                onClick={() => setAssistanceType('service')}
                className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  assistanceType === 'service'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <HandshakeIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Service</span>
              </button>
              <button
                type="button"
                onClick={() => setAssistanceType('both')}
                className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  assistanceType === 'both'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-sm font-medium">Both</span>
              </button>
            </div>
          </div>

          {(assistanceType === 'monetary' || assistanceType === 'both') && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount needed (USD) *
              </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="amount"
                type="number"
                required
                min="0.01"
                max="10000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount in US Dollars</p>
            </div>
          )}

          {(assistanceType === 'service' || assistanceType === 'both') && (
            <div>
              <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Service/Help Description *
              </label>
              <div className="relative">
                <HandshakeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="serviceDescription"
                  required={assistanceType === 'service' || assistanceType === 'both'}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="Describe the service or help you need (e.g., grocery shopping, transportation, childcare, home repair)"
                  rows={3}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Be specific about what kind of help you need</p>
            </div>
          )}

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery/Meeting Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                placeholder="Street address, cross streets, or landmark"
                maxLength={200}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will help donors find you. Your exact location will not be shown on the map.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Neighborhood
            </label>
            {userNeighborhood ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{userNeighborhood.name}</p>
                    <p className="text-sm text-blue-700">{userNeighborhood.city}, {userNeighborhood.state}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Your request will be visible to people in this neighborhood area
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Please join a neighborhood in the Community section to post requests
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-fadeIn">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Posting Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about what you need</li>
              <li>• Only request what you truly need</li>
              <li>• This is mutual aid - we help each other</li>
              <li>• Be prepared to coordinate with helpers</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-[1.02]"
            >
              {loading ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}