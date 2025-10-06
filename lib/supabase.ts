import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service client with elevated privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type Registration = {
  id: string
  name: string
  email: string
  phone: string
  date_of_birth: string
  parent_husband_mobile: string
  registration_type: 'SINGLE' | 'GROUP'
  group_members?: any[]
  ticket_id: string
  created_at: string
}

export type PaymentVerification = {
  id: string
  ticket_id: string
  payment_screenshot_url: string
  upi_reference?: string
  verified: boolean
  created_at: string
}

export type EntryStatus = {
  id: string
  ticket_id: string
  entry_status: 'NOT_ENTERED' | 'ENTERED'
  entry_time?: string
  security_officer?: string
  created_at: string
  updated_at: string
}

export type RegistrationSummary = Registration & {
  total_attendees: number
  amount_due: number
  payment_verified: boolean
  payment_screenshot_url?: string
  registration_date: string
  calculated_age: number
  entry_status?: 'NOT_ENTERED' | 'ENTERED'
  entry_time?: string
  security_officer?: string
}