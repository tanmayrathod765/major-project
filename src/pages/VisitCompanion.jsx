import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import {
  Brain, Heart, Smile, MessageCircle,
  Eye, Volume2, AlertCircle, Play, Square, Sparkles
} from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL
  || ((import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, ""))
const WS_BASE_URL = import.meta.env.VITE_WS_URL
  || SERVER_BASE_URL.replace(/^http/, "ws")

const REACTIONS = [
  { key: "smile", label: "Smiled", icon: <Smile size={18} />, color: "bg-green-100 text-green-700 border-green-200" },
  { key: "word", label: "Spoke", icon: <MessageCircle size={18} />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "eye_contact", label: "Eye Contact", icon: <Eye size={18} />, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "no_response", label: "No Response", icon: <AlertCircle size={18} />, color: "bg-gray-100 text-gray-600 border-gray-200" },
  { key: "agitated", label: "Agitated", icon: <AlertCircle size={18} />, color: "bg-red-100 text-red-700 border-red-200" },
]

const MOODS = ["calm", "agitated", "happy", "confused", "sleepy"]

const VisitCompanion = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [session, setSession] = useState(null)
  const [mood, setMood] = useState("calm")
  const [suggestion, setSuggestion] = useState("")
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [responses, setResponses] = useState([])
  const [usedPrompts, setUsedPrompts] = useState([])
  const [sessionActive, setSessionActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const wsRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchPatient()
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [id])

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/patients/${id}`)
      setPatient(res.data)
    } catch {
      toast.error("Failed to load patient")
    }
  }

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_BASE_URL)
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", patientId: id }))
      console.log("WebSocket connected")
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === "prompt") {
        setCurrentPrompt(msg.prompt)
      }
    }
    ws.onerror = () => console.log("WS error")
    wsRef.current = ws
  }

  const startSession = async () => {
    try {
      const res = await api.post(`/sessions/${id}/start`, { mood })
      setSession(res.data)
      setSessionActive(true)
      setTimer(0)
      connectWebSocket()
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000)
      toast.success("Session started!")
      await getSuggestion()
    } catch {
      toast.error("Failed to start session")
    }
  }

  const endSession = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      if (wsRef.current) wsRef.current.close()
      await api.put(`/sessions/${session._id}/end`, { duration: timer })
      setSessionActive(false)
      setSession(null)
      setResponses([])
      setUsedPrompts([])
      setSuggestion("")
      setCurrentPrompt("")
      toast.success("Session ended!")
    } catch {
      toast.error("Failed to end session")
    }
  }

  const getSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const res = await api.post(`/sessions/${id}/suggest`, {
        mood,
        usedPrompts,
      })
      setSuggestion(res.data.suggestion)
      setCurrentPrompt(res.data.suggestion)

      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: "prompt",
          patientId: id,
          prompt: res.data.suggestion,
        }))
      }
    } catch {
      toast.error("Failed to get suggestion")
    }
    setLoadingSuggestion(false)
  }

  const logReaction = async (reaction) => {
    if (!session) return
    try {
      const responseData = {
        prompt: currentPrompt,
        reaction,
        timestamp: new Date(),
      }
      await api.post(`/sessions/${session._id}/response`, responseData)
      setResponses([responseData, ...responses])
      setUsedPrompts([...usedPrompts, currentPrompt])

      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({
          type: "reaction",
          patientId: id,
          reaction,
          prompt: currentPrompt,
        }))
      }

      toast.success("Response logged!")
      await getSuggestion()
    } catch {
      toast.error("Failed to log reaction")
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const reactionCount = (key) => responses.filter((r) => r.reaction === key).length

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark">Visit Companion</h1>
            <p className="text-muted mt-1">
              {patient?.name} • {patient?.dementiaStage} stage
            </p>
          </div>
          {sessionActive && (
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-mono font-semibold">
                ⏱ {formatTime(timer)}
              </div>
              <button
                onClick={endSession}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-red-600 transition"
              >
                <Square size={16} />
                End Session
              </button>
            </div>
          )}
        </div>

        {!sessionActive ? (
          /* Pre-session */
          <div className="max-w-lg mx-auto mt-16 text-center">
            <div className="bg-white rounded-2xl p-10 shadow-sm">
              <Brain size={48} className="text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark mb-2">Start a Visit Session</h2>
              <p className="text-muted mb-8">AI will guide you through the visit with personalized prompts</p>

              <div className="mb-6">
                <label className="text-sm font-medium text-dark mb-2 block text-left">
                  How is {patient?.name} feeling right now?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition border
                        ${mood === m
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-muted border-gray-200 hover:border-primary"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startSession}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-opacity-90 transition"
              >
                <Play size={20} />
                Begin Visit
              </button>
            </div>
          </div>
        ) : (
          /* Active session */
          <div className="grid grid-cols-3 gap-6">

            {/* Main Prompt Area */}
            <div className="col-span-2 flex flex-col gap-6">

              {/* Current Suggestion */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-primary" />
                  <h2 className="font-semibold text-dark">AI Suggestion</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-auto">Live</span>
                </div>

                {loadingSuggestion ? (
                  <div className="flex items-center gap-3 py-6">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-muted">AI is thinking...</p>
                  </div>
                ) : (
                  <p className="text-2xl text-dark font-medium leading-relaxed">
                    "{suggestion || "Starting session..."}"
                  </p>
                )}

                <button
                  onClick={getSuggestion}
                  disabled={loadingSuggestion}
                  className="mt-6 flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  <Sparkles size={16} />
                  Get new suggestion
                </button>
              </div>

              {/* Reaction Buttons */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-4">How did they respond?</h2>
                <div className="grid grid-cols-5 gap-3">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => logReaction(r.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition hover:scale-105 ${r.color}`}
                    >
                      {r.icon}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response History */}
              {responses.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-dark mb-4">Session History</h2>
                  <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                    {responses.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-soft rounded-xl">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap
                          ${r.reaction === "smile" || r.reaction === "word" || r.reaction === "eye_contact"
                            ? "bg-green-100 text-green-700"
                            : r.reaction === "agitated"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"}`}>
                          {r.reaction}
                        </span>
                        <p className="text-sm text-muted flex-1">"{r.prompt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel — Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-4">Session Stats</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Duration</span>
                    <span className="font-semibold text-dark font-mono">{formatTime(timer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Prompts tried</span>
                    <span className="font-semibold text-dark">{responses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Positive responses</span>
                    <span className="font-semibold text-green-600">
                      {reactionCount("smile") + reactionCount("word") + reactionCount("eye_contact")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">No response</span>
                    <span className="font-semibold text-gray-500">{reactionCount("no_response")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-3">Patient Mood</h2>
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm capitalize">{mood}</span>
              </div>

              <div className="bg-soft rounded-2xl p-5">
                <h2 className="font-semibold text-dark mb-2 text-sm">💡 Tip</h2>
                <p className="text-muted text-xs leading-relaxed">
                  If patient is agitated, try playing their favorite song or showing a familiar photo instead of asking questions.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default VisitCompanion