import React, { useState, useEffect } from 'react'
import { Shield, Phone, MapPin, FileText, Users, CheckCircle, Clock, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Verification {
  id: string
  verification_type: 'phone' | 'address' | 'id_document' | 'community_voucher'
  status: 'pending' | 'verified' | 'rejected'
  verified_at: string | null
  created_at: string
}

interface Profile {
  id: string
  username: string
  is_verified: boolean
  bio: string | null
  skills: string[] | null
}

export function UserVerification() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVerification, setActiveVerification] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')

  useEffect(() => {
    if (user) {
      loadProfile()
      loadVerifications()
    }
  }, [user])

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
      setBio(data.bio || '')
      setSkills(data.skills ? data.skills.join(', ') : '')
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadVerifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVerifications(data || [])
    } catch (error) {
      console.error('Error loading verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim() || null,
          skills: skills.trim() ? skills.split(',').map(s => s.trim()) : null
        })
        .eq('id', user.id)

      if (error) throw error
      
      alert('Profile updated successfully!')
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    }
  }

  const startVerification = async (type: string) => {
    if (!user) return

    try {
      let verificationData: any = {}

      if (type === 'phone') {
        if (!phoneNumber.trim()) {
          alert('Please enter your phone number')
          return
        }
        verificationData = { phone_number: phoneNumber.trim() }
      } else if (type === 'address') {
        if (!address.trim()) {
          alert('Please enter your address')
          return
        }
        verificationData = { address: address.trim() }
      }

      const { error } = await supabase
        .from('user_verifications')
        .insert([{
          user_id: user.id,
          verification_type: type,
          verification_data: verificationData
        }])

      if (error) throw error

      alert('Verification request submitted! We will review it within 24-48 hours.')
      setActiveVerification(null)
      setPhoneNumber('')
      setAddress('')
      loadVerifications()
    } catch (error) {
      console.error('Error starting verification:', error)
      alert('Error submitting verification. Please try again.')
    }
  }

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-5 w-5" />
      case 'address': return <MapPin className="h-5 w-5" />
      case 'id_document': return <FileText className="h-5 w-5" />
      case 'community_voucher': return <Users className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <X className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const hasVerification = (type: string) => {
    return verifications.some(v => v.verification_type === type)
  }

  const getVerificationStatus = (type: string) => {
    const verification = verifications.find(v => v.verification_type === type)
    return verification?.status || null
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Verification</h1>
        <p className="text-gray-600">
          Build trust in the community by verifying your identity
        </p>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
          <div className="flex items-center space-x-2">
            {profile?.is_verified ? (
              <>
                <div className="bg-green-100 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-green-600 font-medium">Verified</span>
              </>
            ) : (
              <>
                <div className="bg-gray-100 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-600">Not Verified</span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Phone Verification */}
          <div className="border rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">Phone Number</span>
              </div>
              {hasVerification('phone') && (
                <div className="flex items-center space-x-1">
                  {getStatusIcon(getVerificationStatus('phone')!)}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(getVerificationStatus('phone')!)}`}>
                    {getVerificationStatus('phone')}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Verify your phone number to show you're a real person
            </p>
            {!hasVerification('phone') ? (
              <button
                onClick={() => setActiveVerification('phone')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Start Verification
              </button>
            ) : getVerificationStatus('phone') === 'rejected' ? (
              <button
                onClick={() => setActiveVerification('phone')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Retry Verification
              </button>
            ) : (
              <div className="text-center py-2 text-gray-500 text-sm">
                {getVerificationStatus('phone') === 'pending' ? 'Under Review' : 'Verified'}
              </div>
            )}
          </div>

          {/* Address Verification */}
          <div className="border rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">Address</span>
              </div>
              {hasVerification('address') && (
                <div className="flex items-center space-x-1">
                  {getStatusIcon(getVerificationStatus('address')!)}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(getVerificationStatus('address')!)}`}>
                    {getVerificationStatus('address')}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Confirm your local address to join neighborhood discussions
            </p>
            {!hasVerification('address') ? (
              <button
                onClick={() => setActiveVerification('address')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Start Verification
              </button>
            ) : getVerificationStatus('address') === 'rejected' ? (
              <button
                onClick={() => setActiveVerification('address')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Retry Verification
              </button>
            ) : (
              <div className="text-center py-2 text-gray-500 text-sm">
                {getVerificationStatus('address') === 'pending' ? 'Under Review' : 'Verified'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio (optional)
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 resize-none"
              placeholder="Tell your neighbors a bit about yourself..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills & Interests (optional)
            </label>
            <input
              id="skills"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
              placeholder="e.g., gardening, cooking, handyman, tutoring (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Help others know what you can offer or what you're interested in
            </p>
          </div>

          <button
            onClick={updateProfile}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Verification Modals */}
      {activeVerification === 'phone' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Phone Verification</h3>
              <button
                onClick={() => setActiveVerification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Enter your phone number. We'll send you a verification code to confirm it's yours.
            </p>
            
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 mb-4"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveVerification(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => startVerification('phone')}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {activeVerification === 'address' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Address Verification</h3>
              <button
                onClick={() => setActiveVerification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Enter your address to verify you live in this area. This helps ensure local community integrity.
            </p>
            
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 mb-4 resize-none"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveVerification(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => startVerification('address')}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefits of Verification */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-3">Benefits of Verification</h3>
        <ul className="text-sm text-green-800 space-y-2">
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Send and receive direct messages with other verified users</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Build trust and credibility in the community</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Access to neighborhood-specific discussions and resources</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Higher priority in mutual aid matching</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Help create a safer, more trusted community environment</span>
          </li>
        </ul>
      </div>
    </div>
  )
}