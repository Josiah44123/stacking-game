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
    const BLOCK_HEIGHT = 30
    const INITIAL_WIDTH = 150
    const START_SPEED = 4
    const CHICK_SIZE = 24 
    
    // Physics
    const GRAVITY = 0.4
    const JUMP_STRENGTH = -7.5

    // Game State
    let stackedBlocks: Array<{ x: number, y: number, width: number, color: string }> = []
    let score = 0
    let gameOver = false 
    let showGameOverScreen = false 
    let gameStarted = false
    let animationId: number
    
    // Moving Block State
    let currentX = 0
    let currentWidth = INITIAL_WIDTH
    let speed = START_SPEED
    let direction = 1 
    let cameraOffset = 0

    // Chick State
    let chickX = 0 
    let chickY = 0
    let chickVelY = 0
    let chickState: 'standing' | 'jumping' | 'falling' = 'standing'
    let chickJumpFrame = 0
    let isScared = false 

    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA"]

    // --- Core Logic ---

    const resetGame = () => {
      stackedBlocks = []
      score = 0
      gameOver = false
      showGameOverScreen = false
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

      // Reset Chick
      chickState = 'standing'
      chickX = baseX + INITIAL_WIDTH / 2 
      chickY = baseY
      chickVelY = 0
      isScared = false
    }

    // Helper: Draw Spikes on the LEADING EDGE (Side)
    const drawSpikes = (x: number, y: number, width: number, height: number, dir: number) => {
        ctx.fillStyle = "#555"; 
        ctx.beginPath();
        
        const spikeSize = 6;
        const numSpikes = Math.floor(height / spikeSize);
        
        // If moving right (dir 1), draw spikes on right side
        // If moving left (dir -1), draw spikes on left side
        const startX = dir === 1 ? x + width : x;
        const pointX = dir === 1 ? startX + 8 : startX - 8;
        
        for(let i = 0; i < numSpikes; i++) {
            const topY = y + (i * spikeSize);
            ctx.moveTo(startX, topY);
            ctx.lineTo(pointX, topY + spikeSize/2);
            ctx.lineTo(startX, topY + spikeSize);
        }
        ctx.fill();
    }

    const drawChick = (x: number, y: number, state: string, jumpFrame: number) => {
        const drawY = y - (CHICK_SIZE * 0.8) 

        ctx.save()
        ctx.translate(x, drawY)

        // --- SCARED BUBBLE ---
        if (isScared && state === 'standing') {
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(15, -25, 8, 8, 0, 0, Math.PI*2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "red";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("!", 15, -21);
        }

        if (state === 'falling') {
             ctx.rotate(jumpFrame * 0.15 * (x > gameWidth/2 ? 1 : -1));
        }

        // 1. Body 
        ctx.beginPath()
        let scaleX = 1; let scaleY = 1;
        if (state === 'jumping') { scaleX = 0.9; scaleY = 1.1; }
        
        ctx.scale(scaleX, scaleY);
        ctx.arc(0, 0, CHICK_SIZE / 1.5, 0, Math.PI * 2)
        ctx.fillStyle = "#FFD700" 
        ctx.fill()
        ctx.strokeStyle = "#DAA520"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.scale(1/scaleX, 1/scaleY);

        // 2. Eyes
        ctx.fillStyle = "black"
        ctx.beginPath()
        let eyeOffsetY = -2;
        if (state === 'falling') {
             // X eyes
             ctx.strokeStyle = "black"; ctx.lineWidth = 2;
             ctx.moveTo(-7, -4); ctx.lineTo(-3, 0); ctx.moveTo(-3, -4); ctx.lineTo(-7, 0);
             ctx.moveTo(3, -4); ctx.lineTo(7, 0); ctx.moveTo(7, -4); ctx.lineTo(3, 0);
             ctx.stroke();
             eyeOffsetY = 100; 
        } else if (isScared) {
            eyeOffsetY = -4; 
        }

        if (eyeOffsetY !== 100) {
            ctx.arc(-5, eyeOffsetY, isScared ? 3 : 2, 0, Math.PI * 2) 
            ctx.arc(5, eyeOffsetY, isScared ? 3 : 2, 0, Math.PI * 2)  
            ctx.fill()
        }

        // 3. Beak
        ctx.fillStyle = "#FF8C00"
        ctx.beginPath()
        if (state === 'falling' || isScared) {
             ctx.ellipse(0, 5, 3, 5, 0, 0, Math.PI*2);
        } else {
             ctx.moveTo(-3, 2 + eyeOffsetY)
             ctx.lineTo(3, 2 + eyeOffsetY)
             ctx.lineTo(0, 6 + eyeOffsetY)
        }
        ctx.fill()

        // 4. Blush
        if (state !== 'falling' && !isScared) {
            ctx.fillStyle = "rgba(255, 100, 100, 0.4)"
            ctx.beginPath()
            ctx.arc(-7, 3 + eyeOffsetY, 2, 0, Math.PI * 2)
            ctx.arc(7, 3 + eyeOffsetY, 2, 0, Math.PI * 2)
            ctx.fill()
        }

        // 5. Wings
        if (state === 'jumping' || state === 'falling') {
            const wingFlap = Math.sin(jumpFrame * 0.6) * 6; 
            ctx.fillStyle = "#FFD700"
            ctx.strokeStyle = "#DAA520"
            ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.ellipse(-12, -wingFlap, 6, 3, Math.PI / 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(12, -wingFlap, 6, 3, -Math.PI / 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        ctx.restore()
    }

    const placeBlock = () => {
      if (gameOver) {
        if (showGameOverScreen) resetGame() 
        return
      }

      if (!gameStarted) {
        gameStarted = true
        return
      }

      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      
      const overlapStart = Math.max(currentX, topBlock.x)
      const overlapEnd = Math.min(currentX + currentWidth, topBlock.x + topBlock.width)
      const overlap = overlapEnd - overlapStart

      if (overlap <= 0) {
        // --- GAME OVER ---
        gameOver = true
        chickState = 'falling'
        chickVelY = -6 
        isScared = true 
      } else {
        // --- SUCCESS ---
        currentWidth = overlap
        currentX = overlapStart

        stackedBlocks.push({
          x: currentX,
          y: topBlock.y - BLOCK_HEIGHT,
          width: currentWidth,
          color: colors[(score + 1) % colors.length] 
        })

        score++
        callbacks.current.onScoreChange(score)
        speed += 0.2
        
        // Reset moving block
        direction = Math.random() > 0.5 ? 1 : -1
        currentX = direction === 1 ? -currentWidth : gameWidth

        if (stackedBlocks.length > 5) {
            cameraOffset += BLOCK_HEIGHT
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, gameWidth, gameHeight)

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
      gradient.addColorStop(0, "#87CEEB")
      gradient.addColorStop(1, "#E0F6FF")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, gameWidth, gameHeight)

      ctx.save()
      
      if (!gameOver) ctx.translate(0, cameraOffset)
      else ctx.translate(0, cameraOffset) 

      // 1. Draw Stack
      stackedBlocks.forEach((block) => {
        ctx.fillStyle = block.color
        ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT)
        ctx.strokeStyle = "rgba(0,0,0,0.1)"
        ctx.lineWidth = 1
        ctx.strokeRect(block.x, block.y, block.width, BLOCK_HEIGHT)
      })

      // 2. Logic: Moving Block & Chick AI
      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      const chickFloor = topBlock.y; 

      // --- SMOOTH CHICK MOVEMENT ---
      const targetChickX = topBlock.x + topBlock.width / 2;
      chickX += (targetChickX - chickX) * 0.15;

      if (gameStarted && !gameOver) {
        // Move Block
        currentX += speed * direction
        if (currentX + currentWidth > gameWidth) direction = -1
        else if (currentX < 0) direction = 1

        const movingBlockY = chickFloor - BLOCK_HEIGHT
        
        // Draw Moving Block
        ctx.fillStyle = colors[(score + 1) % colors.length]
        ctx.fillRect(currentX, movingBlockY, currentWidth, BLOCK_HEIGHT)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeRect(currentX, movingBlockY, currentWidth, BLOCK_HEIGHT)

        // DRAW SPIKES ON LEADING EDGE
        drawSpikes(currentX, movingBlockY, currentWidth, BLOCK_HEIGHT, direction);

        // --- CHICK DODGE AI (EDGE BASED) ---
        // Calculate where the "Danger" is
        let dangerX = 0;
        if (direction === 1) {
            // Moving Right: Danger is the Right Edge
            dangerX = currentX + currentWidth;
        } else {
            // Moving Left: Danger is the Left Edge
            dangerX = currentX;
        }

        // If chick is on the ground
        if (chickState === 'standing') {
            // Distance between Chick Center and the Danger Edge
            const distToSpikes = Math.abs(chickX - dangerX);

            // Detection for scared face
            // We only care if the block is actually overlapping/threatening the chick
            // (i.e., not when the block is far away on the other side of the screen)
            const isThreatening = (direction === 1 && currentX < chickX) || (direction === -1 && currentX + currentWidth > chickX);

            if (isThreatening && distToSpikes < 70) {
                isScared = true;
            } else {
                isScared = false;
            }

            // JUMP when spikes are close
            if (isThreatening && distToSpikes < 45) {
                chickState = 'jumping'
                chickVelY = JUMP_STRENGTH
                isScared = false; 
            }
        }
        
        // --- CHICK PHYSICS ---
        if (chickState === 'jumping') {
            chickY += chickVelY
            chickVelY += GRAVITY
            chickJumpFrame++

            // Landing logic
            if (chickVelY > 0 && chickY >= chickFloor) {
                chickY = chickFloor
                chickState = 'standing'
                chickVelY = 0
            }
        }

      } else if (gameOver) {
         // --- FALL ANIMATION LOOP ---
         chickY += chickVelY
         chickVelY += GRAVITY
         chickJumpFrame++
         
         const fallLimit = gameHeight + 100;
         if ((chickY + cameraOffset) > fallLimit && !showGameOverScreen) {
             showGameOverScreen = true;
             callbacks.current.onGameOver(score);
         }
      } 
      
      // Always Draw Chick (using smoothed X)
      if (!gameStarted) {
         drawChick(chickX, chickFloor, 'standing', 0) 
      } else {
         drawChick(chickX, chickY, chickState, chickJumpFrame)
      }

      ctx.restore()

      // UI
      if (!gameStarted) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        ctx.fillStyle = "white"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Click to Stack", gameWidth/2, gameHeight/2)
      } else if (showGameOverScreen) { 
        ctx.fillStyle = "rgba(0,0,0,0.3)" 
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        
        ctx.fillStyle = "white"
        ctx.font = "bold 30px Arial"
        ctx.textAlign = "center"
        ctx.shadowColor="black"
        ctx.shadowBlur=4
        ctx.fillText("Game Over", gameWidth/2, gameHeight/2 - 20)
        
        ctx.font = "20px Arial"
        ctx.fillText(`Score: ${score}`, gameWidth/2, gameHeight/2 + 20)
        
        ctx.font = "14px Arial"
        ctx.fillStyle = "#FFD700"
        ctx.fillText("Click to Retry", gameWidth/2, gameHeight/2 + 50)
        
        ctx.shadowBlur=0
      }

      animationId = requestAnimationFrame(draw)
    }

    resetGame()
    draw()

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