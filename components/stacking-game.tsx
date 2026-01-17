"use client"

import { useState, useRef } from "react"
import GameCanvas from "./game-canvas"

interface StackingGameProps {
  playerName: string
  onViewLeaderboard: () => void
  onChangeName: () => void
}

export default function StackingGame({ playerName, onViewLeaderboard, onChangeName }: StackingGameProps) {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleGameOver = async (finalScore: number) => {
    setScore(finalScore)
    setGameOver(true)

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: playerName || "Anonymous", 
            score: finalScore 
        })
      });
      console.log("Score saved to database!");
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  }

  const handleRestart = () => {
    setGameOver(false)
    setScore(0)
    setGameKey(prev => prev + 1)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 via-sky-200 to-cyan-200 p-4 overflow-hidden">
      <CloudBackground />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] mb-2 tracking-wide">
            STACK GAME
          </h1>
          <div className="inline-block bg-white/30 backdrop-blur-md rounded-full px-6 py-2 border-2 border-white/50">
            <p className="text-xl text-white font-bold drop-shadow-md">
              Player: {playerName}
            </p>
          </div>
        </div>

        {/* Instructions */}
        {!gameOver && (
            <div className="bg-yellow-100/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-b-4 border-yellow-400 max-w-md text-center mb-6 animate-pulse-slow">
            <p className="text-lg font-black text-yellow-800">CLICK or SPACE to Drop!</p>
            </div>
        )}

        {/* Game Canvas */}
        <div className="bg-white rounded-2xl shadow-2xl p-0 border-8 border-white ring-4 ring-black/5 mb-6 overflow-hidden transform transition-all">
          <GameCanvas 
            key={gameKey} 
            ref={canvasRef} 
            playerName={playerName} 
            onScoreChange={setScore} 
            onGameOver={handleGameOver} 
          />
        </div>

        {/* Live Score Display */}
        {!gameOver && (
          <div className="bg-white rounded-2xl px-8 py-4 shadow-[0_8px_0_rgba(0,0,0,0.1)] border-2 border-gray-100 mb-6">
            <p className="text-4xl font-black text-gray-800 text-center">
              {score}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Current Score</p>
          </div>
        )}

        {/* === IMPROVED GAME OVER SCREEN === */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 1. Backdrop with blur and gradient */}
            <div className="absolute inset-0 bg-sky-900/80 backdrop-blur-sm animate-in fade-in duration-300"></div>

            {/* 2. The Card */}
            <div className="relative bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 border-4 border-white ring-4 ring-sky-300">
              
              {/* Floating Header */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-3 rounded-2xl shadow-lg border-b-4 border-red-700 -rotate-2">
                <h2 className="text-3xl font-black tracking-wider uppercase">Game Over!</h2>
              </div>

              <div className="mt-8 mb-8 space-y-2">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Final Score</p>
                <p className="text-7xl font-black text-gray-800 drop-shadow-sm">{score}</p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={handleRestart}
                  className="w-full py-4 bg-yellow-400 text-yellow-900 font-black text-xl rounded-2xl border-b-4 border-yellow-600 hover:bg-yellow-300 hover:-translate-y-1 active:translate-y-0 active:border-b-0 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>PLAY AGAIN</span>
                  <span className="group-hover:rotate-180 transition-transform duration-300">↺</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                    onClick={onViewLeaderboard}
                    className="py-3 bg-purple-500 text-white font-bold rounded-xl border-b-4 border-purple-700 hover:bg-purple-400 hover:-translate-y-0.5 active:translate-y-0 active:border-b-0 transition-all text-sm"
                    >
                    🏆 Leaderboard
                    </button>
                    
                    <button
                    onClick={onChangeName}
                    className="py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border-b-4 border-gray-300 hover:bg-gray-200 hover:text-gray-600 hover:-translate-y-0.5 active:translate-y-0 active:border-b-0 transition-all text-sm"
                    >
                    👤 Change Name
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Buttons (Only visible when playing) */}
        {!gameOver && (
          <div className="flex gap-4 justify-center flex-wrap opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={onViewLeaderboard}
              className="px-6 py-3 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/30 transition shadow-sm"
            >
              Leaderboard
            </button>
            <button
              onClick={onChangeName}
              className="px-6 py-3 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/30 transition shadow-sm"
            >
              Change Name
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CloudBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full opacity-60 animate-[pulse_4s_ease-in-out_infinite]"></div>
      <div
        className="absolute top-32 right-20 w-40 h-20 bg-white rounded-full opacity-50 animate-[pulse_5s_ease-in-out_infinite]"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-32 left-1/4 w-48 h-24 bg-white rounded-full opacity-40 animate-[pulse_6s_ease-in-out_infinite]"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/3 right-1/4 w-36 h-18 bg-white rounded-full opacity-50 animate-[pulse_7s_ease-in-out_infinite]"
        style={{ animationDelay: "1.5s" }}
      ></div>
    </div>
  )
}