import React, { useState, useEffect } from 'react'
import { Shield, Search, Filter, Edit, Trash2, ChevronDown, ChevronUp, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EditRequestModal } from './EditRequestModal'

interface AidRequest {
  id: string
  title: string
  description: string
  amount_algo: number
  status: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  user_id: string
  donor_id?: string | null
  category: string
  urgency: string
  address?: string | null
  lat: number
  lng: number
  fulfillment_status?: 'fulfilled' | 'unfulfilled' | null
  closed_at?: string | null
  closure_notes?: string | null
  last_edited_at?: string | null
  edit_count?: number
  profiles?: {
    username: string
    email?: string
  }
}

interface UserProfile {
  id: string
  username: string
  email?: string
  is_verified: boolean
  is_admin: boolean
  reputation_score: number
  created_at: string
  neighborhood_id?: string | null
}

export function AdminPanel() {
  const [requests, setRequests] = useState<AidRequest[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [requestToEdit, setRequestToEdit] = useState<AidRequest | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'requests') {
        const { data, error } = await supabase
          .from('aid_requests')
          .select(`
            *,
            profiles!aid_requests_user_id_fkey (
              username,
              email
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRequests(data || [])
      } else {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // Get emails from auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
        
        if (!authError && authData?.users) {
          const usersWithEmail = profilesData?.map(profile => {
            const authUser = authData.users.find(u => u.id === profile.id)
            return {
              ...profile,
              email: authUser?.email
            }
          })
          setUsers(usersWithEmail || [])
        } else {
          setUsers(profilesData || [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error
      
      setDeleteConfirmId(null)
      loadData()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .update({ status: newStatus })
        .eq('id', requestId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleUserBan = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ reputation_score: isBanned ? -100 : 0 })
        .eq('id', userId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'funded': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredUsers = users.filter(user => {
    return user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">Manage aid requests and users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Open Requests</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'open').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Verified Users</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.is_verified).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'requests'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Aid Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'requests' ? 'Search requests...' : 'Search users...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {activeTab === 'requests' && (
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="funded">Funded</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'requests' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <React.Fragment key={request.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{request.title}</p>
                          <p className="text-xs text-gray-500">{request.category} • {request.urgency}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{request.profiles?.username || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{request.profiles?.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatAmount(request.amount_algo)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(request.status)}`}
                        >
                          <option value="open">Open</option>
                          <option value="funded">Funded</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            {expandedRequest === request.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setRequestToEdit(request)
                              setShowEditModal(true)
                            }}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {deleteConfirmId === request.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteRequest(request.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-gray-600 hover:text-gray-800 text-xs"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(request.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRequest === request.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Description:</p>
                              <p className="text-sm text-gray-600">{request.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Location:</p>
                                <p className="text-sm text-gray-600">
                                  {request.address || `${request.lat.toFixed(4)}, ${request.lng.toFixed(4)}`}
                                </p>
                              </div>
                              {request.fulfillment_status && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Fulfillment:</p>
                                  <p className="text-sm text-gray-600">{request.fulfillment_status}</p>
                                </div>
                              )}
                            </div>
                            {request.edit_count && request.edit_count > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Edit History:</p>
                                <p className="text-sm text-gray-600">
                                  Edited {request.edit_count} times
                                  {request.last_edited_at && ` • Last edited ${formatDate(request.last_edited_at)}`}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reputation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {user.is_admin && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                            Admin
                          </span>
                        )}
                        {user.is_verified && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                            Verified
                          </span>
                        )}
                        {user.reputation_score < 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                            Banned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.reputation_score}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {user.email !== 'jeffkazzee@gmail.com' && (
                          <button
                            onClick={() => handleUserBan(user.id, user.reputation_score >= 0)}
                            className={`px-3 py-1 text-xs rounded-md ${
                              user.reputation_score < 0
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {user.reputation_score < 0 ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            loadData()
            setShowEditModal(false)
            setRequestToEdit(null)
          }}
          request={requestToEdit}
        />
      )}
    </div>
  )
}