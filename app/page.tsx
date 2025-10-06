'use client'

import { useState, useEffect } from 'react'
import AdminLogin from '@/components/AdminLogin'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated (has valid cookie)
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/admin/registrations')
      setIsAuthenticated(response.ok)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    // Clear the cookie by making a request (you might want to create a logout endpoint)
    document.cookie = 'admin_token=; Max-Age=0; path=/;'
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  )
}