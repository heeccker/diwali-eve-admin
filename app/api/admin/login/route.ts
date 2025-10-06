import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const isValid = await verifyAdminPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create a simple JWT-like token (in production, use proper JWT)
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64')

    const response = NextResponse.json(
      { message: 'Authentication successful' },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}