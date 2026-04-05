import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import "express-async-errors"
import { createServer } from "http"
import { WebSocketServer } from "ws"
import jwt from "jsonwebtoken"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import connectDB from "./config/db.js"
import authRoutes from "./routes/auth.js"
import patientRoutes from "./routes/patients.js"
import memoryRoutes from "./routes/memories.js"
import sessionRoutes from "./routes/sessions.js"
import musicRoutes from "./routes/music.js"
import analyticsRoutes from "./routes/analytics.js"
import ghostVoiceRoutes from "./routes/ghostvoice.js"
import lastLetterRoutes from "./routes/lastletter.js"
import lifeStoryRoutes from "./routes/lifestory.js"
import assessmentRoutes from "./routes/assessment.js"
import doctorRoutes from "./routes/doctor.js"
import gameRoutes from "./routes/games.js"
import contextRoutes from "./routes/context.js"
import companionRoutes from "./routes/companion.js"
import digitalTwinRoutes from "./routes/digitaltwin.js"
import digestRoutes from "./routes/digest.js"
dotenv.config()
connectDB()

const app = express()
const server = createServer(app)

// WebSocket Server
const wss = new WebSocketServer({ server })

const rooms = {}

wss.on("connection", (ws) => {
  console.log("WebSocket client connected")

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data)

      if (msg.type === "join") {
        if (!msg.token || !msg.patientId) {
          ws.send(JSON.stringify({ type: "error", message: "Missing token or patientId" }))
          ws.close()
          return
        }

        try {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET)
          ws.userId = decoded.id
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Invalid token" }))
          ws.close()
          return
        }

        ws.patientId = msg.patientId
        if (!rooms[msg.patientId]) rooms[msg.patientId] = []
        rooms[msg.patientId].push(ws)
        ws.send(JSON.stringify({ type: "joined", patientId: msg.patientId }))
        console.log("Client joined room:", msg.patientId)
      }

      if (msg.type === "prompt") {
        const room = rooms[msg.patientId] || []
        room.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "prompt",
              prompt: msg.prompt,
              memoryId: msg.memoryId,
            }))
          }
        })
      }

      if (msg.type === "reaction") {
        const room = rooms[msg.patientId] || []
        room.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "reaction",
              reaction: msg.reaction,
              prompt: msg.prompt,
            }))
          }
        })
      }
    } catch (e) {
      console.log("WS error:", e.message)
    }
  })

  ws.on("close", () => {
    if (ws.patientId && rooms[ws.patientId]) {
      rooms[ws.patientId] = rooms[ws.patientId].filter((c) => c !== ws)
    }
    console.log("WebSocket client disconnected")
  })
})

const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((value) => value.trim()) : []),
]

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
})

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin)
    const isVercelPreview = process.env.ALLOW_VERCEL_PREVIEW === "true" && /^https:\/\/.*\.vercel\.app$/.test(origin)
    const isAllowed = allowedOrigins.includes(origin)

    if (isLocalhost || isVercelPreview || isAllowed) return callback(null, true)
    return callback(new Error("Not allowed by CORS"))
  },
}))
app.disable("x-powered-by")
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}))
app.use(express.json({ limit: "1mb" }))
app.use("/api", apiLimiter)
app.use("/uploads", express.static("uploads"))

app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/patients", patientRoutes)
app.use("/api/memories", memoryRoutes)
app.use("/api/sessions", sessionRoutes)
app.use("/api/music", musicRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/ghost-voice", ghostVoiceRoutes)
app.use("/api/last-letter", lastLetterRoutes)
app.use("/api/life-story", lifeStoryRoutes)
app.use("/api/assessment", assessmentRoutes)
app.use("/api/doctor", doctorRoutes)
app.use("/api/games", gameRoutes)
app.use("/api/context", contextRoutes)
app.use("/api/digital-twin", digitalTwinRoutes)
app.use("/api/digest", digestRoutes)
app.use("/api/companion", companionRoutes)
app.get("/api/health", (req, res) => res.json({ status: "GriefBridge API running ✅" }))

app.use((err, req, res, next) => {
  console.error(err.message)
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: "Internal server error" })
  }
  return res.status(500).json({ message: err.message })
})
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log("Server running on port " + PORT))