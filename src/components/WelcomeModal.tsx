import React, { useState, useEffect } from 'react'
import { X, MapPin, Heart, Users, Shield, Navigation, Eye } from 'lucide-react'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1003]">
      <div className={`bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 p-3 rounded-full w-16 h-16 mx-auto mb-4">
                <Heart className="h-10 w-10 text-white mx-auto" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to AidMap!</h1>
              <p className="text-blue-100">
                Your community mutual aid platform
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Connect with your community to give and receive help
              </h2>
              <p className="text-gray-600">
                AidMap makes it easy to support your neighbors and get help when you need it most.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Location-Based Help</h3>
                  <p className="text-sm text-gray-600">
                    Find and offer help in your immediate neighborhood
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mutual Aid</h3>
                  <p className="text-sm text-gray-600">
                    This is community support, not charity - we help each other
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Community Chat</h3>
                  <p className="text-sm text-gray-600">
                    Connect with neighbors through neighborhood discussions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Safe & Verified</h3>
                  <p className="text-sm text-gray-600">
                    Optional verification system to build trust in the community
                  </p>
                </div>
              </div>
            </div>

            {/* How to get started */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Getting Started</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Click anywhere on the map to post a need or help request</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Click on markers to see what help others need</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Join a neighborhood to access community chat</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Consider getting verified to unlock more features</span>
                </li>
              </ol>
            </div>

            {/* Map features */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Map Features</h3>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4" />
                  <span>GPS location enabled - find your exact position</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Privacy mode protects exact locations while maintaining utility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Blue markers show your location, red markers show aid requests</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              Start Exploring AidMap
            </button>

            {/* Footer note */}
            <p className="text-xs text-gray-500 text-center">
              You can access this information anytime from the help section
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}