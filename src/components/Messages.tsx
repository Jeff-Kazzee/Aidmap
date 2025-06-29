import React, { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Message {
  id: number
  post_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface AidRequest {
  id: string
  title: string
  user_id: string
  donor_id: string | null
}

interface Conversation {
  aidRequest: AidRequest
  messages: Message[]
  otherUser: string
}

export function Messages() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const postId = searchParams.get('post')

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    if (postId) {
      setActiveConversation(postId)
      loadMessages(postId)
    }
  }, [postId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (activeConversation) {
      const subscription = supabase
        .channel(`messages:${activeConversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${activeConversation}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [activeConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    if (!user) return

    try {
      // Get aid requests where user is either the creator or donor
      const { data: requestsData, error: requestsError } = await supabase
        .from('aid_requests')
        .select('*')
        .or(`user_id.eq.${user.id},donor_id.eq.${user.id}`)
        .not('donor_id', 'is', null)

      if (requestsError) throw requestsError

      const conversationsData: Conversation[] = []

      for (const request of requestsData || []) {
        // Get messages for this aid request
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('post_id', request.id)
          .order('created_at', { ascending: true })

        if (messagesError) continue

        // Determine the other user
        const otherUserId = request.user_id === user.id ? request.donor_id : request.user_id
        
        conversationsData.push({
          aidRequest: request,
          messages: messagesData || [],
          otherUser: otherUserId || 'Unknown'
        })
      }

      setConversations(conversationsData)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !activeConversation || !newMessage.trim()) return

    const conversation = conversations.find(c => c.aidRequest.id === activeConversation)
    if (!conversation) return

    const receiverId = conversation.aidRequest.user_id === user.id ? conversation.aidRequest.donor_id : conversation.aidRequest.user_id
    if (!receiverId) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          post_id: activeConversation,
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim()
        }])

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Coordinate with donors and requesters</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex h-96">
          {/* Conversations List */}
          <div className="w-1/3 border-r bg-gray-50">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No conversations yet</p>
                  <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm">
                    Browse requests to start helping
                  </Link>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.aidRequest.id}
                      onClick={() => {
                        setActiveConversation(conversation.aidRequest.id)
                        loadMessages(conversation.aidRequest.id)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeConversation === conversation.aidRequest.id
                          ? 'bg-blue-100 border-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {conversation.aidRequest.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.messages.length > 0
                          ? conversation.messages[conversation.messages.length - 1].content.substring(0, 50) + '...'
                          : 'No messages yet'
                        }
                      </p>
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
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {conversations.find(c => c.aidRequest.id === activeConversation)?.aidRequest.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Coordinating delivery
                      </p>
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
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}