"use client"

import type React from "react"
import { useState } from "react"

interface PlayerEntryProps {
  onNameSubmit: (name: string) => void
}

export default function PlayerEntry({ onNameSubmit }: PlayerEntryProps) {
  const [name, setName] = useState("")
  const [isHovering, setIsHovering] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onNameSubmit(name.trim())
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-sky-300">
      {/* Dynamic Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-cyan-200">
        <MovingClouds />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
        
        {/* Bouncing Title */}
        <div className="mb-8 text-center animate-bounce-slow">
          <h1 className="text-7xl font-black tracking-wider text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transform -rotate-2">
            <span className="text-yellow-300">CHICK</span>
            <span className="block text-6xl text-white mt-[-10px]">STACK</span>
          </h1>
        </div>

        {/* Card Container */}
        <div className="relative w-full">
          {/* The Mascot sitting on the box */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
            <BouncingChick happy={isHovering} />
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="w-full bg-white rounded-3xl p-8 pt-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-b-8 border-gray-200"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="text-center mb-6">
              <label className="block text-gray-500 font-bold uppercase tracking-wide text-sm mb-2">
                Player Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cluck Norris"
                className="w-full px-6 py-4 text-xl font-bold text-center text-gray-700 bg-gray-50 border-4 border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-400 focus:bg-white transition-all placeholder:text-gray-300 placeholder:font-normal"
                autoFocus
                maxLength={12}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className={`w-full group relative px-6 py-4 font-black text-xl rounded-2xl transition-all duration-150 transform active:translate-y-1 active:border-b-0
                ${name.trim() 
                  ? 'bg-yellow-400 text-yellow-900 border-b-4 border-yellow-600 hover:bg-yellow-300 hover:-translate-y-0.5' 
                  : 'bg-gray-200 text-gray-400 border-b-4 border-gray-300 cursor-not-allowed'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                START GAME 
                {name.trim() && <span className="group-hover:animate-ping">🚀</span>}
              </span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-white/80 font-medium text-sm drop-shadow-md">
          Help the chick reach the sky!
        </p>
      </div>
    </div>
  )
}

// --- Sub Components for Visual Flair ---

function BouncingChick({ happy }: { happy: boolean }) {
  return (
    <div className={`transition-transform duration-300 ${happy ? 'scale-110 translate-y-2' : 'animate-bounce'}`}>
      <div className="relative w-24 h-24">
        {/* Body */}
        <div className="absolute inset-0 bg-yellow-400 rounded-full border-4 border-yellow-600 shadow-inner"></div>
        {/* Eyes */}
        <div className="absolute top-8 left-6 w-3 h-3 bg-black rounded-full animate-blink"></div>
        <div className="absolute top-8 right-6 w-3 h-3 bg-black rounded-full animate-blink"></div>
        {/* Blush */}
        <div className="absolute top-10 left-4 w-4 h-2 bg-pink-300 rounded-full opacity-60"></div>
        <div className="absolute top-10 right-4 w-4 h-2 bg-pink-300 rounded-full opacity-60"></div>
        {/* Beak */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-500 rounded-sm rotate-45 border-2 border-orange-600"></div>
        {/* Wing (Right) */}
        <div className={`absolute top-12 -right-2 w-6 h-8 bg-yellow-500 rounded-full border-2 border-yellow-600 origin-top-left transition-transform ${happy ? 'rotate-45' : 'rotate-12'}`}></div>
        {/* Wing (Left) */}
        <div className={`absolute top-12 -left-2 w-6 h-8 bg-yellow-500 rounded-full border-2 border-yellow-600 origin-top-right transition-transform ${happy ? '-rotate-45' : '-rotate-12'}`}></div>
        {/* Comb (Top hair) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-6 bg-red-500 rounded-full border-2 border-red-700"></div>
      </div>
    </div>
  )
}

function MovingClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Cloud 1 */}
      <div className="absolute top-10 left-[-100px] opacity-80 animate-[float_15s_linear_infinite]">
        <CloudShape scale={1.2} />
      </div>
      {/* Cloud 2 */}
      <div className="absolute top-40 right-[-100px] opacity-60 animate-[float_25s_linear_infinite_reverse]">
        <CloudShape scale={0.8} />
      </div>
      {/* Cloud 3 */}
      <div className="absolute bottom-20 left-1/4 opacity-40 animate-[pulse_4s_ease-in-out_infinite]">
        <CloudShape scale={1.5} />
      </div>
    </div>
  )
}

function CloudShape({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ transform: `scale(${scale})` }} className="relative text-white">
      <div className="w-24 h-24 bg-current rounded-full absolute top-0 left-0"></div>
      <div className="w-32 h-32 bg-current rounded-full absolute -top-12 left-10"></div>
      <div className="w-24 h-24 bg-current rounded-full absolute top-0 left-32"></div>
    </div>
  )
}