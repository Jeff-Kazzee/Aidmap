import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      aid_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          urgency: string
          amount_algo: number
          lat: number
          lng: number
          address: string | null
          status: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          funded_at: string | null
          completed_at: string | null
          donor_id: string | null
          escrow_address: string | null
          proof_of_delivery_url: string | null
          audio_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: string
          urgency: string
          amount_algo: number
          lat: number
          lng: number
          address?: string | null
          status?: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          funded_at?: string | null
          completed_at?: string | null
          donor_id?: string | null
          escrow_address?: string | null
          proof_of_delivery_url?: string | null
          audio_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: string
          urgency?: string
          amount_algo?: number
          lat?: number
          lng?: number
          address?: string | null
          status?: 'open' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          funded_at?: string | null
          completed_at?: string | null
          donor_id?: string | null
          escrow_address?: string | null
          proof_of_delivery_url?: string | null
          audio_url?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          aid_request_id: string
          donor_id: string
          amount_algo: number
          tx_hash: string | null
          status: 'pending' | 'confirmed' | 'released'
          created_at: string
        }
        Insert: {
          id?: string
          aid_request_id: string
          donor_id: string
          amount_algo: number
          tx_hash?: string | null
          status?: 'pending' | 'confirmed' | 'released'
          created_at?: string
        }
        Update: {
          id?: string
          aid_request_id?: string
          donor_id?: string
          amount_algo?: number
          tx_hash?: string | null
          status?: 'pending' | 'confirmed' | 'released'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          reputation_score: number | null
          created_at: string | null
          neighborhood_id: string | null
          is_verified: boolean
          location_lat: number | null
          location_lng: number | null
          bio: string | null
          skills: string[] | null
        }
        Insert: {
          id: string
          username: string
          reputation_score?: number | null
          created_at?: string | null
          neighborhood_id?: string | null
          is_verified?: boolean
          location_lat?: number | null
          location_lng?: number | null
          bio?: string | null
          skills?: string[] | null
        }
        Update: {
          id?: string
          username?: string
          reputation_score?: number | null
          created_at?: string | null
          neighborhood_id?: string | null
          is_verified?: boolean
          location_lat?: number | null
          location_lng?: number | null
          bio?: string | null
          skills?: string[] | null
        }
      }
      neighborhoods: {
        Row: {
          id: string
          name: string
          state: string
          city: string | null
          zip_code: string | null
          lat: number
          lng: number
          radius_miles: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          state: string
          city?: string | null
          zip_code?: string | null
          lat: number
          lng: number
          radius_miles?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          state?: string
          city?: string | null
          zip_code?: string | null
          lat?: number
          lng?: number
          radius_miles?: number
          created_at?: string
        }
      }
      community_messages: {
        Row: {
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
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          neighborhood_id: string
          message_type: 'help_needed' | 'help_offered' | 'general_discussion'
          title?: string | null
          content: string
          urgency?: 'low' | 'medium' | 'high' | 'critical'
          category?: string | null
          compensation_offered?: string | null
          time_frame?: string | null
          skills_needed?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          neighborhood_id?: string
          message_type?: 'help_needed' | 'help_offered' | 'general_discussion'
          title?: string | null
          content?: string
          urgency?: 'low' | 'medium' | 'high' | 'critical'
          category?: string | null
          compensation_offered?: string | null
          time_frame?: string | null
          skills_needed?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      user_verifications: {
        Row: {
          id: string
          user_id: string
          verification_type: 'phone' | 'address' | 'id_document' | 'community_voucher'
          status: 'pending' | 'verified' | 'rejected'
          verified_at: string | null
          verified_by: string | null
          verification_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          verification_type: 'phone' | 'address' | 'id_document' | 'community_voucher'
          status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          verified_by?: string | null
          verification_data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          verification_type?: 'phone' | 'address' | 'id_document' | 'community_voucher'
          status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          verified_by?: string | null
          verification_data?: Record<string, unknown> | null
          created_at?: string
        }
      }
      message_reports: {
        Row: {
          id: string
          reporter_id: string
          message_id: string
          message_type: 'community' | 'direct'
          report_reason: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'safety_concern' | 'other'
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          message_id: string
          message_type: 'community' | 'direct'
          report_reason: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'safety_concern' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          message_id?: string
          message_type?: 'community' | 'direct'
          report_reason?: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'safety_concern' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}