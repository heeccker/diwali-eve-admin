'use client'

import { useState, useEffect } from 'react'
import { RegistrationSummary } from '@/lib/supabase'

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [securityOfficer, setSecurityOfficer] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'entry' | 'payment'
    action: string
    ticketId: string
    name: string
  } | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationSummary[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRegistrations(registrations)
    } else {
      const filtered = registrations.filter(registration => 
        registration.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.phone.includes(searchTerm)
      )
      setFilteredRegistrations(filtered)
    }
  }, [registrations, searchTerm])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations')
      if (!response.ok) {
        throw new Error('Failed to fetch registrations')
      }
      const data = await response.json()
      setRegistrations(data)
    } catch (error) {
      setError('Failed to load registrations')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const showEntryConfirmation = (ticketId: string, status: 'NOT_ENTERED' | 'ENTERED', name: string) => {
    setConfirmAction({
      type: 'entry',
      action: status,
      ticketId,
      name
    })
    setShowConfirmDialog(true)
  }

  const updateEntryStatus = async (ticketId: string, status: 'NOT_ENTERED' | 'ENTERED') => {
    try {
      const response = await fetch('/api/admin/entry-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          entry_status: status,
          security_officer: status === 'ENTERED' ? securityOfficer || 'Security' : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update entry status')
      }

      await fetchRegistrations() // Refresh data
      const actionName = confirmAction?.name || 'user'
      setShowConfirmDialog(false)
      setConfirmAction(null)
      setSuccessMessage(`Entry status updated successfully for ${actionName}`)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating entry status:', error)
      setError('Failed to update entry status')
    }
  }

  const showPaymentConfirmation = (ticketId: string, verified: boolean, name: string) => {
    setConfirmAction({
      type: 'payment',
      action: verified ? 'verify' : 'reject',
      ticketId,
      name
    })
    setShowConfirmDialog(true)
  }

  const updatePaymentVerification = async (ticketId: string, verified: boolean) => {
    try {
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          verified
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update payment verification')
      }

      await fetchRegistrations() // Refresh data
      const actionName = confirmAction?.name || 'user'
      setShowConfirmDialog(false)
      setConfirmAction(null)
      setSuccessMessage(`Payment verification updated successfully for ${actionName}`)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating payment verification:', error)
      setError('Failed to update payment verification')
    }
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.type === 'entry') {
      updateEntryStatus(confirmAction.ticketId, confirmAction.action as 'NOT_ENTERED' | 'ENTERED')
    } else if (confirmAction.type === 'payment') {
      updatePaymentVerification(confirmAction.ticketId, confirmAction.action === 'verify')
    }
  }

  const handleCancelAction = () => {
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  const toggleGroupExpansion = (ticketId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN')
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium border"
    switch (status) {
      case 'ENTERED':
        return `${baseClasses} bg-green-900/50 text-green-300 border-green-800`
      case 'NOT_ENTERED':
        return `${baseClasses} bg-yellow-900/50 text-yellow-300 border-yellow-800`
      default:
        return `${baseClasses} bg-neutral-800 text-neutral-300 border-neutral-700`
    }
  }

  const getPaymentBadge = (verified: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium border"
    return verified 
      ? `${baseClasses} bg-green-900/50 text-green-300 border-green-800`
      : `${baseClasses} bg-red-900/50 text-red-300 border-red-800`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg text-white">Loading registrations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-neutral-400">Diwali Night 2025 Event Management</p>
            </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by ticket ID, name, email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 px-3 py-2 pl-9 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 rounded-lg text-sm focus:outline-none focus:border-neutral-600"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-2.5 h-4 w-4 text-neutral-400 hover:text-white"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Security Officer Name"
                value={securityOfficer}
                onChange={(e) => setSecurityOfficer(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 rounded-lg text-sm focus:outline-none focus:border-neutral-600"
              />
              <button
                onClick={onLogout}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="mb-6 bg-green-900/50 border border-green-800 text-green-200 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-colors">
            <div className="text-2xl font-bold text-white mb-1">
              {searchTerm ? filteredRegistrations.length : registrations.length}
            </div>
            <div className="text-neutral-400 text-sm">
              {searchTerm ? 'Filtered Results' : 'Total Registrations'}
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-colors">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {(searchTerm ? filteredRegistrations : registrations).filter(r => r.payment_verified).length}
            </div>
            <div className="text-neutral-400 text-sm">Payment Verified</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-colors">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {(searchTerm ? filteredRegistrations : registrations).filter(r => r.entry_status === 'ENTERED').length}
            </div>
            <div className="text-neutral-400 text-sm">Attendees Entered</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-colors">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {(searchTerm ? filteredRegistrations : registrations).reduce((sum, r) => sum + r.total_attendees, 0)}
            </div>
            <div className="text-neutral-400 text-sm">Total Attendees</div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-white">
                {searchTerm ? `Search Results (${filteredRegistrations.length})` : 'All Registrations'}
              </h2>
              {searchTerm && (
                <p className="text-sm text-neutral-400 mt-1">
                  Showing results for "{searchTerm}"
                </p>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Name & Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Registration Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Group Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Entry Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-900 divide-y divide-neutral-800">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-neutral-400">
                        {searchTerm ? (
                          <div>
                            <svg className="mx-auto h-12 w-12 text-neutral-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-neutral-300 mb-2">No results found</h3>
                            <p className="text-sm">Try adjusting your search terms or clear the search to see all registrations.</p>
                          </div>
                        ) : (
                          <div>
                            <svg className="mx-auto h-12 w-12 text-neutral-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-lg font-medium text-neutral-300 mb-2">No registrations yet</h3>
                            <p className="text-sm">Registrations will appear here once people start signing up for the event.</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((registration) => (
                  <tr key={registration.ticket_id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                      {registration.ticket_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-white">{registration.name}</div>
                        <div className="text-neutral-400">{registration.email}</div>
                        <div className="text-neutral-400">{registration.phone}</div>
                        <div className="text-neutral-500 text-xs">
                          Age: {registration.calculated_age} | DOB: {new Date(registration.date_of_birth).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-white">{registration.registration_type}</div>
                        <div className="text-neutral-400 text-xs">
                          {registration.total_attendees} attendee{registration.total_attendees > 1 ? 's' : ''}
                        </div>
                        <div className="text-neutral-400 text-xs">₹{registration.amount_due}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registration.registration_type === 'GROUP' && registration.group_members ? (
                        <div className="text-sm">
                          <button
                            onClick={() => toggleGroupExpansion(registration.ticket_id)}
                            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <svg 
                              className={`w-4 h-4 mr-1 transform transition-transform ${expandedGroups.has(registration.ticket_id) ? 'rotate-90' : ''}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            {Array.isArray(registration.group_members) ? registration.group_members.length : 0} members
                          </button>
                          {expandedGroups.has(registration.ticket_id) && Array.isArray(registration.group_members) && (
                            <div className="mt-2 pl-5 space-y-2">
                              {registration.group_members.map((member: any, index: number) => (
                                <div key={index} className="bg-neutral-800 p-2 rounded text-xs">
                                  <div className="font-medium text-white">{member.name}</div>
                                  <div className="text-neutral-400">{member.email}</div>
                                  <div className="text-neutral-400">{member.phone}</div>
                                  {member.date_of_birth && (
                                    <div className="text-neutral-400">
                                      DOB: {new Date(member.date_of_birth).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPaymentBadge(registration.payment_verified)}>
                        {registration.payment_verified ? 'Verified' : 'Pending'}
                      </span>
                      {registration.payment_screenshot_url && (
                        <div className="mt-1">
                          <a
                            href={registration.payment_screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs underline"
                          >
                            View Screenshot
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(registration.entry_status || 'NOT_ENTERED')}>
                        {registration.entry_status || 'NOT_ENTERED'}
                      </span>
                      {registration.entry_time && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {formatDate(registration.entry_time)}
                        </div>
                      )}
                      {registration.security_officer && (
                        <div className="text-xs text-neutral-500">
                          By: {registration.security_officer}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-2">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => showEntryConfirmation(registration.ticket_id, 'ENTERED', registration.name)}
                            disabled={registration.entry_status === 'ENTERED'}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
                          >
                            Mark Entered
                          </button>
                          <button
                            onClick={() => showEntryConfirmation(registration.ticket_id, 'NOT_ENTERED', registration.name)}
                            disabled={registration.entry_status === 'NOT_ENTERED'}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
                          >
                            Reset Entry
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => showPaymentConfirmation(registration.ticket_id, true, registration.name)}
                            disabled={registration.payment_verified}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
                          >
                            Verify Payment
                          </button>
                          <button
                            onClick={() => showPaymentConfirmation(registration.ticket_id, false, registration.name)}
                            disabled={!registration.payment_verified}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
                          >
                            Reject Payment
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-white text-center mb-2">
                Confirm Action
              </h3>

              <p className="text-neutral-400 text-center mb-6">
                {confirmAction.type === 'entry' ? (
                  <>
                    Are you sure you want to mark <span className="font-semibold text-white">{confirmAction.name}</span> as{' '}
                    <span className="font-semibold text-white">
                      {confirmAction.action === 'ENTERED' ? 'ENTERED' : 'NOT ENTERED'}
                    </span>
                    ?
                    {confirmAction.action === 'ENTERED' && securityOfficer && (
                      <span className="block mt-2 text-sm">
                        Security Officer: <span className="font-medium text-white">{securityOfficer}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Are you sure you want to{' '}
                    <span className="font-semibold text-white">
                      {confirmAction.action === 'verify' ? 'VERIFY' : 'REJECT'}
                    </span>{' '}
                    the payment for <span className="font-semibold text-white">{confirmAction.name}</span>?
                  </>
                )}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2 text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                    confirmAction.type === 'entry'
                      ? confirmAction.action === 'ENTERED'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                      : confirmAction.action === 'verify'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction.type === 'entry'
                    ? confirmAction.action === 'ENTERED'
                      ? 'Mark as Entered'
                      : 'Reset Entry'
                    : confirmAction.action === 'verify'
                    ? 'Verify Payment'
                    : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}