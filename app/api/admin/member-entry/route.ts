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

    const { ticket_id, member_name, member_email, entered, security_officer } = await request.json()

    console.log('Member entry update request:', { ticket_id, member_name, member_email, entered, security_officer })

    // Use member_name if provided, fallback to member_email for backward compatibility
    const identifier = member_name || member_email

    if (!ticket_id || !identifier || typeof entered !== 'boolean') {
      return NextResponse.json(
        { error: 'Ticket ID, member name/email, and entry status are required' },
        { status: 400 }
      )
    }

    // Call the database function to update member entry by NAME
    const { data, error } = await supabaseAdmin.rpc('update_member_entry', {
      p_ticket_id: ticket_id,
      p_member_name: identifier,  // Now using name instead of email
      p_entered: entered,
      p_security_officer: security_officer || null
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update member entry status', details: error.message },
        { status: 500 }
      )
    }

    console.log('Member entry updated successfully for:', identifier)

    return NextResponse.json({ 
      message: 'Member entry status updated successfully',
      data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}