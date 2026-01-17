"use client"

import { useState } from "react"
import StackingGame from "@/components/stacking-game"
import PlayerEntry from "@/components/player-entry"
import Leaderboard from "@/components/leaderboard"

export default function Home() {
  // We initialize as null so we ALWAYS show the entry screen first
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // REMOVED: The useEffect that checked localStorage and skipped the screen.
  // Now the user always sees the 'PlayerEntry' screen first.

  const handleNameSubmit = (name: string) => {
    localStorage.setItem("playerName", name)
    setPlayerName(name)
    setGameStarted(true)
  }

  const handleBackToMenu = () => {
    setGameStarted(false)
    setShowLeaderboard(false)
   
  }

  // 1. If we are viewing the leaderboard
  if (showLeaderboard && playerName) {
    return (
      <Leaderboard
        playerName={playerName}
        onBack={handleBackToMenu}
        onChangeName={() => {
          localStorage.removeItem("playerName")
          setPlayerName(null)
          setShowLeaderboard(false)
        }}
      />
    )
  }

  // 2. If the game has started
  if (gameStarted && playerName) {
    return (
      <StackingGame
        playerName={playerName}
        onViewLeaderboard={() => setShowLeaderboard(true)}
        onChangeName={() => {
          localStorage.removeItem("playerName")
          setPlayerName(null)
          setGameStarted(false)
        }}
      />
    )
  }

  // 3. Otherwise, show the cool Entry Screen 
  return <PlayerEntry onNameSubmit={handleNameSubmit} />
}