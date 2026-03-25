import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Brain, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const MMSE_QUESTIONS = [
  // Orientation to Time (5 points)
  { id: 1, category: "Orientation — Time", question: "What year is it?", type: "text", maxPoints: 1 },
  { id: 2, category: "Orientation — Time", question: "What season is it?", type: "text", maxPoints: 1 },
  { id: 3, category: "Orientation — Time", question: "What month is it?", type: "text", maxPoints: 1 },
  { id: 4, category: "Orientation — Time", question: "What is today's date?", type: "text", maxPoints: 1 },
  { id: 5, category: "Orientation — Time", question: "What day of the week is it?", type: "text", maxPoints: 1 },
  // Orientation to Place (5 points)
  { id: 6, category: "Orientation — Place", question: "What country are we in?", type: "text", maxPoints: 1 },
  { id: 7, category: "Orientation — Place", question: "What state/province are we in?", type: "text", maxPoints: 1 },
  { id: 8, category: "Orientation — Place", question: "What city/town are we in?", type: "text", maxPoints: 1 },
  { id: 9, category: "Orientation — Place", question: "What is the name of this place/hospital?", type: "text", maxPoints: 1 },
  { id: 10, category: "Orientation — Place", question: "What floor are we on?", type: "text", maxPoints: 1 },
  // Registration (3 points)
  { id: 11, category: "Registration", question: "I will say 3 words. Please repeat them: APPLE, TABLE, PENNY. (Score each word repeated correctly)", type: "score", maxPoints: 3 },
  // Attention (5 points)
  { id: 12, category: "Attention & Calculation", question: "Subtract 7 from 100, then keep subtracting 7. (93, 86, 79, 72, 65) — Score each correct subtraction", type: "score", maxPoints: 5 },
  // Recall (3 points)
  { id: 13, category: "Recall", question: "What were the 3 words I asked you to remember? (APPLE, TABLE, PENNY)", type: "score", maxPoints: 3 },
  // Language (8 points)
  { id: 14, category: "Language — Naming", question: "Show a watch — ask 'What is this called?'", type: "boolean", maxPoints: 1 },
  { id: 15, category: "Language — Naming", question: "Show a pencil — ask 'What is this called?'", type: "boolean", maxPoints: 1 },
  { id: 16, category: "Language — Repetition", question: "Ask patient to repeat: 'No ifs, ands, or buts'", type: "boolean", maxPoints: 1 },
  { id: 17, category: "Language — Command", question: "Give 3-step command: 'Take this paper, fold it in half, put it on the floor'", type: "score", maxPoints: 3 },
  { id: 18, category: "Language — Reading", question: "Show written command 'CLOSE YOUR EYES' — did patient follow?", type: "boolean", maxPoints: 1 },
  { id: 19, category: "Language — Writing", question: "Ask patient to write a complete sentence", type: "boolean", maxPoints: 1 },
  // Visuospatial (1 point)
  { id: 20, category: "Visuospatial", question: "Ask patient to copy intersecting pentagons drawing", type: "boolean", maxPoints: 1 },
]

