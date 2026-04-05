import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  User, Brain, Music, Heart,
  MessageCircle, Star, Mic, BookOpen, Activity, Trash2
} from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"
import { Camera } from "lucide-react"
import { Calendar } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const PatientProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  
  useEffect(() => {
    const fetchPatientAndContext = async () => {
      try {
        const patientRes = await api.get(`/patients/${id}`)
        setPatient(patientRes.data)

        try {
          const contextRes = await api.get(`/context/${id}`)
          setContext(contextRes.data)
        } catch {
          // Context can be absent for newly created profiles.
          setContext(null)
        }
      } catch (e) {
        const message = e?.response?.status === 403
          ? "Access denied for this patient"
          : "Patient not found"
        toast.error(message)
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchPatientAndContext()
  }, [id, navigate])

  const isDoctor = user?.role === "doctor"
  const createdById = typeof patient?.createdBy === "object" ? patient?.createdBy?._id : patient?.createdBy
  const isOwner = String(createdById || "") === String(user?.id || "")
  const canDeletePatient = isDoctor || isOwner

  const features = [
    { icon: <Brain size={24} className="text-primary" />, label: "Memory Vault", desc: "Upload & manage memories", path: "vault" },
    { icon: <MessageCircle size={24} className="text-primary" />, label: "Visit Companion", desc: "Real-time visit prompts", path: "visit" },
    { icon: <Music size={24} className="text-primary" />, label: "Music Therapy", desc: "Personalized music sessions", path: "music" },
    { icon: <Activity size={24} className="text-primary" />, label: "Spark Score", desc: "Relationship strength graph", path: "spark", doctorOnly: true },
    { icon: <Mic size={24} className="text-primary" />, label: "Ghost Voice", desc: "Voice cloning & preservation", path: "ghost-voice" },
    { icon: <Heart size={24} className="text-primary" />, label: "Last Letter", desc: "AI emotional letter", path: "last-letter" },
    { icon: <BookOpen size={24} className="text-primary" />, label: "Life Story Book", desc: "PDF life story generator", path: "life-story" },
    { icon: <BookOpen size={24} className="text-primary" />, label: "Caregiver Hub", desc: "Evidence-based care tips", path: "caregiver-hub" },
    { icon: <Brain size={24} className="text-primary" />, label: "MMSE Assessment", desc: "Clinical cognitive test", path: "mmse", doctorOnly: true },
    { icon: <Brain size={24} className="text-primary" />, label: "Cognitive Games", desc: "Brain training exercises", path: "cognitive-games" },
    { icon: <Camera size={24} className="text-primary" />, label: "Emotion Detection", desc: "Real-time AI emotion monitoring", path: "emotion", doctorOnly: true },
    { icon: <Heart size={24} className="text-primary" />, label: "AI Companion", desc: "AI friend who knows their story", path: "companion" },
    { icon: <Activity size={24} className="text-primary" />, label: "Digital Twin", desc: "AI health portrait", path: "digital-twin", doctorOnly: true },
    { icon: <Calendar size={24} className="text-primary" />, label: "Daily Digest", desc: "Family update summary", path: "digest" }
  ]

  const visibleFeatures = features.filter((feature) => !feature.doctorOnly || isDoctor)

  const handleDeletePatient = async () => {
    if (!canDeletePatient) return
    const confirmed = window.confirm("Delete this patient profile and all linked records? This action cannot be undone.")
    if (!confirmed) return

    try {
      setDeleting(true)
      await api.delete(`/patients/${id}`)
      toast.success("Patient profile deleted")
      navigate("/dashboard")
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete patient")
    } finally {
      setDeleting(false)
    }
  }

  const stageColor = {
    mild: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    severe: "bg-red-100 text-red-700",
  }

  const typeColor = {
    primary: "bg-purple-100 text-purple-700",
    secondary: "bg-blue-100 text-blue-700",
    reversible: "bg-teal-100 text-teal-700",
  }

  if (loading) return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-lg">Loading patient...</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Patient Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center gap-6">
            <div className="bg-soft p-5 rounded-2xl">
              <User size={40} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-dark">{patient?.name}</h1>
              <p className="text-muted mt-1">Age: {patient?.age} • Language: {patient?.language}</p>
              <div className="flex gap-2 mt-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${typeColor[patient?.dementiaType]}`}>
                  {patient?.dementiaType} dementia
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${stageColor[patient?.dementiaStage]}`}>
                  {patient?.dementiaStage} stage
                </span>
              </div>
            </div>
            {canDeletePatient && (
              <button
                onClick={handleDeletePatient}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete Patient"}
              </button>
            )}
          </div>
        </div>

        {isDoctor && context && context.tagIntelligence?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">AI Brain — What I Know</h2>
              <button
                onClick={() => api.post(`/context/${id}/refresh`).then(() => window.location.reload())}
                className="ml-auto text-xs text-primary hover:underline"
              >
                Refresh
              </button>
            </div>

            {context.aiContext?.patientSummary && (
              <p className="text-muted text-sm mb-4 leading-relaxed">
                {context.aiContext.patientSummary}
              </p>
            )}

            <div className="mb-4">
              <p className="text-xs font-medium text-dark mb-2">Top Memory Triggers:</p>
              <div className="flex flex-wrap gap-2">
                {context.tagIntelligence?.slice(0, 8).map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background: `hsl(${260 - i * 15}, 70%, ${95 - i * 3}%)`,
                      color: `hsl(${260 - i * 15}, 70%, 30%)`
                    }}
                  >
                    #{t.tag} ({t.triggerScore})
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "MMSE", value: context.cognitive?.latestMMSE ? `${context.cognitive.latestMMSE}/30` : "N/A" },
                { label: "Recall Rate", value: `${context.cognitive?.memoryRecallRate || 0}%` },
                { label: "Best Time", value: context.patterns?.bestTimeOfDay || "Morning" },
                { label: "Trend", value: context.cognitive?.mmsetrend || "Stable" },
              ].map((stat, i) => (
                <div key={i} className="bg-soft rounded-xl p-3 text-center">
                  <p className="font-bold text-primary">{stat.value}</p>
                  <p className="text-muted text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            {context.aiContext?.visitGuide && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 mb-1">💡 Today's Visit Guide:</p>
                <p className="text-sm text-dark">{context.aiContext.visitGuide}</p>
              </div>
            )}
          </div>
        )}

        {context && !isDoctor && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">Patient Summary</h2>
            </div>
            <p className="text-dark text-sm leading-relaxed mb-4">
              {context?.aiContext?.patientSummary || context.aiSummary || "Building patient profile..."}
            </p>
            {context.aiContext?.visitGuide && (
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs font-medium text-primary mb-1">Summary</p>
                <p className="text-sm text-dark">{context.aiContext.visitGuide}</p>
              </div>
            )}
          </div>
        )}

        {/* Feature Grid */}
        <h2 className="text-xl font-bold text-dark mb-4">Care Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {visibleFeatures.map((f, i) => (
            <div
              key={i}
              onClick={() => navigate(`/patient/${id}/${f.path}`)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer hover:border-primary border-2 border-transparent"
            >
              <div className="bg-soft p-3 rounded-xl w-fit mb-4">{f.icon}</div>
              <h3 className="font-semibold text-dark mb-1">{f.label}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatientProfile
