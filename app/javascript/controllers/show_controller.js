import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static targets = ["canvas"]

  connect() {
    this.params = []
    this.startTime = performance.now()
    this.currentDemo = 0
    this.demoCount = 3
    this.cycleDuration = 20
    this.fadeDuration = 1.5
    this.setupCanvas()
    this.setupWebSocket()
    this.animate()
  }

  disconnect() {
    this.subscription?.unsubscribe()
    this.cable?.disconnect()
    cancelAnimationFrame(this.animationId)
  }

  setupCanvas() {
    this.canvas = this.canvasTarget
    this.ctx = this.canvas.getContext("2d")
    this.resizeCanvas()
    window.addEventListener("resize", () => this.resizeCanvas())
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.w = this.canvas.width
    this.h = this.canvas.height
  }

  setupWebSocket() {
    this.cable = createConsumer()
    this.subscription = this.cable.subscriptions.create(
      { channel: "ShowChannel" },
      {
        received: (data) => {
          if (data.type === "params") {
            this.params = data.params
          }
        }
      }
    )
  }

  animate() {
    const t = (performance.now() - this.startTime) / 1000
    this.render(t, this.params)
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  render(t, params) {
    const ctx = this.ctx
    const w = this.w
    const h = this.h

    const cycleTime = t % this.cycleDuration
    const demoIndex = Math.floor(t / this.cycleDuration) % this.demoCount
    const nextDemoIndex = (demoIndex + 1) % this.demoCount

    const fadeStart = this.cycleDuration - this.fadeDuration
    let fadeProgress = 0
    if (cycleTime > fadeStart) {
      fadeProgress = (cycleTime - fadeStart) / this.fadeDuration
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
    ctx.fillRect(0, 0, w, h)

    if (fadeProgress > 0) {
      ctx.globalAlpha = 1 - fadeProgress
      this.renderDemo(demoIndex, t, params, ctx, w, h)
      ctx.globalAlpha = fadeProgress
      this.renderDemo(nextDemoIndex, t, params, ctx, w, h)
      ctx.globalAlpha = 1
    } else {
      this.renderDemo(demoIndex, t, params, ctx, w, h)
    }
  }

  renderDemo(demoIndex, t, params, ctx, w, h) {
    switch (demoIndex) {
      case 0:
        this.renderOrbits(t, params, ctx, w, h)
        break
      case 1:
        this.renderWaves(t, params, ctx, w, h)
        break
      case 2:
        this.renderConstellation(t, params, ctx, w, h)
        break
    }
  }

  renderOrbits(t, params, ctx, w, h) {
    const numUsers = params.length || 1
    const circlesPerUser = Math.max(15, Math.floor(120 / numUsers))

    if (params.length === 0) {
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2 + t
        const radius = 150 + Math.sin(t * 2 + i * 0.1) * 80
        const px = w / 2 + Math.cos(angle) * radius
        const py = h / 2 + Math.sin(angle) * radius
        const hue = (i * 3.6 + t * 30) % 360
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    params.forEach((p, userIndex) => {
      const [x, y] = p
      const userOffset = (userIndex / numUsers) * Math.PI * 2

      for (let i = 0; i < circlesPerUser; i++) {
        const angle = (i / circlesPerUser) * Math.PI * 2 + t * 0.8 + x * Math.PI + userOffset
        const baseRadius = Math.min(w, h) * 0.25
        const radius = baseRadius + Math.sin(t * 2 + i * 0.15) * baseRadius * 0.5 + y * baseRadius * 0.8
        const px = w / 2 + Math.cos(angle) * radius
        const py = h / 2 + Math.sin(angle) * radius
        const hue = (userIndex * 50 + i * 3 + t * 30 + x * 180) % 360
        const size = 4 + Math.abs(y) * 8

        ctx.fillStyle = `hsl(${hue}, 75%, 55%)`
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  renderWaves(t, params, ctx, w, h) {
    const lineCount = 25
    const pointsPerLine = 80

    if (params.length === 0) {
      for (let l = 0; l < lineCount; l++) {
        const baseY = (l / (lineCount - 1)) * h
        const hue = (l * 15 + t * 40) % 360
        ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i <= pointsPerLine; i++) {
          const x = (i / pointsPerLine) * w
          const wave = Math.sin(i * 0.1 + t * 2 + l * 0.3) * 30
          const y = baseY + wave
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      return
    }

    for (let l = 0; l < lineCount; l++) {
      const baseY = (l / (lineCount - 1)) * h
      const hue = (l * 15 + t * 40) % 360
      ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i <= pointsPerLine; i++) {
        const xPos = (i / pointsPerLine) * w
        let wave = Math.sin(i * 0.08 + t * 2 + l * 0.2) * 20

        params.forEach((p, idx) => {
          const [px, py] = p
          const influence = Math.exp(-Math.pow((i / pointsPerLine - 0.5 - px * 0.4), 2) * 10)
          wave += influence * py * 80 * Math.sin(t * 3 + idx + l * 0.1)
        })

        const yPos = baseY + wave
        if (i === 0) ctx.moveTo(xPos, yPos)
        else ctx.lineTo(xPos, yPos)
      }
      ctx.stroke()
    }
  }

  renderConstellation(t, params, ctx, w, h) {
    const starCount = 60
    const connectionDist = 120

    const stars = []
    for (let i = 0; i < starCount; i++) {
      const seed1 = Math.sin(i * 127.1) * 43758.5453
      const seed2 = Math.sin(i * 269.5) * 43758.5453
      const baseX = (seed1 - Math.floor(seed1)) * w
      const baseY = (seed2 - Math.floor(seed2)) * h

      let offsetX = Math.sin(t + i * 0.5) * 30
      let offsetY = Math.cos(t * 0.8 + i * 0.3) * 30

      params.forEach((p, idx) => {
        const [px, py] = p
        offsetX += px * 50 * Math.sin(t * 2 + i * 0.2 + idx)
        offsetY += py * 50 * Math.cos(t * 1.5 + i * 0.15 + idx)
      })

      stars.push({ x: baseX + offsetX, y: baseY + offsetY, i })
    }

    ctx.strokeStyle = "rgba(100, 180, 255, 0.3)"
    ctx.lineWidth = 1
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x
        const dy = stars[i].y - stars[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < connectionDist) {
          const alpha = (1 - dist / connectionDist) * 0.4
          ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`
          ctx.beginPath()
          ctx.moveTo(stars[i].x, stars[i].y)
          ctx.lineTo(stars[j].x, stars[j].y)
          ctx.stroke()
        }
      }
    }

    stars.forEach((star, idx) => {
      const pulse = 1 + Math.sin(t * 3 + idx) * 0.3
      const size = 3 * pulse

      let avgX = 0, avgY = 0
      if (params.length > 0) {
        params.forEach(p => { avgX += p[0]; avgY += p[1] })
        avgX /= params.length
        avgY /= params.length
      }

      const hue = (200 + avgX * 60 + idx * 2 + t * 20) % 360
      ctx.fillStyle = `hsl(${hue}, 60%, 70%)`
      ctx.beginPath()
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}