const MMSEAssessment = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [view, setView] = useState("history") // history | test

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [patientRes, historyRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/assessment/${id}`),
      ])
      setPatient(patientRes.data)
      setHistory(historyRes.data)
    } catch {
      toast.error("Failed to load data")
    }
  }

  const question = MMSE_QUESTIONS[currentQ]
  const totalQuestions = MMSE_QUESTIONS.length
  const progress = ((currentQ + 1) / totalQuestions) * 100

  const setAnswer = (value) => {
    setAnswers({ ...answers, [question.id]: value })
  }

  const getScore = () => {
    return MMSE_QUESTIONS.reduce((sum, q) => {
      const ans = answers[q.id]
      if (ans === undefined || ans === null) return sum
      if (q.type === "boolean") return sum + (ans ? q.maxPoints : 0)
      if (q.type === "score") return sum + Math.min(Number(ans) || 0, q.maxPoints)
      return sum
    }, 0)
  }

  const getSeverity = (score) => {
    if (score >= 24) return { label: "Normal", color: "text-green-600", bg: "bg-green-100" }
    if (score >= 18) return { label: "Mild Dementia", color: "text-yellow-600", bg: "bg-yellow-100" }
    if (score >= 10) return { label: "Moderate Dementia", color: "text-orange-600", bg: "bg-orange-100" }
    return { label: "Severe Dementia", color: "text-red-600", bg: "bg-red-100" }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const formattedAnswers = MMSE_QUESTIONS.map((q) => {
        const ans = answers[q.id]
        let points = 0
        if (q.type === "boolean") points = ans ? q.maxPoints : 0
        else if (q.type === "score") points = Math.min(Number(ans) || 0, q.maxPoints)
        else points = ans ? 1 : 0
        return {
          questionId: q.id,
          question: q.question,
          category: q.category,
          answer: String(ans || ""),
          correct: points > 0,
          points,
          maxPoints: q.maxPoints,
        }
      })

      const res = await api.post(`/assessment/${id}`, {
        answers: formattedAnswers,
        notes,
      })

      setResult(res.data)
      setSubmitted(true)
      await fetchData()
      toast.success("Assessment saved!")
    } catch {
      toast.error("Failed to save assessment")
    }
    setSubmitting(false)
  }

  const severityColor = {
    normal: "bg-green-100 text-green-700",
    mild: "bg-yellow-100 text-yellow-700",
    moderate: "bg-orange-100 text-orange-700",
    severe: "bg-red-100 text-red-700",
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark">MMSE Assessment</h1>
            <p className="text-muted mt-1">
              Mini Mental State Examination — {patient?.name}
            </p>
          </div>
          {view === "history" && (
            <button
              onClick={() => { setView("test"); setCurrentQ(0); setAnswers({}); setSubmitted(false); setResult(null) }}
              className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
            >
              <Brain size={20} />
              Start New Assessment
            </button>
          )}
          {view === "test" && (
            <button
              onClick={() => setView("history")}
              className="px-5 py-3 border-2 border-gray-200 text-muted rounded-xl font-medium hover:border-primary hover:text-primary transition"
            >
              Back to History
            </button>
          )}
        </div>

        {/* History View */}
        {view === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="text-center mt-20">
                <Brain size={56} className="text-primary mx-auto mb-4 opacity-30" />
                <p className="text-dark text-xl font-semibold">No assessments yet</p>
                <p className="text-muted text-sm mt-2 mb-6">
                  Start the first MMSE assessment for {patient?.name}
                </p>
                <button
                  onClick={() => setView("test")}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                >
                  Start Assessment
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-dark">Assessment History</h2>
                {history.map((a, i) => {
                  const sev = getSeverity(a.totalScore)
                  return (
                    <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${sev.bg} p-3 rounded-xl`}>
                            <Brain size={24} className={sev.color} />
                          </div>
                          <div>
                            <p className="font-semibold text-dark text-lg">
                              Score: {a.totalScore} / 30
                            </p>
                            <p className="text-muted text-sm">
                              {new Date(a.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "long", year: "numeric"
                              })}
                              {" • "}
                              By {a.conductedBy?.name}
                            </p>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${severityColor[a.severity]}`}>
                          {sev.label}
                        </span>
                      </div>

                      {/* Score Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-soft rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              a.severity === "normal" ? "bg-green-500" :
                              a.severity === "mild" ? "bg-yellow-500" :
                              a.severity === "moderate" ? "bg-orange-500" : "bg-red-500"
                            }`}
                            style={{ width: `${(a.totalScore / 30) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted mt-1">
                          <span>Severe (0)</span>
                          <span>Moderate (10)</span>
                          <span>Mild (18)</span>
                          <span>Normal (24+)</span>
                        </div>
                      </div>

                      {a.notes && (
                        <p className="text-sm text-muted mt-3 bg-soft rounded-xl p-3">
                          📝 {a.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Test View */}
        {view === "test" && !submitted && (
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted mb-2">
                <span>Question {currentQ + 1} of {totalQuestions}</span>
                <span>Score so far: {getScore()} / 30</span>
              </div>
              <div className="w-full bg-soft rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
              <span className="text-xs bg-soft text-primary px-3 py-1 rounded-full font-medium">
                {question.category}
              </span>
              <p className="text-xl font-semibold text-dark mt-4 mb-6 leading-relaxed">
                {question.question}
              </p>

              {/* Answer Input */}
              {question.type === "boolean" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setAnswer(true)}
                    className={`flex-1 py-4 rounded-xl font-medium text-lg transition border-2
                      ${answers[question.id] === true
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-200 text-muted hover:border-green-400"}`}
                  >
                    ✅ Correct
                  </button>
                  <button
                    onClick={() => setAnswer(false)}
                    className={`flex-1 py-4 rounded-xl font-medium text-lg transition border-2
                      ${answers[question.id] === false
                        ? "bg-red-400 text-white border-red-400"
                        : "border-gray-200 text-muted hover:border-red-300"}`}
                  >
                    ❌ Incorrect
                  </button>
                </div>
              )}

              {question.type === "score" && (
                <div>
                  <p className="text-sm text-muted mb-3">
                    Score: 0 to {question.maxPoints} points
                  </p>
                  <div className="flex gap-3">
                    {Array.from({ length: question.maxPoints + 1 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswer(i)}
                        className={`w-14 h-14 rounded-xl font-bold text-lg transition border-2
                          ${answers[question.id] === i
                            ? "bg-primary text-white border-primary"
                            : "border-gray-200 text-muted hover:border-primary"}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {question.type === "text" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setAnswer(true)}
                    className={`flex-1 py-4 rounded-xl font-medium text-lg transition border-2
                      ${answers[question.id] === true
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-200 text-muted hover:border-green-400"}`}
                  >
                    ✅ Answered Correctly
                  </button>
                  <button
                    onClick={() => setAnswer(false)}
                    className={`flex-1 py-4 rounded-xl font-medium text-lg transition border-2
                      ${answers[question.id] === false
                        ? "bg-red-400 text-white border-red-400"
                        : "border-gray-200 text-muted hover:border-red-300"}`}
                  >
                    ❌ Incorrect / No Answer
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 text-muted rounded-xl font-medium disabled:opacity-40 hover:border-primary hover:text-primary transition"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              {currentQ < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Clinical notes (optional)..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Check size={20} />
                    )}
                    Submit Assessment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result View */}
        {submitted && result && (
          <div className="max-w-2xl mx-auto">
            {(() => {
              const sev = getSeverity(result.totalScore)
              return (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <div className={`${sev.bg} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <span className="text-4xl font-bold" style={{ color: sev.color.replace("text-", "") }}>
                      {result.totalScore}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-dark mb-2">
                    Score: {result.totalScore} / 30
                  </h2>
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${severityColor[result.severity]}`}>
                    {sev.label}
                  </span>

                  <div className="mt-6 w-full bg-soft rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        result.severity === "normal" ? "bg-green-500" :
                        result.severity === "mild" ? "bg-yellow-500" :
                        result.severity === "moderate" ? "bg-orange-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(result.totalScore / 30) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4 text-xs text-muted">
                    <span>Severe<br/>0-9</span>
                    <span>Moderate<br/>10-17</span>
                    <span>Mild<br/>18-23</span>
                    <span>Normal<br/>24-30</span>
                  </div>

                  <div className="bg-soft rounded-xl p-5 mt-6 text-left">
                    <h3 className="font-semibold text-dark mb-2">Category Breakdown</h3>
                    {Object.entries(
                      result.answers.reduce((acc, a) => {
                        if (!acc[a.category]) acc[a.category] = { points: 0, max: 0 }
                        acc[a.category].points += a.points
                        acc[a.category].max += a.maxPoints
                        return acc
                      }, {})
                    ).map(([cat, data]) => (
                      <div key={cat} className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-sm text-muted">{cat}</span>
                        <span className="text-sm font-medium text-dark">
                          {data.points} / {data.max}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setView("history")}
                      className="flex-1 border-2 border-gray-200 text-muted py-3 rounded-xl font-medium hover:border-primary hover:text-primary transition"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => navigate(`/patient/${id}`)}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                    >
                      Back to Patient
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default MMSEAssessment