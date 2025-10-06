'use client'

import { useState } from 'react'

interface AdminLoginProps {
  onLogin: () => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      onLogin()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Diwali Night 2025 Event Management
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-200 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors"
                placeholder="Enter admin password"
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <p className="font-medium text-neutral-200 mb-3 text-sm">Admin Features</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                View registrations
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                Verify payments
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                Track entry status
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-2"></div>
                Real-time analytics
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}