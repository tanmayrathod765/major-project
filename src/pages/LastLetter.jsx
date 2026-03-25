import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Heart, Sparkles, Download, User } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const LastLetter = () => {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [recipientName, setRecipientName] = useState("")
  const [relationship, setRelationship] = useState("daughter")
  const [letter, setLetter] = useState("")
  const [generating, setGenerating] = useState(false)

  const RELATIONSHIPS = ["daughter", "son", "wife", "husband", "sister", "brother", "friend", "caregiver"]

  useEffect(() => {
    const fetchPatient = async () => {
      const res = await api.get(`/patients/${id}`)
      setPatient(res.data)
    }
    fetchPatient()
  }, [id])

  const generateLetter = async () => {
    if (!recipientName.trim()) return toast.error("Please enter recipient name")
    setGenerating(true)
    setLetter("")
    try {
      const res = await api.post(`/last-letter/${id}`, {
        patientName: patient.name,
        recipientName,
        relationship,
      })
      if (res.data.success) {
        setLetter(res.data.letter)
        toast.success("Letter generated!")
      } else {
        toast.error("Generation failed")
      }
    } catch {
      toast.error("Failed to generate letter")
    }
    setGenerating(false)
  }

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Last_Letter_to_${recipientName}.txt`
    a.click()
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Last Letter</h1>
          <p className="text-muted mt-1">A letter from {patient?.name} — written by AI from real session data</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Heart size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">Generate Letter</h2>
            </div>

            {/* Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-muted">
                This letter is written FROM <strong>{patient?.name}</strong> using evidence from real visit sessions —
                moments they smiled, words they spoke, memories that touched them.
                Every sentence is grounded in real data.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Letter is addressed to
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Priya, Rahul, Maa..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Their relationship to patient
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateLetter}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Writing letter...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Letter
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Letter Output */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User size={20} className="text-primary" />
                <h2 className="font-semibold text-dark">
                  {letter ? `Letter to ${recipientName}` : "Letter will appear here"}
                </h2>
              </div>
              {letter && (
                <button
                  onClick={downloadLetter}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
            </div>

            {generating ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <p className="text-muted">AI is writing from the heart...</p>
              </div>
            ) : letter ? (
              <div className="bg-soft rounded-xl p-6 h-96 overflow-y-auto">
                <p className="text-dark leading-relaxed whitespace-pre-line font-serif text-sm">
                  {letter}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <Heart size={40} className="text-primary opacity-30 mb-3" />
                <p className="text-muted text-center">
                  Fill in the details and click<br />"Generate Letter" to create a personalized letter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LastLetter