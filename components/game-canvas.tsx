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
  
  const callbacks = useRef({ onScoreChange, onGameOver })
  
  useEffect(() => {
    callbacks.current = { onScoreChange, onGameOver }
  }, [onScoreChange, onGameOver])

  useImperativeHandle(ref, () => canvasRef.current!)

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
    const CHICK_SIZE = 20 
    
    // Physics Constants
    const GRAVITY = 0.5
    const JUMP_STRENGTH = -8

    // Game State
    let stackedBlocks: Array<{ x: number, y: number, width: number, color: string }> = []
    let score = 0
    let gameOver = false 
    let isFalling = false 
    let gameStarted = false
    let animationId: number
    
    // Moving Block State
    let currentX = 0
    let currentWidth = INITIAL_WIDTH
    let speed = START_SPEED
    let direction = 1 
    let cameraOffset = 0

    // --- Chick Physics State ---
    let chickState: 'standing' | 'jumping' | 'falling' = 'standing'
    let chickPos = { x: 0, y: 0 }
    let chickVel = { x: 0, y: 0 }
    let chickJumpFrame = 0

    // Colors
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA"]

    // --- Core Logic ---

    const resetGame = () => {
      stackedBlocks = []
      score = 0
      gameOver = false
      isFalling = false
      gameStarted = false
      currentWidth = INITIAL_WIDTH
      currentX = (gameWidth - INITIAL_WIDTH) / 2
      speed = START_SPEED
      cameraOffset = 0
      callbacks.current.onScoreChange(0)
      
      // Add base block
      const baseX = (gameWidth - INITIAL_WIDTH) / 2
      const baseY = gameHeight - BLOCK_HEIGHT
      stackedBlocks.push({
        x: baseX,
        y: baseY,
        width: INITIAL_WIDTH,
        color: colors[0]
      })

      // Reset chick physics
      chickState = 'standing'
      // Center on base block
      chickPos = { x: baseX + INITIAL_WIDTH / 2, y: baseY }
      chickVel = { x: 0, y: 0 }
      chickJumpFrame = 0
    }

    // --- Helper: Draw the Simple Cute Chick ---
    const drawChick = (x: number, y: number, state: string, jumpFrame: number) => {
        const drawY = y - CHICK_SIZE/2 

        ctx.save()
        ctx.translate(x, drawY)

        if (state === 'falling') {
             // Rotate slightly if falling for effect
             ctx.rotate(Math.PI / 8 * (x > gameWidth/2 ? 1 : -1));
        }

        // 1. Body (Simple Yellow Circle)
        ctx.beginPath()
        ctx.arc(0, 0, CHICK_SIZE / 1.5, 0, Math.PI * 2)
        ctx.fillStyle = "#FFD700" // Gold
        ctx.fill()
        ctx.strokeStyle = "#DAA520"
        ctx.lineWidth = 2
        ctx.stroke()

        // 2. Eyes (Simple Black Dots)
        ctx.fillStyle = "black"
        ctx.beginPath()
        
        let eyeOffsetY = -2;
        // Look down if falling
        if (state === 'falling') eyeOffsetY = 2;

        ctx.arc(-5, eyeOffsetY, 2, 0, Math.PI * 2) // Left eye
        ctx.arc(5, eyeOffsetY, 2, 0, Math.PI * 2)  // Right eye
        ctx.fill()

        // 3. Beak (Orange Triangle)
        ctx.fillStyle = "#FF8C00"
        ctx.beginPath()
        ctx.moveTo(-3, 2 + eyeOffsetY)
        ctx.lineTo(3, 2 + eyeOffsetY)
        ctx.lineTo(0, 6 + eyeOffsetY)
        ctx.fill()

        // 4. Blush (Pink Circles)
        ctx.fillStyle = "rgba(255, 100, 100, 0.4)"
        ctx.beginPath()
        ctx.arc(-7, 3 + eyeOffsetY, 2, 0, Math.PI * 2)
        ctx.arc(7, 3 + eyeOffsetY, 2, 0, Math.PI * 2)
        ctx.fill()

        // 5. Wings (Only visible when jumping/falling)
        if (state === 'jumping' || state === 'falling') {
            const wingFlap = Math.sin(jumpFrame * 0.5) * 3;
            
            ctx.fillStyle = "#FFD700"
            ctx.strokeStyle = "#DAA520"
            ctx.lineWidth = 1.5

            // Left Wing
            ctx.beginPath()
            ctx.ellipse(-12, -wingFlap, 6, 3, Math.PI / 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Right Wing
            ctx.beginPath()
            ctx.ellipse(12, -wingFlap, 6, 3, -Math.PI / 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
        }

        ctx.restore()
    }

    const placeBlock = () => {
      if (gameOver) {
        resetGame()
        return
      }

      if (!gameStarted) {
        gameStarted = true
        return
      }

      // If already falling, ignore clicks
      if (isFalling || chickState === 'falling') return;

      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      
      const overlapStart = Math.max(currentX, topBlock.x)
      const overlapEnd = Math.min(currentX + currentWidth, topBlock.x + topBlock.width)
      const overlap = overlapEnd - overlapStart

      if (overlap <= 0) {
        // Missed completely. 
        isFalling = true;
        chickState = 'falling';
        // Chick falls
      } else {
        // Block placed successfully.
        currentWidth = overlap
        currentX = overlapStart

        // Add the new block
        stackedBlocks.push({
          x: currentX,
          y: topBlock.y - BLOCK_HEIGHT,
          width: currentWidth,
          color: colors[(score + 1) % colors.length] 
        })

        // === PHYSICS CHECK ===
        // Is the chick standing safely on the NEW block?
        const isChickSafe = chickPos.x >= currentX && chickPos.x <= currentX + currentWidth;

        if (isChickSafe) {
            // Safe! Jump to new block.
            score++
            callbacks.current.onScoreChange(score)
            speed += 0.2
            
            // Trigger Jump
            chickState = 'jumping'
            chickVel.y = JUMP_STRENGTH
            chickJumpFrame = 1

            if (stackedBlocks.length > 6) {
                cameraOffset += BLOCK_HEIGHT
            }
            currentX = -currentWidth // Reset moving block
        } else {
            // Chick is standing on the old block, but the new block was placed elsewhere (sliced off).
            // The chick loses its footing and falls.
            isFalling = true;
            chickState = 'falling';
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, gameWidth, gameHeight)

      // 1. Background
      const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
      gradient.addColorStop(0, "#87CEEB")
      gradient.addColorStop(1, "#E0F6FF")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, gameWidth, gameHeight)

      ctx.save()
      // Apply camera only if game isn't over (keeps UI stable)
      if (!gameOver) {
          ctx.translate(0, cameraOffset)
      }

      // 2. Draw Stacked Blocks
      stackedBlocks.forEach((block) => {
        ctx.fillStyle = block.color
        ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT)
        ctx.strokeStyle = "rgba(0,0,0,0.1)"
        ctx.lineWidth = 1
        ctx.strokeRect(block.x, block.y, block.width, BLOCK_HEIGHT)
      })

      // 3. Draw Moving Block
      if (gameStarted && !gameOver && !isFalling) {
        currentX += speed * direction
        if (currentX + currentWidth > gameWidth) direction = -1
        else if (currentX < 0) direction = 1

        const topY = stackedBlocks[stackedBlocks.length - 1].y - BLOCK_HEIGHT
        ctx.fillStyle = colors[(score + 1) % colors.length]
        ctx.fillRect(currentX, topY, currentWidth, BLOCK_HEIGHT)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeRect(currentX, topY, currentWidth, BLOCK_HEIGHT)
      }

      // --- 4. Update & Draw Chick Physics ---
      
      if (chickState === 'jumping') {
          chickPos.y += chickVel.y
          chickVel.y += GRAVITY // Apply gravity
          chickJumpFrame++

          // Check Landing condition
          const targetBlock = stackedBlocks[stackedBlocks.length - 1];
          // If moving down AND below the target surface
          if (chickVel.y > 0 && chickPos.y >= targetBlock.y) {
              chickPos.y = targetBlock.y
              chickState = 'standing'
              chickVel.y = 0
          }

      } else if (chickState === 'falling') {
          chickPos.y += chickVel.y
          chickVel.y += GRAVITY
          chickJumpFrame++ 

          // Game Over Trigger when off screen
          const screenY = chickPos.y + (gameOver ? 0 : cameraOffset);
          if (screenY > gameHeight + 50 && !gameOver) {
              gameOver = true
              callbacks.current.onGameOver(score)
          }
      } else if (chickState === 'standing') {
          // Lock to the top block
          const targetBlock = stackedBlocks[stackedBlocks.length - 1];
          chickPos.y = targetBlock.y;
      }

      // DRAW CHICK LAST (So it's always on top of the blocks)
      drawChick(chickPos.x, chickPos.y, chickState, chickJumpFrame)

      ctx.restore()

      // 5. UI Overlays
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
    draw()

    // Events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        placeBlock()
      }
    }

    canvas.addEventListener("mousedown", placeBlock)
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); placeBlock() })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      canvas.removeEventListener("mousedown", placeBlock)
      window.removeEventListener("keydown", handleKeyDown)
      cancelAnimationFrame(animationId)
    }
  }, [])

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