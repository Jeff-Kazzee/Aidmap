import React, { useState, useEffect, useRef } from 'react'
import { Send, Shield, AlertTriangle, ArrowLeft, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface Profile {
  id: string
  username: string
  is_verified: boolean
}

interface Conversation {
  profile: Profile
  lastMessage: DirectMessage | null
  unreadCount: number
}

export function DirectMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation)
      markMessagesAsRead(activeConversation)
      subscribeToMessages()
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, is_verified')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadConversations = async () => {
    if (!user) return

    try {
      // Get all direct messages involving the user
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Group messages by conversation partner
      const conversationMap = new Map<string, DirectMessage[]>()
      
      messagesData?.forEach(message => {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, [])
        }
        conversationMap.get(partnerId)!.push(message)
      })

      // Get profile information for each conversation partner
      const partnerIds = Array.from(conversationMap.keys())
      if (partnerIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, is_verified')
        .in('id', partnerIds)

      if (profilesError) throw profilesError

      // Build conversations array
      const conversationsData: Conversation[] = []
      
      profilesData?.forEach(profile => {
        const messages = conversationMap.get(profile.id) || []
        const lastMessage = messages[0] || null
        const unreadCount = messages.filter(m => 
          m.receiver_id === user.id && !m.is_read
        ).length

        conversationsData.push({
          profile,
          lastMessage,
          unreadCount
        })
      })

      // Sort by last message time
      conversationsData.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
        return bTime - aTime
      })

      setConversations(conversationsData)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (partnerId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (partnerId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      
      // Refresh conversations to update unread counts
      loadConversations()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const subscribeToMessages = () => {
    if (!user || !activeConversation) return

    const subscription = supabase
      .channel(`direct_messages:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${activeConversation}),and(sender_id.eq.${activeConversation},receiver_id.eq.${user.id}))`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DirectMessage])
        if (payload.new.receiver_id === user.id) {
          markMessagesAsRead(activeConversation)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !activeConversation || !newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert([{
          sender_id: user.id,
          receiver_id: activeConversation,
          content: newMessage.trim()
        }])

      if (error) throw error
      setNewMessage('')
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
          message_type: 'direct',
          report_reason: reason
        }])

      if (error) throw error
      alert('Message reported. Thank you for helping keep our community safe.')
    } catch (error) {
      console.error('Error reporting message:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
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

  if (!userProfile?.is_verified) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
            <AlertTriangle className="h-12 w-12 text-white mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Verification Required</h1>
          <p className="text-gray-600 mb-8 text-lg">
            You must be verified to send direct messages. This helps keep our community safe.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
            Start Verification Process
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Direct Messages</h1>
        <p className="text-gray-600">Private conversations with verified community members</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="flex h-96">
          {/* Conversations List */}
          <div className="w-1/3 border-r bg-gray-50">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="bg-gray-100 p-3 rounded-full w-12 h-12 mx-auto mb-3">
                    <Send className="h-6 w-6 mx-auto text-gray-400" />
                  </div>
                  <p className="text-sm font-medium mb-1">No conversations yet</p>
                  <p className="text-xs">Start by responding to community messages</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.profile.id}
                      onClick={() => setActiveConversation(conversation.profile.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        activeConversation === conversation.profile.id
                          ? 'bg-blue-100 border-blue-200 shadow-sm'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {conversation.profile.username}
                          </span>
                          {conversation.profile.is_verified && (
                            <Shield className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessage
                          ? conversation.lastMessage.content.substring(0, 50) + '...'
                          : 'No messages yet'
                        }
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(conversation.lastMessage.created_at)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="lg:hidden text-gray-400 hover:text-gray-600"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {conversations.find(c => c.profile.id === activeConversation)?.profile.username}
                      </span>
                      {conversations.find(c => c.profile.id === activeConversation)?.profile.is_verified && (
                        <Shield className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            message.sender_id === user?.id
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                          {message.sender_id !== user?.id && (
                            <button
                              onClick={() => reportMessage(message.id, 'inappropriate_content')}
                              className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                              title="Report message"
                            >
                              <Flag className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Send className="h-8 w-8 mx-auto text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Privacy & Safety</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Only verified users can send direct messages</li>
              <li>• Never share personal information like addresses or phone numbers</li>
              <li>• Meet in public places for any in-person exchanges</li>
              <li>• Report any inappropriate or suspicious messages</li>
              <li>• Block users who make you uncomfortable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}