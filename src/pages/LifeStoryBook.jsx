import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { BookOpen, Download, Sparkles, Image, Mic, FileText, Video } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api, { normalizeListResponse, normalizeMemoriesResponse } from "../utils/api"
import toast from "react-hot-toast"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const LifeStoryBook = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [stats, setStats] = useState({ memories: 0, sessions: 0, photos: 0, audio: 0 })
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [patientRes, memoriesRes, sessionsRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/memories/${id}`),
        api.get(`/sessions/${id}`),
      ])
      setPatient(patientRes.data)
      const memories = normalizeMemoriesResponse(memoriesRes.data)
      const sessions = normalizeListResponse(sessionsRes.data, "sessions")
      setStats({
        memories: memories.length,
        sessions: sessions.length,
        photos: memories.filter((m) => m.type === "photo").length,
        audio: memories.filter((m) => m.type === "audio").length,
      })
    } catch {
      toast.error("Failed to load data")
    }
    setLoading(false)
  }

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/life-story/${id}/generate`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Generation failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${patient.name}_Life_Story.pdf`
      a.click()
      toast.success("Life Story Book downloaded!")
    } catch (e) {
      toast.error("Failed to generate: " + e.message)
    }
    setGenerating(false)
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Life Story Book</h1>
          <p className="text-muted mt-1">A beautiful PDF of {patient?.name}'s entire captured life</p>
        </div>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div className="max-w-2xl">

            {/* Preview Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
              <div className="text-center mb-8">
                <div className="bg-soft w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={36} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark">The Life of {patient?.name}</h2>
                <p className="text-muted mt-1">Age {patient?.age} • {patient?.dementiaType} dementia</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { icon: <Image size={18} className="text-primary" />, label: "Photos", value: stats.photos },
                  { icon: <Mic size={18} className="text-primary" />, label: "Audio", value: stats.audio },
                  { icon: <FileText size={18} className="text-primary" />, label: "Memories", value: stats.memories },
                  { icon: <Video size={18} className="text-primary" />, label: "Sessions", value: stats.sessions },
                ].map((s, i) => (
                  <div key={i} className="bg-soft rounded-xl p-4 text-center">
                    <div className="flex justify-center mb-2">{s.icon}</div>
                    <p className="text-xl font-bold text-dark">{s.value}</p>
                    <p className="text-muted text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* What's included */}
              <div className="bg-soft rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-dark mb-3">What's included in the PDF</h3>
                <div className="flex flex-col gap-2">
                  {[
                    "Patient introduction and profile",
                    "Memories organized by decade",
                    "Audio transcripts from voice recordings",
                    "Moments of connection from visit sessions",
                    "Closing message of love",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <p className="text-sm text-muted">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={generatePDF}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={22} />
                    Generate & Download Life Story Book
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-muted text-sm">
              This PDF is a permanent keepsake — a record of a life lived with love 💜
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LifeStoryBook