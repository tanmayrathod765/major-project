import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Heart, Star, Calendar, Lightbulb, RefreshCw, Share2 } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const FamilyDigest = () => {
  const { id } = useParams()
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    generateDigest()
  }, [id])

  const generateDigest = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/digest/${id}/generate`)
      setDigest(res.data)
      setGenerated(true)
    } catch {
      toast.error("Failed to generate digest")
    }
    setLoading(false)
  }

  const shareDigest = () => {
    if (!digest) return
    const text = `GriefBridge Daily Digest — ${digest.date}\n\n${digest.digest}\n\nTomorrow's tip: ${digest.tomorrowTip}`
    if (navigator.share) {
      navigator.share({ title: `${digest.patientName}'s Daily Update`, text })
    } else {
      navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    }
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark">Family Daily Digest</h1>
            <p className="text-muted mt-1">
              {digest?.date || "Today's update for your family"}
            </p>
          </div>
          <div className="flex gap-3">
            {generated && (
              <button
                onClick={shareDigest}
                className="flex items-center gap-2 border-2 border-primary text-primary px-4 py-2 rounded-xl font-medium hover:bg-primary hover:text-white transition"
              >
                <Share2 size={16} />
                Share
              </button>
            )}
            <button
              onClick={generateDigest}
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Generating..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center mt-20">
            <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted">AI is preparing today's digest...</p>
          </div>
        ) : digest ? (
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Main Digest Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary p-3 rounded-xl">
                  <Heart size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-dark text-lg">
                    {digest.patientName}'s Daily Update
                  </h2>
                  <p className="text-muted text-sm">{digest.date}</p>
                </div>
              </div>

              <p className="text-dark leading-relaxed text-base">
                {digest.digest}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Sessions Today",
                  value: digest.stats.sessionsToday,
                  icon: "📅",
                  color: "bg-purple-50"
                },
                {
                  label: "Positive Responses",
                  value: `${digest.stats.positiveResponses}/${digest.stats.totalResponses}`,
                  icon: "😊",
                  color: "bg-green-50"
                },
                {
                  label: "Recall Rate",
                  value: `${digest.stats.recallRate}%`,
                  icon: "🧠",
                  color: "bg-blue-50"
                },
              ].map((stat, i) => (
                <div key={i} className={`${stat.color} rounded-2xl p-5 text-center`}>
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-dark">{stat.value}</p>
                  <p className="text-muted text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Best Moment */}
            {digest.stats.bestMoment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={18} className="text-yellow-500" />
                  <h3 className="font-semibold text-dark">Best Moment Today</h3>
                </div>
                <p className="text-dark text-sm">
                  When we said <strong>"{digest.stats.bestMoment.prompt}"</strong>,
                  they responded with a <strong>{digest.stats.bestMoment.reaction.replace("_", " ")}</strong>. 💛
                </p>
              </div>
            )}

            {/* Memory Triggers */}
            {digest.topTags?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-dark mb-3">
                  🧠 What Triggers Best Responses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {digest.topTags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-soft text-primary px-3 py-1.5 rounded-full text-sm font-medium capitalize"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tomorrow's Tip */}
            <div className="bg-primary rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-yellow-300" />
                <h3 className="font-semibold">Tomorrow's Visit Tip</h3>
              </div>
              <p className="text-purple-100 text-sm leading-relaxed">
                {digest.tomorrowTip}
              </p>
            </div>

            {/* Share Message */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-dark mb-3">
                📱 Share with Family
              </h3>
              <p className="text-muted text-sm mb-4">
                Copy this update to share with other family members on WhatsApp
              </p>
              <div className="bg-soft rounded-xl p-4 text-sm text-dark leading-relaxed mb-4">
                <strong>GriefBridge Update — {digest.date}</strong>
                <br /><br />
                {digest.digest}
                <br /><br />
                <strong>Tomorrow's tip:</strong> {digest.tomorrowTip}
              </div>
              <button
                onClick={shareDigest}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition"
              >
                <Share2 size={18} />
                Share on WhatsApp / Copy
              </button>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FamilyDigest