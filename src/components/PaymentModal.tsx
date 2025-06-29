import React, { useState } from 'react'
import { X, CreditCard, Smartphone, QrCode, DollarSign, Copy, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { processMockPayment, type MockCard } from '../services/mockPayments'

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cashapp' | 'venmo' | 'paypal'>('card')
  const [amount, setAmount] = useState(aidRequest.amount_algo.toString())
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDemoMode] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Mock card details for demo
  const [cardDetails, setCardDetails] = useState<MockCard>({
    number: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '25',
    cvc: '123',
    name: 'Demo User'
  })

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

  const handleMockPayment = async () => {
    if (!user) return

    setProcessingPayment(true)
    setLoading(true)
    
    try {
      // Process mock payment
      const result = await processMockPayment(
        parseFloat(amount),
        aidRequest.id,
        cardDetails,
        user.id
      )

      if (result.success) {
        setPaymentSuccess(true)
        // Wait a moment to show success state
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        alert(result.error || 'Payment failed. Please try again.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Error processing payment. Please try again.')
    } finally {
      setProcessingPayment(false)
      setLoading(false)
    }
  }

  const handlePaymentComplete = async () => {
    if (paymentMethod === 'card') {
      await handleMockPayment()
    } else {
      // Original logic for other payment methods
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
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Payment</h2>
              {showDemoMode && (
                <span className="text-xs text-orange-600 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Demo Mode - No real transactions
                </span>
              )}
            </div>
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
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">Demo Card</span>
              </button>
              
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
                <QrCode className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-medium">PayPal</span>
              </button>
            </div>
          </div>

          {/* Mock Card Payment Form */}
          {paymentMethod === 'card' && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">Demo Card Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-purple-700 font-medium">Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-purple-300 rounded-lg bg-white"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-purple-700 font-medium">MM</label>
                    <input
                      type="text"
                      value={cardDetails.expMonth}
                      onChange={(e) => setCardDetails({...cardDetails, expMonth: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-purple-300 rounded-lg bg-white"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-700 font-medium">YY</label>
                    <input
                      type="text"
                      value={cardDetails.expYear}
                      onChange={(e) => setCardDetails({...cardDetails, expYear: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-purple-300 rounded-lg bg-white"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-700 font-medium">CVC</label>
                    <input
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-purple-300 rounded-lg bg-white"
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  This is a demo. Use any test card number or 4242 4242 4242 4242
                </div>
              </div>
              {processingPayment && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-purple-700 font-medium">Processing payment...</span>
                  </div>
                </div>
              )}
              {paymentSuccess && (
                <div className="mt-4 bg-green-100 text-green-700 p-3 rounded-lg text-center">
                  <Check className="h-5 w-5 inline mr-2" />
                  Payment successful! Transaction recorded.
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          {paymentMethod !== 'card' && paymentMethod !== 'other' && (
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
              {loading ? 'Processing...' : paymentMethod === 'card' ? 'Process Payment' : "I've Sent Payment"}
            </button>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              {showDemoMode ? 'Demo Mode Notice' : 'Safety Reminder'}
            </h4>
            {showDemoMode ? (
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• This is a demonstration - no real money is transferred</li>
                <li>• Test cards will simulate successful payments</li>
                <li>• All transactions are recorded as "mock" in the database</li>
                <li>• In production, real payment processing will be integrated</li>
              </ul>
            ) : (
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Only send money for legitimate community aid</li>
                <li>• Keep records of your payment for your own reference</li>
                <li>• Report any suspicious activity to community moderators</li>
                <li>• This is mutual aid - we help each other in times of need</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}