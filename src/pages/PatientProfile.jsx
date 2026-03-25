import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  User, Brain, Music, Heart,
  MessageCircle, Star, Mic, BookOpen, Activity
} from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"
import { Camera } from "lucide-react"

const PatientProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${id}`)
        setPatient(res.data)
      } catch {
        toast.error("Patient not found")
        navigate("/dashboard")
      }
      setLoading(false)
    }
    fetchPatient()
  }, [id])

  const features = [
    { icon: <Brain size={24} className="text-primary" />, label: "Memory Vault", desc: "Upload & manage memories", path: "vault" },
    { icon: <MessageCircle size={24} className="text-primary" />, label: "Visit Companion", desc: "Real-time visit prompts", path: "visit" },
    { icon: <Music size={24} className="text-primary" />, label: "Music Therapy", desc: "Personalized music sessions", path: "music" },
    { icon: <Activity size={24} className="text-primary" />, label: "Spark Score", desc: "Relationship strength graph", path: "spark" },
    { icon: <Mic size={24} className="text-primary" />, label: "Ghost Voice", desc: "Voice cloning & preservation", path: "ghost-voice" },
    { icon: <Heart size={24} className="text-primary" />, label: "Last Letter", desc: "AI emotional letter", path: "last-letter" },
    { icon: <BookOpen size={24} className="text-primary" />, label: "Life Story Book", desc: "PDF life story generator", path: "life-story" },
    { icon: <Star size={24} className="text-primary" />, label: "Memory Dashboard", desc: "Memory health trends", path: "dashboard" },
    { icon: <BookOpen size={24} className="text-primary" />, label: "Caregiver Hub", desc: "Evidence-based care tips", path: "caregiver-hub" },
    { icon: <Brain size={24} className="text-primary" />, label: "MMSE Assessment", desc: "Clinical cognitive test", path: "mmse" },
    { icon: <Brain size={24} className="text-primary" />, label: "Cognitive Games", desc: "Brain training exercises", path: "cognitive-games" },
    { icon: <Camera size={24} className="text-primary" />, label: "Emotion Detection", desc: "Real-time AI emotion monitoring", path: "emotion" },
  ]

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
          </div>
        </div>

        {/* Feature Grid */}
        <h2 className="text-xl font-bold text-dark mb-4">Care Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
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
