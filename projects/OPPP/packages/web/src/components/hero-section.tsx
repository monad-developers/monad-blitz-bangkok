"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function HeroSection() {


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      <div className="relative container mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <Badge className="mb-6 border-purple-400/30 bg-purple-500/20 px-4 py-2 text-sm text-purple-200">
            Privacy-First Music Platform
          </Badge>

          <h1 className="mb-6 text-4xl leading-tight font-bold text-white md:text-6xl lg:text-7xl">
            Share. Discover. Connect.
            <span className="mt-2 block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              With Sonad
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-300 md:text-2xl">
            A privacy-preserving social music platform on Monad. Share your music taste,
            discover new artists, and connect with like-minded music lovers - all while keeping your data private.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {/* Creator Tips */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/15">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-400 to-pink-400">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-white">Music Discovery</h3>
            <p className="leading-relaxed text-gray-300">
              Discover new music through zero-knowledge proofs. Share your taste
              while maintaining privacy about your listening habits.
            </p>
          </div>

          {/* Community Validation */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/15">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-white">
              Social Connections
            </h3>
            <p className="leading-relaxed text-gray-300">
              Connect with music lovers who share your taste. Build meaningful
              relationships through music while keeping your personal data private
              and secure.
            </p>
          </div>

          {/* NFT Airdrops */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:bg-white/15">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-400">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-4 text-2xl font-bold text-white">Privacy Protection</h3>
            <p className="leading-relaxed text-gray-300">
              Built on Monad with zero-knowledge technology. Your music preferences,
              listening history, and social connections remain completely private
              and under your control.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-16 text-center">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
            >
              Start Sharing Music
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/10"
            >
              🎵 Discover Artists
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div>
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
              5K+
            </div>
            <div className="text-gray-300">Music Lovers</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
              25K+
            </div>
            <div className="text-gray-300">Songs Shared</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
              100%
            </div>
            <div className="text-gray-300">Privacy Protected</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
              Zero
            </div>
            <div className="text-gray-300">Data Sold</div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 h-20 w-20 animate-pulse rounded-full bg-purple-500/20 blur-xl"></div>
      <div className="absolute right-10 bottom-20 h-32 w-32 animate-pulse rounded-full bg-pink-500/20 blur-xl delay-1000"></div>
      <div className="absolute top-1/2 right-20 h-16 w-16 animate-pulse rounded-full bg-blue-500/20 blur-xl delay-500"></div>
    </div>
  )
}
