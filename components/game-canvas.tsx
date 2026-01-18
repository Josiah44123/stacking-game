"use client"

import { forwardRef, useEffect, useRef, useImperativeHandle } from "react"

interface GameCanvasProps {
  playerName: string
  onScoreChange: (score: number) => void
  onGameOver: (score: number) => void
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(({ onScoreChange, onGameOver }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ onScoreChange, onGameOver })
  const lastTimeRef = useRef<number>(0)

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

    // Constants
    const BLOCK_HEIGHT = 30
    const INITIAL_WIDTH = 150
   // Lower start speed (was 4)
    const START_SPEED = 3 
    const CHICK_SIZE = 24 
    const GRAVITY = 0.4
    const JUMP_STRENGTH = -7.5

    // Game State
    let stackedBlocks: Array<{ x: number, y: number, width: number, color: string }> = []
    let score = 0
    let gameOver = false 
    let showGameOverScreen = false 
    let gameStarted = false
    let animationId: number
    
    // Movement
    let currentX = 0
    let currentWidth = INITIAL_WIDTH
    let speed = START_SPEED
    let direction = 1 
    let cameraOffset = 0

    // Chick
    let chickX = 0 
    let chickY = 0
    let chickVelY = 0
    let chickState: 'standing' | 'jumping' | 'falling' = 'standing'
    let chickJumpFrame = 0
    let isScared = false 

    const colors = [
        "#F43F5E", // Rose
        "#F59E0B", // Amber
        "#10B981", // Emerald
        "#8B5CF6", // Violet
        "#EC4899", // Pink
        "#06B6D4", // Cyan
        "#FB923C", // Orange
    ]

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
      
      const baseX = (gameWidth - INITIAL_WIDTH) / 2
      const baseY = gameHeight - BLOCK_HEIGHT
      stackedBlocks.push({
        x: baseX,
        y: baseY,
        width: INITIAL_WIDTH,
        color: colors[0]
      })

