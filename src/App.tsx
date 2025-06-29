import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Auth } from './components/Auth'
import { Map } from './components/Map'
import { Dashboard } from './components/Dashboard'
import { Messages } from './components/Messages'
import { CommunityChat } from './components/CommunityChat'
import { DirectMessages } from './components/DirectMessages'
import { UserVerification } from './components/UserVerification'
import { LandingPage } from './components/LandingPage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-blue-600 p-3 rounded-full animate-pulse">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Loading AidMap</h2>
          <p className="mt-2 text-gray-600">Connecting your community...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Landing page for non-authenticated users */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/map" replace /> : <LandingPage />} 
        />
        
        <Route path="/auth" element={<Auth />} />
        
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/map" element={<Map />} />
                <Route
                  path="/dashboard"
                  element={user ? <Dashboard /> : <Navigate to="/auth" replace />}
                />
                <Route
                  path="/messages"
                  element={user ? <Messages /> : <Navigate to="/auth" replace />}
                />
                <Route
                  path="/community"
                  element={user ? <CommunityChat /> : <Navigate to="/auth" replace />}
                />
                <Route
                  path="/direct-messages"
                  element={user ? <DirectMessages /> : <Navigate to="/auth" replace />}
                />
                <Route
                  path="/verification"
                  element={user ? <UserVerification /> : <Navigate to="/auth" replace />}
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App