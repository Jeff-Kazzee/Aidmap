import { supabase } from '../lib/supabase';

export interface MockPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface MockCard {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  name: string;
}

// Simulate processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock payment processor
export async function processMockPayment(
  amount: number,
  aidRequestId: string,
  card: MockCard,
  userId: string
): Promise<MockPaymentResult> {
  try {
    // Validate mock card (accept common test card numbers)
    const validTestCards = [
      '4242424242424242', // Visa
      '5555555555554444', // Mastercard
      '378282246310005',  // Amex
    ];
    
    const cleanCardNumber = card.number.replace(/\s/g, '');
    
    if (!validTestCards.includes(cleanCardNumber)) {
      // For demo, accept any 16-digit number
      if (!/^\d{16}$/.test(cleanCardNumber)) {
        return {
          success: false,
          error: 'Invalid card number. Use 4242 4242 4242 4242 for demo.'
        };
      }
    }

    // Simulate processing time (2-3 seconds)
    await delay(2000 + Math.random() * 1000);

    // Generate mock transaction ID
    const transactionId = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record in database
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        aid_request_id: aidRequestId,
        donor_id: userId,
        amount_algo: amount,
        tx_hash: transactionId,
        status: 'confirmed'
      });

    if (txError) {
      console.error('Transaction insert error:', txError);
      return {
        success: false,
        error: 'Failed to record transaction'
      };
    }

    // Update aid request status to funded
    const { error: updateError } = await supabase
      .from('aid_requests')
      .update({
        status: 'funded',
        donor_id: userId,
        funded_at: new Date().toISOString()
      })
      .eq('id', aidRequestId);

    if (updateError) {
      console.error('Aid request update error:', updateError);
      return {
        success: false,
        error: 'Failed to update aid request status'
      };
    }

    return {
      success: true,
      transactionId
    };
  } catch (error) {
    console.error('Mock payment error:', error);
    return {
      success: false,
      error: 'Payment processing failed'
    };
  }
}

// Mock escrow release (for completing aid requests)
export async function releaseMockEscrow(
  aidRequestId: string,
  proofOfDeliveryUrl?: string
): Promise<MockPaymentResult> {
  try {
    await delay(1500);

    // Update aid request to completed
    const { error } = await supabase
      .from('aid_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        proof_of_delivery_url: proofOfDeliveryUrl
      })
      .eq('id', aidRequestId);

    if (error) {
      return {
        success: false,
        error: 'Failed to complete aid request'
      };
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'released' })
      .eq('aid_request_id', aidRequestId);

    return {
      success: true,
      transactionId: `escrow_release_${Date.now()}`
    };
  } catch (error) {
    console.error('Escrow release error:', error);
    return {
      success: false,
      error: 'Failed to release escrow'
    };
  }
}

// Get mock balance (for demo purposes)
export function getMockBalance(): number {
  // Return a random balance between 100-1000 ALGO
  return Math.floor(Math.random() * 900) + 100;
}

// Format amount for display
export function formatAlgoAmount(amount: number): string {
  return `${amount.toFixed(2)} ALGO`;
}