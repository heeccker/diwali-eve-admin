import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      )
    }

    console.log('Database connection successful')
    return NextResponse.json({ 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}