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

  // Stable references for stars so they don't jitter
  const starsRef = useRef<{x: number, y: number, size: number, alpha: number}[]>([])

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

    // Initialize Stars once
    if (starsRef.current.length === 0) {
        for(let i=0; i<50; i++) {
            starsRef.current.push({
                x: Math.random() * gameWidth,
                y: Math.random() * gameHeight,
                size: Math.random() * 2,
                alpha: Math.random()
            })
        }
    }

    // Constants
    const BLOCK_HEIGHT = 30
    const INITIAL_WIDTH = 150
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

    // --- THEME: COOL GALAXY ---
    // Starts with calming Cyans/Blues, moving into Purples/Pinks
    const colors = [
        "#22D3EE", // Cyan (Start)
        "#4ADE80", // Light Green
        "#60A5FA", // Sky Blue
        "#3B82F6", // Royal Blue
        "#6366F1", // Indigo
        "#8B5CF6", // Violet
        "#A855F7", // Purple
        "#D946EF", // Fuchsia
        "#EC4899", // Pink
        "#F43F5E", // Rose (Only appears later)
    ];

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
        // Midnight Gradient: Deep Space (Top) -> Dark Horizon (Bottom)
        gradient.addColorStop(0, "#0F172A") // Slate 900
        gradient.addColorStop(1, "#312E81") // Indigo 900
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, gameWidth, gameHeight)

        ctx.save()
        ctx.translate(0, cameraOffset * 0.2) // Slower parallax for background elements

        // Draw Stars
        ctx.fillStyle = "white";
        starsRef.current.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Moon (Glowing White/Pale Blue)
        const moonX = gameWidth - 50;
        const moonY = 80;
        
        // Moon Glow
        const glowGradient = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 45);
        glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.beginPath(); ctx.arc(moonX, moonY, 45, 0, Math.PI * 2); ctx.fill();

        // Moon Body
        ctx.fillStyle = "#F8FAFC"; // Off-white
        ctx.shadowColor = "#E2E8F0";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Moon Craters (Subtle)
        ctx.fillStyle = "#CBD5E1";
        ctx.beginPath(); ctx.arc(moonX - 5, moonY + 5, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(moonX + 8, moonY - 2, 2, 0, Math.PI*2); ctx.fill();

        // Ground Hills (Darker Silhouette)
        const groundY = gameHeight
        ctx.fillStyle = "#020617" // Very Dark Blue/Black
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
        // 1. Base Gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustColorBrightness(color, -15)); 
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // 2. Glassy Top Highlight
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(x, y, width, height * 0.2); 

        // 3. Subtle Shadow Bottom
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(x, y + height * 0.85, width, height * 0.15); 

        // 4. Clean Border
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // 5. Specular Highlight (The "shiny" dot)
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(x + 10, y + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    const adjustColorBrightness = (hex: string, percent: number) => {
        const num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }

    const drawSpikes = (x: number, y: number, width: number, height: number, dir: number) => {
        // Spikes: Cool metallic silver
        ctx.fillStyle = "#94A3B8"; 
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

        // Scared Bubble
        if (isScared && state === 'standing') {
            ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(15, -25, 8, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "red"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.fillText("!", 15, -21);
        }

        if (state === 'falling') ctx.rotate(jumpFrame * 0.15 * (x > gameWidth/2 ? 1 : -1));

        // Chick Body (Golden Yellow - stands out on dark bg)
        ctx.beginPath()
        let scaleX = 1; let scaleY = 1;
        if (state === 'jumping') { scaleX = 0.9; scaleY = 1.1; }
        
        ctx.scale(scaleX, scaleY);
        ctx.arc(0, 0, CHICK_SIZE / 1.5, 0, Math.PI * 2)
        ctx.fillStyle = "#FFC107" // Amber 400
        ctx.fill()
        
        // Subtle inner glow
        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, CHICK_SIZE/1.5);
        grad.addColorStop(0, "#FFD54F");
        grad.addColorStop(1, "#FFC107");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = "#B45309"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.scale(1/scaleX, 1/scaleY);

        // Eyes
        ctx.fillStyle = "#1E293B" // Dark Blue/Black eyes
        ctx.beginPath()
        let eyeOffsetY = -2;
        if (state === 'falling') {
             ctx.strokeStyle = "#1E293B"; ctx.lineWidth = 2;
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

        // Beak
        ctx.fillStyle = "#F97316" // Orange 500
        ctx.beginPath()
        if (state === 'falling' || isScared) ctx.ellipse(0, 5, 3, 5, 0, 0, Math.PI*2);
        else { ctx.moveTo(-3, 2 + eyeOffsetY); ctx.lineTo(3, 2 + eyeOffsetY); ctx.lineTo(0, 6 + eyeOffsetY); }
        ctx.fill()

        // Blush
        if (state !== 'falling' && !isScared) {
            ctx.fillStyle = "rgba(244, 63, 94, 0.4)"; ctx.beginPath();
            ctx.arc(-7, 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.arc(7, 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.fill();
        }

        // Wings
        if (state === 'jumping' || state === 'falling') {
            const wingFlap = Math.sin(jumpFrame * 0.6) * 6; 
            ctx.fillStyle = "#FFC107"; ctx.strokeStyle = "#B45309"; ctx.lineWidth = 1.5;
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

      // UI Overlays
      if (!gameStarted) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(0, 0, gameWidth, gameHeight)
        
        ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=10;
        ctx.fillStyle = "#F8FAFC"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
        ctx.fillText("Click to Stack", gameWidth/2, gameHeight/2)
        ctx.shadowBlur=0
      } else if (showGameOverScreen) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, gameWidth, gameHeight)
        
        ctx.fillStyle = "white"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
        ctx.shadowColor="#4ADE80"; ctx.shadowBlur=20;
        ctx.fillText("Game Over", gameWidth/2, gameHeight/2 - 20)
        
        ctx.shadowBlur=0;
        ctx.font = "18px Arial"; 
        ctx.fillText(`Final Score: ${score}`, gameWidth/2, gameHeight/2 + 20)
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
      className="cursor-pointer border-4 border-slate-700/50 rounded-lg shadow-2xl block mx-auto"
      style={{ touchAction: "none", maxWidth: "100%", height: "auto" }}
    />
  )
})

GameCanvas.displayName = "GameCanvas"
export default GameCanvas