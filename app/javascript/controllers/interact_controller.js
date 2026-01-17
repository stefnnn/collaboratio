import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static targets = ["svg", "dot", "xAxis", "yAxis", "ticks"]

  connect() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.isDragging = false
    this.springStrength = 0.12
    this.damping = 0.75

    this.setupDimensions()
    this.setupWebSocket()
    this.setupEventListeners()
    this.startPositionUpdates()
    this.updateDotPosition()

    window.addEventListener("resize", () => this.setupDimensions())
  }

  disconnect() {
    this.subscription?.unsubscribe()
    this.cable?.disconnect()
    clearInterval(this.updateInterval)
    cancelAnimationFrame(this.springAnimationId)
  }

  setupDimensions() {
    const rect = this.svgTarget.getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height
    this.centerX = this.width / 2
    this.centerY = this.height / 2
    this.halfWidth = this.width / 2
    this.halfHeight = this.height / 2

    this.xAxisTarget.setAttribute("x1", 0)
    this.xAxisTarget.setAttribute("x2", this.width)
    this.xAxisTarget.setAttribute("y1", this.centerY)
    this.xAxisTarget.setAttribute("y2", this.centerY)

    this.yAxisTarget.setAttribute("x1", this.centerX)
    this.yAxisTarget.setAttribute("x2", this.centerX)
    this.yAxisTarget.setAttribute("y1", 0)
    this.yAxisTarget.setAttribute("y2", this.height)

    this.drawTicks()
    this.updateDotPosition()
  }

  drawTicks() {
    const tickLength = 10
    const tickSpacing = this.width * 0.05
    let ticksHtml = ""

    const xTickCount = Math.floor(this.halfWidth / tickSpacing)
    for (let i = -xTickCount; i <= xTickCount; i++) {
      if (i === 0) continue
      const xPos = this.centerX + i * tickSpacing
      ticksHtml += `<line x1="${xPos}" y1="${this.centerY - tickLength / 2}" x2="${xPos}" y2="${this.centerY + tickLength / 2}" class="stroke-zinc-600" stroke-width="1" />`
    }

    const yTickCount = Math.floor(this.halfHeight / tickSpacing)
    for (let i = -yTickCount; i <= yTickCount; i++) {
      if (i === 0) continue
      const yPos = this.centerY + i * tickSpacing
      ticksHtml += `<line x1="${this.centerX - tickLength / 2}" y1="${yPos}" x2="${this.centerX + tickLength / 2}" y2="${yPos}" class="stroke-zinc-600" stroke-width="1" />`
    }

    this.ticksTarget.innerHTML = ticksHtml
  }

  setupWebSocket() {
    this.cable = createConsumer()
    this.subscription = this.cable.subscriptions.create(
      { channel: "InteractChannel" },
      {
        received: () => {}
      }
    )
  }

  setupEventListeners() {
    this.svgTarget.addEventListener("mousedown", (e) => this.startDrag(e))
    this.svgTarget.addEventListener("mousemove", (e) => this.drag(e))
    this.svgTarget.addEventListener("mouseup", () => this.endDrag())
    this.svgTarget.addEventListener("mouseleave", () => this.endDrag())

    this.svgTarget.addEventListener("touchstart", (e) => this.startDrag(e), { passive: false })
    this.svgTarget.addEventListener("touchmove", (e) => this.drag(e), { passive: false })
    this.svgTarget.addEventListener("touchend", () => this.endDrag())
    this.svgTarget.addEventListener("touchcancel", () => this.endDrag())
  }

  startDrag(e) {
    e.preventDefault()
    this.isDragging = true
    cancelAnimationFrame(this.springAnimationId)
    this.dotTarget.classList.remove("cursor-grab")
    this.dotTarget.classList.add("cursor-grabbing")
    this.drag(e)
  }

  drag(e) {
    if (!this.isDragging) return
    e.preventDefault()

    const point = e.touches ? e.touches[0] : e
    const rect = this.svgTarget.getBoundingClientRect()
    const clientX = point.clientX - rect.left
    const clientY = point.clientY - rect.top

    this.x = Math.max(-1, Math.min(1, (clientX - this.centerX) / this.halfWidth))
    this.y = Math.max(-1, Math.min(1, (clientY - this.centerY) / this.halfHeight))

    this.updateDotPosition()
  }

  endDrag() {
    if (!this.isDragging) return
    this.isDragging = false
    this.dotTarget.classList.remove("cursor-grabbing")
    this.dotTarget.classList.add("cursor-grab")
    this.startSpringAnimation()
  }

  startSpringAnimation() {
    const animate = () => {
      this.vx = (this.vx + -this.x * this.springStrength) * this.damping
      this.vy = (this.vy + -this.y * this.springStrength) * this.damping
      this.x += this.vx
      this.y += this.vy

      this.updateDotPosition()

      if (Math.abs(this.x) < 0.001 && Math.abs(this.y) < 0.001 && Math.abs(this.vx) < 0.001 && Math.abs(this.vy) < 0.001) {
        this.x = 0
        this.y = 0
        this.updateDotPosition()
        return
      }

      this.springAnimationId = requestAnimationFrame(animate)
    }

    this.springAnimationId = requestAnimationFrame(animate)
  }

  updateDotPosition() {
    const px = this.centerX + this.x * this.halfWidth
    const py = this.centerY + this.y * this.halfHeight
    this.dotTarget.setAttribute("cx", px)
    this.dotTarget.setAttribute("cy", py)
  }

  startPositionUpdates() {
    this.updateInterval = setInterval(() => {
      this.subscription?.perform("update_position", { x: this.x, y: this.y })
    }, 200)
  }
}
