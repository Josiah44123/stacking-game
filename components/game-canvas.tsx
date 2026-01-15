"use client"

import type React from "react"
import { forwardRef, useEffect, useRef, useImperativeHandle } from "react"

interface GameCanvasProps {
  playerName: string
  onScoreChange: (score: number) => void
  onGameOver: (score: number) => void
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(({ onScoreChange, onGameOver }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 1. Store callbacks in refs to prevent re-triggering the useEffect
  const callbacks = useRef({ onScoreChange, onGameOver })
  
  // Update refs whenever props change
  useEffect(() => {
    callbacks.current = { onScoreChange, onGameOver }
  }, [onScoreChange, onGameOver])

  useImperativeHandle(ref, () => canvasRef.current!)

  // 2. Empty dependency array so this ONLY runs on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Setup Canvas
    const gameWidth = 300
    const gameHeight = 600
    canvas.width = gameWidth
    canvas.height = gameHeight

    // Game Constants
    const BLOCK_HEIGHT = 25
    const INITIAL_WIDTH = 150
    const START_SPEED = 4

    // Game State
    let stackedBlocks: Array<{ x: number, y: number, width: number, color: string }> = []
    let score = 0
    let gameOver = false
    let gameStarted = false
    let animationId: number
    
    // Moving Block State
    let currentX = 0
    let currentWidth = INITIAL_WIDTH
    let speed = START_SPEED
    let direction = 1 // 1 for right, -1 for left
    let cameraOffset = 0

    // Colors
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA"]

    // --- Core Logic ---

    const resetGame = () => {
      stackedBlocks = []
      score = 0
      gameOver = false
      gameStarted = false
      currentWidth = INITIAL_WIDTH
      currentX = (gameWidth - INITIAL_WIDTH) / 2
      speed = START_SPEED
      cameraOffset = 0
      callbacks.current.onScoreChange(0)
      
      // Add base block
      stackedBlocks.push({
        x: (gameWidth - INITIAL_WIDTH) / 2,
        y: gameHeight - BLOCK_HEIGHT,
        width: INITIAL_WIDTH,
        color: colors[0]
      })
    }

    const placeBlock = () => {
      if (gameOver) {
        resetGame()
        gameStarted = true // Immediately start next game on click
        return
      }

      if (!gameStarted) {
        gameStarted = true
        return
      }

      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      
      // Calculate overlap
      const prevX = topBlock.x
      const prevWidth = topBlock.width
      
      const overlapStart = Math.max(currentX, prevX)
      const overlapEnd = Math.min(currentX + currentWidth, prevX + prevWidth)
      const overlap = overlapEnd - overlapStart

      if (overlap <= 0) {
        // Missed completely
        gameOver = true
        callbacks.current.onGameOver(score)
      } else {
        // Successful hit
        // Cut the block size
        currentWidth = overlap
        currentX = overlapStart

        // Add to stack
        stackedBlocks.push({
          x: currentX,
          y: topBlock.y - BLOCK_HEIGHT,
          width: currentWidth,
          color: colors[(score + 1) % colors.length] // +1 to offset from base
        })

        score++
        callbacks.current.onScoreChange(score)
        speed += 0.2 // Increase speed slightly
        
        // Move Camera down if stack gets too high
        if (stackedBlocks.length > 8) {
          cameraOffset += BLOCK_HEIGHT
        }

        // Reset position for next block (spawn on random side or fixed side)
        currentX = -currentWidth 
      }
    }

    const draw = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, gameWidth, gameHeight)

      // 1. Draw Background
      const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
      gradient.addColorStop(0, "#87CEEB")
      gradient.addColorStop(1, "#E0F6FF")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, gameWidth, gameHeight)

      // Apply Camera Offset
      ctx.save()
      ctx.translate(0, cameraOffset)

      // 2. Draw Stacked Blocks
      stackedBlocks.forEach((block) => {
        ctx.fillStyle = block.color
        ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT)
        ctx.strokeStyle = "rgba(0,0,0,0.2)"
        ctx.lineWidth = 1
        ctx.strokeRect(block.x, block.y, block.width, BLOCK_HEIGHT)
      })

      // 3. Draw Moving Block (if game is active)
      if (gameStarted && !gameOver) {
        // Update Position
        currentX += speed * direction

        // Bounce off walls
        if (currentX + currentWidth > gameWidth) {
          direction = -1
        } else if (currentX < 0) {
          direction = 1
        }

        // Calculate Y position (always one block above top)
        const topY = stackedBlocks[stackedBlocks.length - 1].y - BLOCK_HEIGHT

        ctx.fillStyle = colors[(score + 1) % colors.length]
        ctx.fillRect(currentX, topY, currentWidth, BLOCK_HEIGHT)
        
        // Highlight active block
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeRect(currentX, topY, currentWidth, BLOCK_HEIGHT)
      }

      ctx.restore() // Remove camera offset for UI elements

      // 4. UI Overlays
      if (!gameStarted) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        ctx.fillStyle = "white"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Click to Start", gameWidth/2, gameHeight/2)
      } else if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        ctx.fillStyle = "white"
        ctx.font = "bold 30px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Game Over", gameWidth/2, gameHeight/2 - 20)
        ctx.font = "20px Arial"
        ctx.fillText(`Score: ${score}`, gameWidth/2, gameHeight/2 + 20)
        ctx.font = "14px Arial"
        ctx.fillStyle = "#FFD700"
        ctx.fillText("Click to Try Again", gameWidth/2, gameHeight/2 + 50)
      }

      animationId = requestAnimationFrame(draw)
    }

    // Initialize Game
    resetGame()
    // Start Loop
    draw()

    // Events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        placeBlock()
      }
    }

    canvas.addEventListener("mousedown", placeBlock)
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); placeBlock() }) // Mobile support
    window.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      canvas.removeEventListener("mousedown", placeBlock)
      window.removeEventListener("keydown", handleKeyDown)
      cancelAnimationFrame(animationId)
    }
  }, []) // <--- EMPTY ARRAY IS CRITICAL

  return (
    <canvas
      ref={canvasRef}
      className="bg-sky-200 cursor-pointer border-4 border-white/50 rounded-lg shadow-xl block mx-auto"
      style={{ touchAction: "none", maxWidth: "100%", height: "auto" }}
    />
  )
})

GameCanvas.displayName = "GameCanvas"
export default GameCanvas
