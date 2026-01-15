"use client"

import { useState, useEffect } from "react"

interface Score {
  name: string
  score: number
  date: string
}

interface LeaderboardProps {
  playerName: string
  onBack: () => void
  onChangeName: () => void
}

export default function Leaderboard({ playerName, onBack, onChangeName }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([])

  useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem("scores") || "[]")
    const sorted = savedScores.sort((a: Score, b: Score) => b.score - a.score).slice(0, 20)
    setScores(sorted)
  }, [])

  const playerBest = scores.find((s) => s.name === playerName)
  const playerRank = scores.findIndex((s) => s.name === playerName) + 1

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 via-sky-200 to-cyan-200">
      <CloudBackground />

      <div className="relative z-10 w-full max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-8 drop-shadow-lg">Leaderboard</h1>

        <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-purple-300 mb-8">
          <div className="text-center mb-6">
            <p className="text-xl text-gray-700 font-semibold">Your Stats</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{playerName}</p>
            {playerBest ? (
              <>
                <p className="text-lg text-gray-600 mt-2">Best Score: {playerBest.score}</p>
                <p className="text-lg text-gray-600">Rank: #{playerRank}</p>
              </>
            ) : (
              <p className="text-lg text-gray-600 mt-2">No scores yet. Play to get on the board!</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-yellow-300 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Scores</h2>
          {scores.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No scores yet. Be the first to play!</p>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    score.name === playerName ? "bg-purple-100 border-2 border-purple-400" : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-gray-700 w-8">#{index + 1}</span>
                    <span className="text-lg font-semibold text-gray-800">{score.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-500">{score.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-yellow-400 text-gray-800 font-bold text-lg rounded-lg hover:bg-yellow-300 transition"
          >
            Back to Game
          </button>
          <button
            onClick={onChangeName}
            className="px-8 py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600 transition"
          >
            Change Name
          </button>
        </div>
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
