import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Mic, Download, Sparkles, AlertCircle } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api, { getApiBaseUrl, normalizeMemoriesResponse } from "../utils/api"
import toast from "react-hot-toast"

const API_BASE_URL = getApiBaseUrl()

const GhostVoice = () => {
  const { id } = useParams()
  const [audioMemories, setAudioMemories] = useState([])
  const [selectedMemory, setSelectedMemory] = useState("")
  const [text, setText] = useState("")
  const [language, setLanguage] = useState("hi")
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAudioMemories()
  }, [id])

  const fetchAudioMemories = async () => {
    try {
      const res = await api.get(`/memories/${id}`)
      const audio = normalizeMemoriesResponse(res.data).filter((m) => m.type === "audio")
      setAudioMemories(audio)
      if (audio.length > 0) setSelectedMemory(audio[0]._id)
    } catch {
      toast.error("Failed to load memories")
    }
    setLoading(false)
  }

  const generateVoice = async () => {
    if (!text.trim()) return toast.error("Please enter text first")
    if (!selectedMemory) return toast.error("Please select a voice reference")
    setGenerating(true)
    setAudioUrl(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/ghost-voice/${id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, memoryId: selectedMemory, language }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      toast.success("Voice generated!")
    } catch (e) {
      toast.error("Generation failed: " + e.message)
    }
    setGenerating(false)
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Ghost Voice</h1>
          <p className="text-muted mt-1">Preserve your loved one's voice forever</p>
        </div>

        <div className="max-w-2xl">

          {/* Info Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <Sparkles size={20} className="text-primary mt-0.5" />
              <div>
                <p className="font-medium text-dark mb-1">How Ghost Voice works</p>
                <p className="text-sm text-muted">
                  Type any message and hear it spoken using AI text-to-speech.
                  Upload an audio memory as reference, then generate a voice
                  message that can be played anytime — preserved forever.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : audioMemories.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <AlertCircle size={40} className="text-primary mx-auto mb-3 opacity-40" />
              <p className="text-dark font-medium mb-1">No audio memories found</p>
              <p className="text-muted text-sm">
                Go to Memory Vault and upload an audio recording of your loved one speaking first.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">

              {/* Select Voice Reference */}
              <div>
                <label className="text-sm font-medium text-dark mb-2 block">
                  Select Voice Reference (audio memory)
                </label>
                <select
                  value={selectedMemory}
                  onChange={(e) => setSelectedMemory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary"
                >
                  {audioMemories.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.decade} — {m.tags.join(", ") || "Audio recording"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Select */}
              <div>
                <label className="text-sm font-medium text-dark mb-2 block">
                  Language
                </label>
                <select
                  id="lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary"
                >
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="pa">Punjabi</option>
                  <option value="bn">Bengali</option>
                </select>
              </div>

              {/* Text Input */}
              <div>
                <label className="text-sm font-medium text-dark mb-2 block">
                  What should they say?
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Beta, main theek hoon. Tumse bahut pyaar karta hoon. Khyal rakhna apna..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateVoice}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating voice...
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    Generate Ghost Voice
                  </>
                )}
              </button>

              {/* Audio Output */}
              {audioUrl && (
                <div className="bg-soft rounded-2xl p-5">
                  <p className="text-sm font-medium text-dark mb-3">
                    🎙️ Generated Voice
                  </p>
                  <audio controls className="w-full mb-3">
                    <source src={audioUrl} type="audio/mpeg" />
                  </audio>
                  <a
                    href={audioUrl}
                    download="ghost_voice.mp3"
                    className="flex items-center justify-center gap-2 border border-primary text-primary py-2 rounded-xl text-sm font-medium hover:bg-primary hover:text-white transition"
                  >
                    <Download size={16} />
                    Download Audio
                  </a>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GhostVoice