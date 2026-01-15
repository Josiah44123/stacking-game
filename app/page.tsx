"use client"

import { useState, useEffect } from "react"
import StackingGame from "@/components/stacking-game"
import PlayerEntry from "@/components/player-entry"
import Leaderboard from "@/components/leaderboard"

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem("playerName")
    if (savedName) {
      setPlayerName(savedName)
    }
  }, [])

  const handleNameSubmit = (name: string) => {
    localStorage.setItem("playerName", name)
    setPlayerName(name)
    setGameStarted(true)
  }

  const handleBackToMenu = () => {
    setGameStarted(false)
    setShowLeaderboard(false)
  }

  if (!playerName) {
    return <PlayerEntry onNameSubmit={handleNameSubmit} />
  }

  if (showLeaderboard) {
    return (
      <Leaderboard
        playerName={playerName}
        onBack={handleBackToMenu}
        onChangeName={() => {
          localStorage.removeItem("playerName")
          setPlayerName(null)
        }}
      />
    )
  }

  if (gameStarted) {
    return (
      <StackingGame
        playerName={playerName}
        onViewLeaderboard={() => setShowLeaderboard(true)}
        onChangeName={() => {
          localStorage.removeItem("playerName")
          setPlayerName(null)
        }}
      />
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 via-sky-200 to-cyan-200">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">Chick Stack</h1>
        <button
          onClick={() => setGameStarted(true)}
          className="px-8 py-4 bg-yellow-400 text-gray-800 font-bold text-xl rounded-full hover:bg-yellow-300 transition shadow-lg"
        >
          Start Playing
        </button>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-8 py-4 ml-4 bg-purple-500 text-white font-bold text-xl rounded-full hover:bg-purple-600 transition shadow-lg"
        >
          View Leaderboard
        </button>
      </div>
    </div>
  )
}
