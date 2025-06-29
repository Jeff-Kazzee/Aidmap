import React, { useState } from 'react'
import { X, CreditCard, Smartphone, QrCode, DollarSign, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AidRequest {
  id: string
  title: string
  amount_algo: number
  user_id: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  aidRequest: AidRequest
  onSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, aidRequest, onSuccess }: PaymentModalProps) {
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<'cashapp' | 'venmo' | 'paypal' | 'other'>('cashapp')
  const [amount, setAmount] = useState(aidRequest.amount_algo.toString())
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mock payment details - in a real app, these would come from the requester's profile
  const paymentDetails = {
    cashapp: '$aidmap-user',
    venmo: '@aidmap-user',
    paypal: 'aidmap@example.com'
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePaymentComplete = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Update the aid request status
      const { error: updateError } = await supabase
        .from('aid_requests')
        .update({ 
          status: 'funded',
          donor_id: user.id,
          funded_at: new Date().toISOString()
        })
        .eq('id', aidRequest.id)

      if (updateError) throw updateError

      // Create a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          aid_request_id: aidRequest.id,
          donor_id: user.id,
          amount_algo: parseFloat(amount),
          status: 'confirmed'
        }])

      if (transactionError) throw transactionError

      onSuccess()
    } catch (error) {
      console.error('Error completing payment:', error)
      alert('Error recording payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1002]">
      <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Send Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Request Summary</h3>
            <p className="text-gray-600 text-sm mb-2">{aidRequest.title}</p>
            <p className="text-lg font-bold text-green-600">${aidRequest.amount_algo.toFixed(2)}</p>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Send
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cashapp')}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  paymentMethod === 'cashapp'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Smartphone className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">CashApp</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('venmo')}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  paymentMethod === 'venmo'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Smartphone className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">Venmo</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">PayPal</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('other')}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  paymentMethod === 'other'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <QrCode className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">Other</span>
              </button>
            </div>
          </div>

          {/* Payment Details */}
          {paymentMethod !== 'other' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Payment Details</h4>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === 'cashapp' && 'CashApp Tag'}
                    {paymentMethod === 'venmo' && 'Venmo Username'}
                    {paymentMethod === 'paypal' && 'PayPal Email'}
                  </p>
                  <p className="font-mono font-semibold text-gray-900">
                    {paymentDetails[paymentMethod]}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(paymentDetails[paymentMethod])}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="mt-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your {paymentMethod} app</li>
                  <li>Send ${amount} to the above {paymentMethod === 'paypal' ? 'email' : 'username'}</li>
                  <li>Include "{aidRequest.title}" in the note</li>
                  <li>Click "I've Sent Payment" below</li>
                </ol>
              </div>
            </div>
          )}

          {paymentMethod === 'other' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Alternative Payment</h4>
              <p className="text-sm text-gray-600 mb-3">
                Contact the requester directly to arrange payment through other methods such as:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bank transfer</li>
                <li>• Check or money order</li>
                <li>• Gift cards</li>
                <li>• In-person cash exchange</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentComplete}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-[1.02]"
            >
              {loading ? 'Processing...' : "I've Sent Payment"}
            </button>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Safety Reminder</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Only send money for legitimate community aid</li>
              <li>• Keep records of your payment for your own reference</li>
              <li>• Report any suspicious activity to community moderators</li>
              <li>• This is mutual aid - we help each other in times of need</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}