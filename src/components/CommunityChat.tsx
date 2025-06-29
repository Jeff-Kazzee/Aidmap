import React, { useState, useEffect, useRef } from 'react'
import { Send, MapPin, Users, AlertTriangle, Shield, MessageSquare, Heart, Wrench, HelpCircle, Filter, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Neighborhood {
  id: string
  name: string
  state: string
  city: string | null
  zip_code: string | null
  lat: number
  lng: number
  radius_miles: number
}

interface CommunityMessage {
  id: string
  user_id: string
  neighborhood_id: string
  message_type: 'help_needed' | 'help_offered' | 'general_discussion'
  title: string | null
  content: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  category: string | null
  compensation_offered: string | null
  time_frame: string | null
  skills_needed: string[] | null
  location_lat: number | null
  location_lng: number | null
  is_resolved: boolean
  created_at: string
  profiles: {
    username: string
    is_verified: boolean
  }
}

interface Profile {
  id: string
  username: string
  is_verified: boolean
  neighborhood_id: string | null
  location_lat: number | null
  location_lng: number | null
  bio: string | null
  skills: string[] | null
}

export function CommunityChat() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<'help_needed' | 'help_offered' | 'general_discussion'>('general_discussion')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [compensation, setCompensation] = useState('')
  const [timeFrame, setTimeFrame] = useState('')
  const [skillsNeeded, setSkillsNeeded] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'help_needed' | 'help_offered' | 'general_discussion'>('all')
  const [showPostForm, setShowPostForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreateNeighborhood, setShowCreateNeighborhood] = useState(false)
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: '',
    city: '',
    state: '',
    zipCode: ''
  })
  const [creatingNeighborhood, setCreatingNeighborhood] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const categories = ['errands', 'repairs', 'advice', 'transportation', 'childcare', 'medical', 'food', 'housing', 'other']

  useEffect(() => {
    if (user) {
      loadProfile()
      loadNeighborhoods()
    }
  }, [user])

  useEffect(() => {
    if (profile?.neighborhood_id) {
      loadNeighborhood()
      loadMessages()
      subscribeToMessages()
    }
  }, [profile?.neighborhood_id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadNeighborhoods = async () => {
    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('name')

      if (error) throw error
      setNeighborhoods(data || [])
    } catch (error) {
      console.error('Error loading neighborhoods:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNeighborhood = async () => {
    if (!profile?.neighborhood_id) return

    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('id', profile.neighborhood_id)
        .single()

      if (error) throw error
      setNeighborhood(data)
    } catch (error) {
      console.error('Error loading neighborhood:', error)
    }
  }

  const loadMessages = async () => {
    if (!profile?.neighborhood_id) return

    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          profiles:user_id (
            username,
            is_verified
          )
        `)
        .eq('neighborhood_id', profile.neighborhood_id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = () => {
    if (!profile?.neighborhood_id) return

    const subscription = supabase
      .channel(`community:${profile.neighborhood_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `neighborhood_id=eq.${profile.neighborhood_id}`
      }, (payload) => {
        loadMessages() // Reload to get profile data
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const joinNeighborhood = async (neighborhoodId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ neighborhood_id: neighborhoodId })
        .eq('id', user.id)

      if (error) throw error
      
      // Reload profile
      await loadProfile()
    } catch (error) {
      console.error('Error joining neighborhood:', error)
      alert('Failed to join neighborhood. Please try again.')
    }
  }

  const createNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setCreatingNeighborhood(true)
    try {
      // Use a geocoding service in production. For demo, use city center coordinates
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'new york': { lat: 40.7128, lng: -74.0060 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'chicago': { lat: 41.8781, lng: -87.6298 },
        'houston': { lat: 29.7604, lng: -95.3698 },
        'phoenix': { lat: 33.4484, lng: -112.0740 },
        'philadelphia': { lat: 39.9526, lng: -75.1652 },
        'san antonio': { lat: 29.4241, lng: -98.4936 },
        'san diego': { lat: 32.7157, lng: -117.1611 },
        'dallas': { lat: 32.7767, lng: -96.7970 },
        'san jose': { lat: 37.3382, lng: -121.8863 }
      }

      const cityLower = newNeighborhood.city.toLowerCase()
      const coords = cityCoordinates[cityLower] || { lat: 39.8283, lng: -98.5795 } // Default to US center

      const { data, error } = await supabase
        .from('neighborhoods')
        .insert({
          name: newNeighborhood.name || `${newNeighborhood.city} Community`,
          city: newNeighborhood.city,
          state: newNeighborhood.state.toUpperCase(),
          zip_code: newNeighborhood.zipCode || null,
          lat: coords.lat,
          lng: coords.lng,
          radius_miles: 5
        })
        .select()
        .single()

      if (error) throw error

      // Join the newly created neighborhood
      await joinNeighborhood(data.id)
      
      // Reset form and close modal
      setNewNeighborhood({ name: '', city: '', state: '', zipCode: '' })
      setShowCreateNeighborhood(false)
      
      // Reload neighborhoods list
      await loadNeighborhoods()
    } catch (error) {
      console.error('Error creating neighborhood:', error)
      alert('Failed to create neighborhood. It may already exist.')
    } finally {
      setCreatingNeighborhood(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.neighborhood_id || !newMessage.trim()) return

    try {
      const messageData: any = {
        user_id: user.id,
        neighborhood_id: profile.neighborhood_id,
        message_type: messageType,
        content: newMessage.trim(),
        urgency
      }

      if (messageType !== 'general_discussion') {
        messageData.title = title.trim() || null
        messageData.category = category || null
        messageData.compensation_offered = compensation.trim() || null
        messageData.time_frame = timeFrame.trim() || null
        messageData.skills_needed = skillsNeeded.trim() ? skillsNeeded.split(',').map(s => s.trim()) : null
      }

      const { error } = await supabase
        .from('community_messages')
        .insert([messageData])

      if (error) throw error

      // Reset form
      setNewMessage('')
      setTitle('')
      setCategory('')
      setCompensation('')
      setTimeFrame('')
      setSkillsNeeded('')
      setShowPostForm(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const reportMessage = async (messageId: string, reason: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('message_reports')
        .insert([{
          reporter_id: user.id,
          message_id: messageId,
          message_type: 'community',
          report_reason: reason
        }])

      if (error) throw error
      alert('Message reported. Thank you for helping keep our community safe.')
    } catch (error) {
      console.error('Error reporting message:', error)
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'help_needed': return <HelpCircle className="h-4 w-4 text-red-600" />
      case 'help_offered': return <Heart className="h-4 w-4 text-green-600" />
      case 'general_discussion': return <MessageSquare className="h-4 w-4 text-blue-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'help_needed': return 'bg-red-50 border-red-200 hover:bg-red-100'
      case 'help_offered': return 'bg-green-50 border-green-200 hover:bg-green-100'
      case 'general_discussion': return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMessages = messages.filter(message => 
    filterType === 'all' || message.message_type === filterType
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile?.neighborhood_id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
            <Users className="h-12 w-12 text-white mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Join Your Neighborhood</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Connect with your local community for mutual aid and support
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Location Verification Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You must be located within the same state as your chosen neighborhood to participate in community discussions.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Available Communities</h2>
          <button
            onClick={() => setShowCreateNeighborhood(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
          >
            <MapPin className="h-4 w-4" />
            <span>Create New Community</span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((hood) => (
            <div key={hood.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{hood.name}</h3>
                  <p className="text-sm text-gray-600">{hood.city}, {hood.state}</p>
                  {hood.zip_code && (
                    <p className="text-xs text-gray-500">{hood.zip_code}</p>
                  )}
                </div>
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Radius: {hood.radius_miles} miles</p>
              </div>

              <button
                onClick={() => joinNeighborhood(hood.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Join Community
              </button>
            </div>
          ))}
        </div>

        {/* Create Neighborhood Modal */}
        {showCreateNeighborhood && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Community</h3>
              <form onSubmit={createNeighborhood} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood.name}
                    onChange={(e) => setNewNeighborhood({...newNeighborhood, name: e.target.value})}
                    placeholder="e.g., Downtown Community"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood.city}
                    onChange={(e) => setNewNeighborhood({...newNeighborhood, city: e.target.value})}
                    placeholder="e.g., Austin"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood.state}
                    onChange={(e) => setNewNeighborhood({...newNeighborhood, state: e.target.value})}
                    placeholder="e.g., TX"
                    maxLength={2}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code (optional)
                  </label>
                  <input
                    type="text"
                    value={newNeighborhood.zipCode}
                    onChange={(e) => setNewNeighborhood({...newNeighborhood, zipCode: e.target.value})}
                    placeholder="e.g., 78701"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateNeighborhood(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingNeighborhood}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingNeighborhood ? 'Creating...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Community Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Be respectful and kind to all community members</li>
            <li>• This is mutual aid - we help each other, not charity</li>
            <li>• Offer fair compensation or exchange for services</li>
            <li>• Keep personal information private until you're ready to connect</li>
            <li>• Report any inappropriate behavior or safety concerns</li>
            <li>• Verify your identity to build trust in the community</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Chat</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{neighborhood?.name}, {neighborhood?.state}</span>
              </div>
              <div className="flex items-center space-x-1">
                {profile.is_verified ? (
                  <>
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-600">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            New Post
          </button>
        </div>

        {/* Message Type Filter */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              filterType === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('help_needed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              filterType === 'help_needed' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HelpCircle className="h-3 w-3" />
            <span>Help Needed</span>
          </button>
          <button
            onClick={() => setFilterType('help_offered')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              filterType === 'help_offered' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className="h-3 w-3" />
            <span>Help Offered</span>
          </button>
          <button
            onClick={() => setFilterType('general_discussion')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              filterType === 'general_discussion' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            <span>Discussion</span>
          </button>
        </div>
      </div>

      {/* Post Form */}
      {showPostForm && (
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6 transform transition-all duration-300">
          <form onSubmit={sendMessage} className="space-y-4">
            <div className="flex space-x-4">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="general_discussion">General Discussion</option>
                <option value="help_needed">Help Needed</option>
                <option value="help_offered">Help Offered</option>
              </select>

              {messageType !== 'general_discussion' && (
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              )}
            </div>

            {messageType !== 'general_discussion' && (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                    placeholder="Time frame needed"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                <input
                  type="text"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="Compensation offered (required for mutual aid)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                />

                <input
                  type="text"
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  placeholder="Skills needed (comma-separated)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                />
              </>
            )}

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your message..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 resize-none"
              required
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 transform hover:scale-[1.02]"
              >
                <Send className="h-4 w-4" />
                <span>Post</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Community Messages</h3>
          <p className="text-sm text-gray-600">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Be the first to start the conversation!</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${getMessageTypeColor(message.message_type)} shadow-sm hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getMessageIcon(message.message_type)}
                    <span className="font-medium text-gray-900">
                      {message.profiles.username}
                    </span>
                    {message.profiles.is_verified && (
                      <Shield className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {message.message_type !== 'general_discussion' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor(message.urgency)}`}>
                        {message.urgency}
                      </span>
                    )}
                    <button
                      onClick={() => reportMessage(message.id, 'inappropriate_content')}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Report message"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {message.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{message.title}</h4>
                )}

                <p className="text-gray-700 mb-3">{message.content}</p>

                {message.message_type !== 'general_discussion' && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {message.category && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {message.category}
                      </span>
                    )}
                    {message.time_frame && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {message.time_frame}
                      </span>
                    )}
                    {message.compensation_offered && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        💰 {message.compensation_offered}
                      </span>
                    )}
                    {message.skills_needed && message.skills_needed.length > 0 && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Skills: {message.skills_needed.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Safety Guidelines */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Safety Guidelines</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Meet in public places for initial exchanges</li>
              <li>• Trust your instincts - if something feels off, don't proceed</li>
              <li>• Verify identity before sharing personal information</li>
              <li>• Report any suspicious or inappropriate behavior</li>
              <li>• Remember: this is mutual aid, not charity - fair exchange is expected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}