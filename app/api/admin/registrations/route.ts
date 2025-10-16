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
    
    // Fetch from registration_summary view which includes member_entries
    const { data: registrations, error } = await supabaseAdmin
      .from('registration_summary')
      .select('*')
      .order('registration_date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      
      // Fallback to direct table query if view doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('registrations')
        .select(`
          *,
          payment_verifications(verified, payment_screenshot_url, upi_reference),
          entry_status(entry_status, entry_time, security_officer, member_entries)
        `)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('Fallback query error:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to fetch registrations', details: fallbackError.message },
          { status: 500 }
        )
      }

      // Transform fallback data
      const transformedFallback = fallbackData?.map(reg => ({
        ...reg,
        total_attendees: reg.registration_type === 'SINGLE' ? 1 : 4,
        amount_due: reg.registration_type === 'SINGLE' ? 500 : 1600,
        payment_verified: reg.payment_verifications?.[0]?.verified || false,
        payment_screenshot_url: reg.payment_verifications?.[0]?.payment_screenshot_url || null,
        upi_reference: reg.payment_verifications?.[0]?.upi_reference || null,
        registration_date: reg.created_at,
        calculated_age: reg.date_of_birth ? 
          new Date().getFullYear() - new Date(reg.date_of_birth).getFullYear() : null,
        entry_status: reg.entry_status?.[0]?.entry_status || 'NOT_ENTERED',
        entry_time: reg.entry_status?.[0]?.entry_time || null,
        security_officer: reg.entry_status?.[0]?.security_officer || null,
        member_entries: reg.entry_status?.[0]?.member_entries || [],
        members_entered_count: reg.entry_status?.[0]?.member_entries ? 
          reg.entry_status[0].member_entries.filter((m: any) => m.entered).length : 0
      })) || []

      return NextResponse.json(transformedFallback)
    }

    console.log('Fetched registrations:', registrations?.length || 0)

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}