      chickState = 'standing'
      chickX = baseX + INITIAL_WIDTH / 2 
      chickY = baseY
      chickVelY = 0
      isScared = false
    }

    // --- DRAWING HELPERS ---

    const drawBackground = () => {
        const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
        // Light Blue (Top) -> Dark Blue (Bottom)
        gradient.addColorStop(0, "#60A5FA") 
        gradient.addColorStop(1, "#1e3a8a") 
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, gameWidth, gameHeight)

        ctx.save()
        ctx.translate(0, cameraOffset * 0.5)

        // Sun
        ctx.fillStyle = "#FFD700"
        ctx.shadowColor = "#FFA500"
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(gameWidth - 40, 50, 25, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Ground Hills
        const groundY = gameHeight
        ctx.fillStyle = "#69D178"
        ctx.beginPath()
        ctx.moveTo(0, groundY)
        ctx.quadraticCurveTo(gameWidth / 4, groundY - 50, gameWidth / 2, groundY - 20)
        ctx.quadraticCurveTo(gameWidth * 0.75, groundY + 10, gameWidth, groundY - 30)
        ctx.lineTo(gameWidth, groundY + 100)
        ctx.lineTo(0, groundY + 100)
        ctx.fill()

        ctx.restore()
    }

    const drawTexturedBlock = (x: number, y: number, width: number, height: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(x, y, width, height * 0.15); 
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(x, y + height * 0.85, width, height * 0.15); 
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    const drawSpikes = (x: number, y: number, width: number, height: number, dir: number) => {
        ctx.fillStyle = "#E2E8F0"; 
        ctx.beginPath();
        const spikeSize = 6;
        const numSpikes = Math.floor(height / spikeSize);
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

        if (isScared && state === 'standing') {
            ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(15, -25, 8, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "red"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.fillText("!", 15, -21);
        }

        if (state === 'falling') ctx.rotate(jumpFrame * 0.15 * (x > gameWidth/2 ? 1 : -1));

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

        ctx.fillStyle = "black"
        ctx.beginPath()
        let eyeOffsetY = -2;
        if (state === 'falling') {
             ctx.strokeStyle = "black"; ctx.lineWidth = 2;
             ctx.moveTo(-7, -4); ctx.lineTo(-3, 0); ctx.moveTo(-3, -4); ctx.lineTo(-7, 0);
             ctx.moveTo(3, -4); ctx.lineTo(7, 0); ctx.moveTo(7, -4); ctx.lineTo(3, 0);
             ctx.stroke();
             eyeOffsetY = 100; 
        } else if (isScared) eyeOffsetY = -4; 

        if (eyeOffsetY !== 100) {
            ctx.arc(-5, eyeOffsetY, isScared ? 3 : 2, 0, Math.PI * 2) 
            ctx.arc(5, eyeOffsetY, isScared ? 3 : 2, 0, Math.PI * 2)  
            ctx.fill()
        }

        ctx.fillStyle = "#FF8C00"
        ctx.beginPath()
        if (state === 'falling' || isScared) ctx.ellipse(0, 5, 3, 5, 0, 0, Math.PI*2);
        else { ctx.moveTo(-3, 2 + eyeOffsetY); ctx.lineTo(3, 2 + eyeOffsetY); ctx.lineTo(0, 6 + eyeOffsetY); }
        ctx.fill()

        if (state !== 'falling' && !isScared) {
            ctx.fillStyle = "rgba(255, 100, 100, 0.4)"; ctx.beginPath();
            ctx.arc(-7, 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.arc(7, 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.fill();
        }

        if (state === 'jumping' || state === 'falling') {
            const wingFlap = Math.sin(jumpFrame * 0.6) * 6; 
            ctx.fillStyle = "#FFD700"; ctx.strokeStyle = "#DAA520"; ctx.lineWidth = 1.5;
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
        lastTimeRef.current = performance.now();
        return
      }

      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      const overlapStart = Math.max(currentX, topBlock.x)
      const overlapEnd = Math.min(currentX + currentWidth, topBlock.x + topBlock.width)
      const overlap = overlapEnd - overlapStart

      if (overlap <= 0) {
        gameOver = true
        chickState = 'falling'
        chickVelY = -6 
        isScared = true 
      } else {
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
        
        // CHANGED: Reduced speed increase from 0.2 to 0.08
        // This makes the game get harder much slower
        speed += 0.08
        
        direction = Math.random() > 0.5 ? 1 : -1
        currentX = direction === 1 ? -currentWidth : gameWidth

        if (stackedBlocks.length > 5) cameraOffset += BLOCK_HEIGHT
      }
    }

    const draw = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const targetFrameTime = 1000 / 60;
      const timeScale = deltaTime / targetFrameTime;

      ctx.clearRect(0, 0, gameWidth, gameHeight)

      drawBackground()

      ctx.save()
      ctx.translate(0, cameraOffset) 

      stackedBlocks.forEach((block) => {
        drawTexturedBlock(block.x, block.y, block.width, BLOCK_HEIGHT, block.color)
      })

      const topBlock = stackedBlocks[stackedBlocks.length - 1]
      const chickFloor = topBlock.y; 

      const targetChickX = topBlock.x + topBlock.width / 2;
      chickX += (targetChickX - chickX) * (0.15 * timeScale); 

      if (gameStarted && !gameOver) {
        currentX += (speed * direction) * timeScale;
        
        if (currentX + currentWidth > gameWidth) direction = -1
        else if (currentX < 0) direction = 1

        const movingBlockY = chickFloor - BLOCK_HEIGHT
        
        drawTexturedBlock(currentX, movingBlockY, currentWidth, BLOCK_HEIGHT, colors[(score + 1) % colors.length])
        
        drawSpikes(currentX, movingBlockY, currentWidth, BLOCK_HEIGHT, direction);

        let dangerX = 0;
        if (direction === 1) dangerX = currentX + currentWidth;
        else dangerX = currentX;

        if (chickState === 'standing') {
            const distToSpikes = Math.abs(chickX - dangerX);
            const isThreatening = (direction === 1 && currentX < chickX) || (direction === -1 && currentX + currentWidth > chickX);

            if (isThreatening && distToSpikes < 70) isScared = true;
            else isScared = false;

            if (isThreatening && distToSpikes < 45) {
                chickState = 'jumping'
                chickVelY = JUMP_STRENGTH
                isScared = false; 
            }
        }
        
        if (chickState === 'jumping') {
            chickY += chickVelY * timeScale
            chickVelY += GRAVITY * timeScale
            chickJumpFrame += 1 * timeScale

            if (chickVelY > 0 && chickY >= chickFloor) {
                chickY = chickFloor
                chickState = 'standing'
                chickVelY = 0
            }
        }

      } else if (gameOver) {
         chickY += chickVelY * timeScale
         chickVelY += GRAVITY * timeScale
         chickJumpFrame += 1 * timeScale
         
         const fallLimit = gameHeight + 100;
         if ((chickY + cameraOffset) > fallLimit && !showGameOverScreen) {
             showGameOverScreen = true;
             callbacks.current.onGameOver(score);
         }
      } 
      
      if (!gameStarted) drawChick(chickX, chickFloor, 'standing', 0) 
      else drawChick(chickX, chickY, chickState, chickJumpFrame)

      ctx.restore()

      if (!gameStarted) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        ctx.fillStyle = "white"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
        ctx.fillText("Click to Stack", gameWidth/2, gameHeight/2)
      } else if (showGameOverScreen) { 
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, gameWidth, gameHeight)
        ctx.fillStyle = "white"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
        ctx.shadowColor="black"; ctx.shadowBlur=4;
        ctx.fillText("Game Over", gameWidth/2, gameHeight/2 - 20)
        ctx.shadowBlur=0
      }

      animationId = requestAnimationFrame(draw)
    }

    resetGame()
    animationId = requestAnimationFrame(draw)

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