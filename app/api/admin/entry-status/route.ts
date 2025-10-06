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

    const { ticket_id, entry_status, security_officer } = await request.json()

    if (!ticket_id || !entry_status) {
      return NextResponse.json(
        { error: 'Ticket ID and entry status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      entry_status,
      updated_at: new Date().toISOString()
    }

    if (entry_status === 'ENTERED') {
      updateData.entry_time = new Date().toISOString()
      if (security_officer) {
        updateData.security_officer = security_officer
      }
    }

    const { data, error } = await supabaseAdmin
      .from('entry_status')
      .update(updateData)
      .eq('ticket_id', ticket_id)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update entry status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Entry status updated successfully',
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