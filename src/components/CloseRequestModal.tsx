import React, { useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CloseRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  requestId: string
  requestTitle: string
  requestStatus: string
}

export function CloseRequestModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  requestId, 
  requestTitle,
  requestStatus 
}: CloseRequestModalProps) {
  const [fulfillmentStatus, setFulfillmentStatus] = useState<'fulfilled' | 'unfulfilled'>('fulfilled')
  const [closureNotes, setClosureNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Temporarily just update status until migration is applied
      const updateData: {
        status: string;
        completed_at?: string;
      } = {
        status: 'completed'
      }
      
      // Once migration is applied, uncomment these:
      // fulfillment_status: fulfillmentStatus,
      // closed_at: new Date().toISOString(),
      // closure_notes: closureNotes.trim() || null

      // If marking as completed when closing
      if (requestStatus !== 'completed' && requestStatus !== 'cancelled') {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('aid_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      onSuccess()
      onClose()
      
      // Reset form
      setFulfillmentStatus('fulfilled')
      setClosureNotes('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to close request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1001]">
      <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Close Aid Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Title */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Closing request:</p>
            <p className="font-semibold text-gray-900">{requestTitle}</p>
          </div>

          {/* Fulfillment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Was this request fulfilled?
            </label>
            <div className="space-y-2">
              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="fulfillment"
                  value="fulfilled"
                  checked={fulfillmentStatus === 'fulfilled'}
                  onChange={() => setFulfillmentStatus('fulfilled')}
                  className="mt-1 text-green-600 focus:ring-green-500"
                />
                <div className="ml-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Fulfilled</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    The aid was successfully delivered or the need was met
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="fulfillment"
                  value="unfulfilled"
                  checked={fulfillmentStatus === 'unfulfilled'}
                  onChange={() => setFulfillmentStatus('unfulfilled')}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />
                <div className="ml-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-gray-900">Unfulfilled</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    The request could not be completed or is no longer needed
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Closure Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional notes (optional)
            </label>
            <textarea
              id="notes"
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 resize-none"
              placeholder="Any additional details about how this request was resolved..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{closureNotes.length}/500 characters</p>
          </div>

          {/* Warning for unfulfilled */}
          {fulfillmentStatus === 'unfulfilled' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-800">Note</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Marking as unfulfilled will remove this request from the active list. 
                    Consider updating the request details if you still need help.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
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
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                fulfillmentStatus === 'fulfilled'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
              } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]`}
            >
              {loading ? 'Closing...' : 'Close Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}