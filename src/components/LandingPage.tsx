import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Users, Shield, ArrowRight, CheckCircle, Globe, Smartphone, MessageCircle, Wrench, Baby, Coffee } from 'lucide-react'

export function LandingPage() {
  const features = [
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Location-Based Help",
      description: "Find and offer help in your immediate neighborhood with precise location mapping"
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Mutual Aid Network",
      description: "Everyone has something to offer - from babysitting to tool sharing, skills to time"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Neighborhood Chat",
      description: "Connect with verified community members through secure messaging and discussions"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Safe & Verified",
      description: "Optional identity verification system builds trust and ensures community safety"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Optimized",
      description: "Access help and offer support from anywhere with our responsive design"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Privacy Protected",
      description: "Smart location privacy features protect your exact address while enabling help"
    }
  ]

  const helpTypes = [
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Skills & Services",
      examples: ["Home repairs", "Tech support", "Tutoring", "Pet care"]
    },
    {
      icon: <Baby className="h-8 w-8" />,
      title: "Time & Care",
      examples: ["Babysitting", "Elder care", "Dog walking", "Errands"]
    },
    {
      icon: <Coffee className="h-8 w-8" />,
      title: "Resources & Items",
      examples: ["Tool lending", "Meal sharing", "Transportation", "Equipment"]
    }
  ]

  const stats = [
    { number: "Growing", label: "Community Network" },
    { number: "Secure", label: "Platform" },
    { number: "Local", label: "Neighborhoods" },
    { number: "Free", label: "To Join" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-full">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">AidMap</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">How It Works</a>
              <a href="#community" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Community</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Community
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mutual Aid Network
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto leading-relaxed">
              Connect with neighbors to give and receive help when it matters most. 
              Share skills, time, resources, and support - not charity, but community.
            </p>
            <p className="text-lg text-blue-600 mb-8 font-medium max-w-3xl mx-auto">
              Everyone has something valuable to offer, whether it's babysitting, tool sharing, 
              home repairs, or just lending a helping hand.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/auth"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-xl font-semibold text-lg flex items-center space-x-2"
              >
                <span>Start Helping Today</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Help Types Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everyone Has Something
              <span className="block text-green-600">Valuable to Offer</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              AidMap isn't about charity - it's about mutual aid where neighbors support neighbors.
            </p>
            <p className="text-lg text-green-600 font-medium max-w-2xl mx-auto">
              Help doesn't always mean money. Your time, skills, and resources are just as valuable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {helpTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl w-fit mb-6 shadow-lg">
                  {type.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{type.title}</h3>
                <ul className="space-y-2">
                  {type.examples.map((example, i) => (
                    <li key={i} className="flex items-center space-x-2 text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">The Power of Reciprocity</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              When you help someone fix their bike, they might help you with babysitting. 
              When you share your tools, someone might share their cooking skills. 
              <span className="font-semibold text-green-600"> This is how real communities thrive.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="block text-blue-600">Community Support</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AidMap provides all the tools necessary to build stronger, more connected neighborhoods
              where everyone can both give and receive help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl w-fit mb-6 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How AidMap Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started is simple. Join your neighborhood and start making connections in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sign Up & Verify</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your account and optionally verify your identity to build trust with neighbors.
                Join your local neighborhood community.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Share What You Need or Offer</h3>
              <p className="text-gray-600 leading-relaxed">
                Post what you need help with or browse requests to see how you can help.
                Remember: help comes in many forms - time, skills, resources, or support.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect & Exchange</h3>
              <p className="text-gray-600 leading-relaxed">
                Message neighbors securely, coordinate mutual aid, and build lasting
                community connections where everyone both gives and receives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Join a Growing Movement
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be part of the solution. Help build stronger, more resilient communities
              where neighbors support neighbors through mutual aid.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Mutual Aid, Not Charity</h3>
                    <p className="text-gray-600">We believe everyone can help return a favor. Share skills, time, tools, or support - everyone has something valuable to offer.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Beyond Money</h3>
                    <p className="text-gray-600">Help comes in many forms - babysitting, tool sharing, home repairs, tutoring, pet care, or simply being there when needed.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Reciprocal Community</h3>
                    <p className="text-gray-600">Today you help with groceries, tomorrow someone helps with your garden. This is how real communities thrive.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <MessageCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Real Connections</h3>
                    <p className="text-gray-600">Build lasting relationships with neighbors that extend beyond individual requests and create stronger communities.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ready to Get Started?</h3>
              <div className="space-y-4">
                <Link
                  to="/auth"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg font-semibold text-lg flex items-center justify-center space-x-2"
                >
                  <span>Join Your Community</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="text-sm text-gray-600 text-center">
                  Free to join • No credit card required • Start helping immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AidMap</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Building stronger communities through mutual aid and neighbor-to-neighbor support.
                Together, we can create resilient neighborhoods where everyone thrives.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Standards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Verification</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AidMap. All rights reserved. Built with ❤️ for stronger communities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}