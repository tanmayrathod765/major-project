import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import "express-async-errors"
import { createServer } from "http"
import { WebSocketServer } from "ws"
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

app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json())
app.use("/uploads", express.static("uploads"))

app.use("/api/auth", authRoutes)
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
app.get("/api/health", (req, res) => res.json({ status: "GriefBridge API running ✅" }))

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ message: err.message })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log("Server running on port " + PORT))