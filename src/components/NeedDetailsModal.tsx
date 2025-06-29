import React from 'react'
import { X, DollarSign, MapPin, Clock, User, Heart, Tag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AidRequest {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  amount_algo: number
  status: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  user_id: string
  category: string
  urgency: string
  address: string | null
}

interface NeedDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  aidRequest: AidRequest
  onFund: (request: AidRequest) => void
}

export function NeedDetailsModal({ isOpen, onClose, aidRequest, onFund }: NeedDetailsModalProps) {
  const { user } = useAuth()

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleFundClick = () => {
    onFund(aidRequest)
  }

  if (!isOpen) return null

  const canFund = user && user.id !== aidRequest.user_id && aidRequest.status === 'open'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]">
      <div className={`bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-full">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Aid Request Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Amount */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(aidRequest.status)}`}>
                {aidRequest.status.replace('_', ' ').charAt(0).toUpperCase() + aidRequest.status.replace('_', ' ').slice(1)}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${getUrgencyColor(aidRequest.urgency)}`}>
                {aidRequest.urgency.charAt(0).toUpperCase() + aidRequest.urgency.slice(1)} Priority
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{formatAmount(aidRequest.amount_algo)}</p>
              <p className="text-sm text-gray-500">Requested amount</p>
            </div>
          </div>

          {/* Title and Description */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{aidRequest.title}</h3>
            <p className="text-gray-600 leading-relaxed">{aidRequest.description}</p>
          </div>

          {/* Category */}
          <div className="flex items-center space-x-3 text-gray-600">
            <Tag className="h-5 w-5" />
            <span className="text-sm">
              Category: <span className="font-medium text-blue-600">{aidRequest.category.charAt(0).toUpperCase() + aidRequest.category.slice(1)}</span>
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {aidRequest.address && (
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span className="text-sm">{aidRequest.address}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">
                Coordinates: {aidRequest.lat.toFixed(4)}, {aidRequest.lng.toFixed(4)}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Posted {formatDate(aidRequest.created_at)}</span>
            </div>

            <div className="flex items-center space-x-3 text-gray-600">
              <User className="h-5 w-5" />
              <span className="text-sm">Community member</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            {canFund ? (
              <button
                onClick={handleFundClick}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] shadow-lg"
              >
                <Heart className="h-5 w-5" />
                <span>Help Fund This Request</span>
              </button>
            ) : user && user.id === aidRequest.user_id ? (
              <div className="text-center py-3">
                <p className="text-gray-600 text-sm">This is your request</p>
              </div>
            ) : !user ? (
              <div className="text-center py-3">
                <p className="text-gray-600 text-sm">Sign in to help fund this request</p>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-gray-600 text-sm">
                  This request is {aidRequest.status.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Send money directly to help with this specific need</li>
              <li>• Coordinate with the requester for delivery details</li>
              <li>• Multiple payment options available including CashApp</li>
              <li>• Built for community mutual aid and support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}