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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore)
    setGameOver(true)

    const scores = JSON.parse(localStorage.getItem("scores") || "[]")
    scores.push({ name: playerName, score: finalScore, date: new Date().toISOString() })
    scores.sort((a, b) => b.score - a.score) // Sort scores in descending order
    localStorage.setItem("scores", JSON.stringify(scores))
  }

  const handleRestart = () => {
    setGameOver(false)
    setScore(0)
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 via-sky-200 to-cyan-200 p-4">
      <CloudBackground />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header with player info */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-2">Stack Game</h1>
          <p className="text-2xl text-white font-semibold drop-shadow-lg">Player: {playerName}</p>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-100 rounded-2xl p-4 shadow-lg border-2 border-yellow-400 max-w-md text-center mb-6">
          <p className="text-lg font-bold text-gray-800">Press SPACE or Click to DROP the block!</p>
          <p className="text-sm text-gray-700 mt-2">Stack blocks perfectly to get a high score!</p>
        </div>

        {/* Game Canvas */}
        <div className="bg-white rounded-2xl shadow-2xl p-0 border-4 border-yellow-300 mb-6 overflow-hidden">
          <GameCanvas ref={canvasRef} playerName={playerName} onScoreChange={setScore} onGameOver={handleGameOver} />
        </div>

        {/* Score Display */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-yellow-300 mb-6">
          <p className="text-3xl font-bold text-gray-800 text-center">Score: {score}</p>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-yellow-300 text-center max-w-md mx-4">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Game Over!</h2>
              <p className="text-3xl font-bold text-yellow-500 mb-8">Score: {score}</p>
              <div className="flex gap-4 flex-col sm:flex-row justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-yellow-400 text-gray-800 font-bold text-lg rounded-lg hover:bg-yellow-300 transition shadow-lg"
                >
                  Play Again
                </button>
                <button
                  onClick={onViewLeaderboard}
                  className="px-6 py-3 bg-purple-500 text-white font-bold text-lg rounded-lg hover:bg-purple-600 transition shadow-lg"
                >
                  Leaderboard
                </button>
              </div>
              <button
                onClick={onChangeName}
                className="mt-4 px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
              >
                Change Name
              </button>
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        {!gameOver && (
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onViewLeaderboard}
              className="px-6 py-3 bg-purple-500 text-white font-bold text-lg rounded-lg hover:bg-purple-600 transition shadow-lg"
            >
              Leaderboard
            </button>
            <button
              onClick={onChangeName}
              className="px-6 py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600 transition shadow-lg"
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
