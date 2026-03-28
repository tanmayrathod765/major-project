import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { BookOpen, Brain, Heart, Music, MessageCircle, Sparkles } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const TIPS = {
  mild: [
    {
      icon: <MessageCircle size={20} className="text-primary" />,
      title: "Keep conversations simple",
      desc: "Use short sentences and simple words. Give them time to respond — don't rush or finish their sentences.",
    },
    {
      icon: <Music size={20} className="text-primary" />,
      title: "Use music as a bridge",
      desc: "Play songs from their youth. Music memory is often preserved longest — it can unlock conversations.",
    },
    {
      icon: <Heart size={20} className="text-primary" />,
      title: "Focus on feelings not facts",
      desc: "Don't correct them if they remember things wrong. Validate their feelings instead of arguing about details.",
    },
    {
      icon: <Brain size={20} className="text-primary" />,
      title: "Establish routines",
      desc: "Familiar routines reduce anxiety. Visit at the same time, in the same way — predictability is comforting.",
    },
  ],
  moderate: [
    {
      icon: <MessageCircle size={20} className="text-primary" />,
      title: "Use visual cues",
      desc: "Show photos while talking. Point to things rather than just naming them. Visual memory outlasts verbal.",
    },
    {
      icon: <Heart size={20} className="text-primary" />,
      title: "Never say 'Don't you remember?'",
      desc: "This causes distress. Instead say 'Let me remind you...' or simply share the memory yourself.",
    },
    {
      icon: <Music size={20} className="text-primary" />,
      title: "Singing works better than talking",
      desc: "If they struggle to speak, try singing together. Many moderate-stage patients can still sing full songs.",
    },
    {
      icon: <Brain size={20} className="text-primary" />,
      title: "Watch for non-verbal cues",
      desc: "A smile, a squeeze of hand, eye contact — these are responses. Celebrate every small connection.",
    },
  ],
  severe: [
    {
      icon: <Heart size={20} className="text-primary" />,
      title: "Your presence is enough",
      desc: "Sit close, hold their hand, speak softly. They may not understand words but they feel your love.",
    },
    {
      icon: <Music size={20} className="text-primary" />,
      title: "Play familiar sounds",
      desc: "Ambient sounds from their past — a village, rain, temple bells — can bring deep comfort even now.",
    },
    {
      icon: <MessageCircle size={20} className="text-primary" />,
      title: "Speak in their language",
      desc: "Use their mother tongue. Native language is often the last to fade in severe dementia.",
    },
    {
      icon: <Brain size={20} className="text-primary" />,
      title: "Touch is powerful",
      desc: "Gentle touch on hands or face communicates love when words cannot. Always approach calmly.",
    },
  ],
}

const CaregiverHub = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [activeTab, setActiveTab] = useState("tips")
  const [aiTip, setAiTip] = useState("")
  const [loadingTip, setLoadingTip] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${id}`)
        setPatient(res.data)
        setActiveTab(res.data.dementiaStage || "mild")
      } catch {
        toast.error("Failed to load patient")
      }
      setLoading(false)
    }
    fetchPatient()
  }, [id])

  useEffect(() => {
  const fetchContext = async () => {
    try {
      const res = await api.get(`/context/${id}`)
      if (res.data?.aiContext?.caregiverTips) {
        setAiTip(res.data.aiContext.caregiverTips)
      }
    } catch {}
  }
  fetchContext()
}, [id])

  const getAITip = async () => {
    setLoadingTip(true)
    try {
      const res = await api.post(`/sessions/${id}/suggest`, {
        mood: "calm",
        usedPrompts: [],
      })
      setAiTip(res.data.suggestion)
    } catch {
      toast.error("Failed to get AI tip")
    }
    setLoadingTip(false)
  }

  const stages = ["mild", "moderate", "severe"]

  if (loading) return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Caregiver Training Hub</h1>
          <p className="text-muted mt-1">Evidence-based tips for {patient?.name}</p>
        </div>

        {/* AI Weekly Tip */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">AI Personalized Tip</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Based on session data
              </span>
            </div>
            <button
              onClick={getAITip}
              disabled={loadingTip}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {loadingTip ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Sparkles size={14} />
              )}
              Get AI Tip
            </button>
          </div>

          {aiTip ? (
            <div className="bg-soft rounded-xl p-4">
              <p className="text-dark leading-relaxed">"{aiTip}"</p>
            </div>
          ) : (
            <p className="text-muted text-sm">
              Click "Get AI Tip" to get a personalized suggestion based on {patient?.name}'s recent sessions.
            </p>
          )}
        </div>

        {/* Stage Tabs */}
        <div className="flex gap-2 mb-6">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveTab(stage)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition
                ${activeTab === stage
                  ? "bg-primary text-white"
                  : "bg-white text-muted hover:text-primary"}`}
            >
              {stage} stage
              {patient?.dementiaStage === stage && (
                <span className="ml-2 text-xs bg-white bg-opacity-30 px-1 rounded">current</span>
              )}
            </button>
          ))}
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TIPS[activeTab]?.map((tip, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-soft p-2 rounded-xl">{tip.icon}</div>
                <h3 className="font-semibold text-dark">{tip.title}</h3>
              </div>
              <p className="text-muted text-sm leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>

        {/* What NOT to do */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-6">
          <h2 className="font-semibold text-red-700 mb-4">❌ What NOT to say or do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Don't say 'Don't you remember?'",
              "Don't argue about facts or correct them",
              "Don't speak loudly or rush them",
              "Don't show frustration or impatience",
              "Don't ask multiple questions at once",
              "Don't ignore non-verbal responses",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <p className="text-sm text-red-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaregiverHub