"use client"

import type React from "react"

import { useState } from "react"

interface PlayerEntryProps {
  onNameSubmit: (name: string) => void
}

export default function PlayerEntry({ onNameSubmit }: PlayerEntryProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onNameSubmit(name.trim())
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 via-sky-200 to-cyan-200">
      <CloudBackground />

      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Chick Stack</h1>
        <p className="text-2xl text-white mb-12 drop-shadow-lg">Help the chick jump over the blocks!</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl w-80">
          <label className="block text-gray-800 font-bold mb-4 text-lg">Enter Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 mb-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 text-gray-800"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-yellow-400 text-gray-800 font-bold text-lg rounded-lg hover:bg-yellow-300 transition"
          >
            Play Now
          </button>
        </form>
      </div>
    </div>
  )
}

function CloudBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full opacity-70 animate-pulse"></div>
      <div
        className="absolute top-32 right-20 w-40 h-20 bg-white rounded-full opacity-60 animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-32 left-1/4 w-48 h-24 bg-white rounded-full opacity-50 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/3 right-1/4 w-36 h-18 bg-white rounded-full opacity-60 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
    </div>
  )
}
