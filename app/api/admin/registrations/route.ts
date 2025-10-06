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

export async function GET(request: NextRequest) {
  try {
    console.log('Authentication check...')
    if (!isAuthenticated(request)) {
      console.log('Authentication failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Authenticated successfully, fetching registrations...')
    
    // Try to fetch from registrations table first if registration_summary doesn't exist
    const { data: registrations, error } = await supabaseAdmin
      .from('registrations')
      .select(`
        *,
        payment_verifications(verified, payment_screenshot_url),
        entry_status(entry_status, entry_time, security_officer)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: error.message },
        { status: 500 }
      )
    }

    console.log('Fetched registrations:', registrations?.length || 0)

    // Transform the data to match the expected format
    const transformedData = registrations?.map(reg => ({
      ...reg,
      total_attendees: reg.registration_type === 'SINGLE' ? 1 : 4,
      amount_due: reg.registration_type === 'SINGLE' ? 500 : 1600,
      payment_verified: reg.payment_verifications?.[0]?.verified || false,
      payment_screenshot_url: reg.payment_verifications?.[0]?.payment_screenshot_url || null,
      registration_date: reg.created_at,
      calculated_age: reg.date_of_birth ? 
        new Date().getFullYear() - new Date(reg.date_of_birth).getFullYear() : null,
      entry_status: reg.entry_status?.[0]?.entry_status || 'NOT_ENTERED',
      entry_time: reg.entry_status?.[0]?.entry_time || null,
      security_officer: reg.entry_status?.[0]?.security_officer || null
    })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}