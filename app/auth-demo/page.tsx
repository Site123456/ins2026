'use client';

import { useState } from 'react';
import { useSubscriptionVerification } from '@/hooks/useSubscriptionVerification';

export default function AuthDemoPage() {
  const [email, setEmail] = useState('');
  const { isSubscribed, subscriber, loading, error, verifySubscription } = useSubscriptionVerification();

  const handleVerify = () => {
    if (email) {
      verifySubscription(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Authentication & Subscription Demo
            </h1>
            <p className="text-xl text-gray-300">
              Experience the new authentication system and subscription verification
            </p>
          </div>

          {/* Auth Buttons Demo */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Authentication UI</h2>
            <p className="text-gray-300 mb-6">
              The authentication buttons are now fixed in the top-right corner of every page.
              Click them to see the beautiful modal forms in action!
            </p>
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400">
                💡 <strong>Try it:</strong> Look at the top-right corner of this page - you'll see the Sign In and Sign Up buttons!
              </p>
            </div>
          </div>

          {/* Subscription Verification Demo */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Subscription Verification</h2>
            <p className="text-gray-300 mb-6">
              Test the subscription verification system. Enter an email to check if it's subscribed.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to verify"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading || !email}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {isSubscribed !== null && !error && (
                <div className={`rounded-lg p-4 border ${
                  isSubscribed
                    ? 'bg-green-500/20 border-green-500/30'
                    : 'bg-yellow-500/20 border-yellow-500/30'
                }`}>
                  {isSubscribed ? (
                    <div>
                      <p className="text-green-300 font-medium mb-2">✅ Email is subscribed!</p>
                      {subscriber && (
                        <div className="text-green-200 text-sm space-y-1">
                          <p><strong>Name:</strong> {subscriber.name}</p>
                          <p><strong>Email:</strong> {subscriber.email}</p>
                          <p><strong>Subscribed:</strong> {new Date(subscriber.subscribedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-yellow-300">❌ Email is not subscribed</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🎨 Beautiful UI</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Fixed top-right authentication buttons</li>
                <li>• Responsive modal forms</li>
                <li>• Smooth animations and transitions</li>
                <li>• Dark/light theme support</li>
                <li>• Mobile-optimized design</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🔒 Secure Backend</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• MongoDB database integration</li>
                <li>• Email verification system</li>
                <li>• Secure authentication flow</li>
                <li>• Input validation and sanitization</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">📱 User Experience</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• One-click sign in/up</li>
                <li>• User account dropdown</li>
                <li>• Profile and settings access</li>
                <li>• Seamless navigation</li>
                <li>• Loading states and feedback</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">🛠️ Developer Friendly</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• TypeScript support</li>
                <li>• Reusable React components</li>
                <li>• Custom hooks for auth logic</li>
                <li>• Easy integration</li>
                <li>• Well-documented APIs</li>
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-purple-100 mb-6">
                The authentication system is now live! Try signing up or signing in using the buttons in the top-right corner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Try Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}