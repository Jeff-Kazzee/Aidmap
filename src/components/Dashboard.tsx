import React, { useState, useEffect } from 'react'
import { Plus, Heart, Clock, CheckCircle, Upload, MessageCircle, Edit, Trash2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { EditRequestModal } from './EditRequestModal'
import { CloseRequestModal } from './CloseRequestModal'

interface AidRequest {
  id: string
  title: string
  description: string
  amount_algo: number
  status: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  donor_id: string | null
  proof_of_delivery_url: string | null
  category: string
  urgency: string
  address?: string | null
  lat: number
  lng: number
  user_id: string
  fulfillment_status?: 'fulfilled' | 'unfulfilled' | null
  closed_at?: string | null
  closure_notes?: string | null
}

export function Dashboard() {
  const { user } = useAuth()
  const [myRequests, setMyRequests] = useState<AidRequest[]>([])
  const [fundedRequests, setFundedRequests] = useState<AidRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-requests' | 'funded'>('my-requests')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [requestToEdit, setRequestToEdit] = useState<AidRequest | null>(null)
  const [requestToClose, setRequestToClose] = useState<AidRequest | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load aid requests created by user
      const { data: myRequestsData, error: myRequestsError } = await supabase
        .from('aid_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (myRequestsError) throw myRequestsError

      // Load aid requests funded by user
      const { data: fundedRequestsData, error: fundedRequestsError } = await supabase
        .from('aid_requests')
        .select('*')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false })

      if (fundedRequestsError) throw fundedRequestsError

      setMyRequests(myRequestsData || [])
      setFundedRequests(fundedRequestsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-orange-600" />
      case 'funded': return <Heart className="h-4 w-4 text-blue-600" />
      case 'in_progress': return <Upload className="h-4 w-4 text-purple-600" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled': return <Clock className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-orange-600 bg-orange-100'
      case 'funded': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-purple-600 bg-purple-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleUploadProof = async () => {
    // This would handle file upload to Supabase storage
    alert('File upload functionality would be implemented here')
  }

  const handleConfirmReceipt = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error
      
      // Trigger Algorand transaction release here
      alert('Receipt confirmed! Funds will be released from escrow.')
      loadDashboardData()
    } catch (error) {
      console.error('Error confirming receipt:', error)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user?.id) // Extra safety check

      if (error) throw error
      
      setDeleteConfirmId(null)
      loadDashboardData()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your aid requests and track your contributions</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'my-requests'
              ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('funded')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'funded'
              ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          I've Funded ({fundedRequests.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-requests' && (
        <div className="space-y-6">
          {myRequests.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
                <Plus className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No requests yet</h3>
              <p className="text-gray-600 mb-6 text-lg">Start by creating your first aid request</p>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Request
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {myRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.title}</h3>
                      {request.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{request.category}</span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{request.urgency}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {request.amount_algo && (
                        <p className="text-lg font-bold text-green-600">{formatAmount(request.amount_algo)}</p>
                      )}
                      {request.assistance_type === 'service' && (
                        <p className="text-lg font-semibold text-blue-600">Service</p>
                      )}
                      {request.assistance_type === 'both' && request.amount_algo && (
                        <p className="text-sm text-gray-500">+ Service</p>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <span>{request.status.replace('_', ' ')}</span>
                      </div>
                      <span>{formatDate(request.created_at)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {request.status === 'funded' && request.donor_id && (
                        <Link
                          to={`/messages?post=${request.id}`}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Link>
                      )}
                      
                      {request.status === 'in_progress' && request.proof_of_delivery_url && (
                        <button
                          onClick={() => handleConfirmReceipt(request.id)}
                          className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm Receipt
                        </button>
                      )}

                      {request.status === 'open' && (
                        <>
                          <button
                            onClick={() => {
                              setRequestToEdit(request)
                              setShowEditModal(true)
                            }}
                            className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          
                          {deleteConfirmId === request.id ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDeleteRequest(request.id)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(request.id)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </button>
                          )}
                        </>
                      )}

                      {(request.status === 'open' || request.status === 'funded') && (
                        <button
                          onClick={() => {
                            setRequestToClose(request)
                            setShowCloseModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'funded' && (
        <div className="space-y-6">
          {fundedRequests.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
                <Heart className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No contributions yet</h3>
              <p className="text-gray-600 mb-6 text-lg">Start helping others in your community</p>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Heart className="h-5 w-5 mr-2" />
                Browse Needs
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {fundedRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.title}</h3>
                      {request.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{request.category}</span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{request.urgency}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {request.amount_algo && (
                        <p className="text-lg font-bold text-green-600">{formatAmount(request.amount_algo)}</p>
                      )}
                      {request.assistance_type === 'service' && (
                        <p className="text-lg font-semibold text-blue-600">Service</p>
                      )}
                      {request.assistance_type === 'both' && request.amount_algo && (
                        <p className="text-sm text-gray-500">+ Service</p>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <span>{request.status.replace('_', ' ')}</span>
                      </div>
                      <span>{formatDate(request.created_at)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {request.status === 'funded' && (
                        <>
                          <Link
                            to={`/messages?post=${request.id}`}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Link>
                          <button
                            onClick={() => handleUploadProof()}
                            className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Proof
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && requestToEdit && (
        <EditRequestModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setRequestToEdit(null)
          }}
          onSuccess={() => {
            loadDashboardData()
            setShowEditModal(false)
            setRequestToEdit(null)
          }}
          request={requestToEdit}
        />
      )}

      {/* Close Modal */}
      {showCloseModal && requestToClose && (
        <CloseRequestModal
          isOpen={showCloseModal}
          onClose={() => {
            setShowCloseModal(false)
            setRequestToClose(null)
          }}
          onSuccess={() => {
            loadDashboardData()
            setShowCloseModal(false)
            setRequestToClose(null)
          }}
          requestId={requestToClose.id}
          requestTitle={requestToClose.title}
          requestStatus={requestToClose.status}
        />
      )}
    </div>
  )
}