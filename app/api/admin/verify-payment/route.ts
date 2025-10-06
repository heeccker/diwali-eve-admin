import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return false
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    return decoded.startsWith('admin:')
  } catch (error) {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { ticket_id, verified } = await request.json()

    if (!ticket_id || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Ticket ID and verification status are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('payment_verifications')
      .update({ verified })
      .eq('ticket_id', ticket_id)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update payment verification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Payment verification updated successfully',
      data: data[0]
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}