import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from "recharts"
import { Brain, Heart, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const COLORS = ["#6C63FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

const DigitalTwin = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await api.get(`/digital-twin/${id}`)
      setData(res.data)
    } catch {
      toast.error("Failed to load Digital Twin")
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Building Digital Twin...</p>
        </div>
      </div>
    </div>
  )

  const trendIcon = data?.mmsetrend === "improving"
    ? <TrendingUp size={16} className="text-green-600" />
    : data?.mmsetrend === "declining"
    ? <TrendingDown size={16} className="text-red-600" />
    : <Minus size={16} className="text-gray-500" />

  const healthColor = data?.cognitiveHealthScore >= 70
    ? "text-green-600"
    : data?.cognitiveHealthScore >= 40
    ? "text-yellow-600"
    : "text-red-600"

  const healthBg = data?.cognitiveHealthScore >= 70
    ? "bg-green-50 border-green-200"
    : data?.cognitiveHealthScore >= 40
    ? "bg-yellow-50 border-yellow-200"
    : "bg-red-50 border-red-200"

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary p-3 rounded-2xl">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-dark">Digital Twin</h1>
            <p className="text-muted">AI-powered health portrait of {data?.patient?.name}</p>
          </div>
          <button
            onClick={fetchData}
            className="ml-auto text-sm text-primary border border-primary px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition"
          >
            Refresh
          </button>
        </div>

        {/* Cognitive Health Score */}
        <div className={`rounded-2xl p-6 border mb-6 ${healthBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark mb-1">Overall Cognitive Health Score</p>
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-bold ${healthColor}`}>
                  {data?.cognitiveHealthScore}
                </span>
                <span className="text-muted text-lg">/ 100</span>
                <div className="flex items-center gap-1 ml-2">
                  {trendIcon}
                  <span className="text-sm capitalize text-muted">{data?.mmsetrend}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">MMSE Score</p>
              <p className="text-3xl font-bold text-dark">
                {data?.latestMMSE !== null ? `${data.latestMMSE}/30` : "N/A"}
              </p>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mt-4 w-full bg-white rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all ${
                data?.cognitiveHealthScore >= 70 ? "bg-green-500" :
                data?.cognitiveHealthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${data?.cognitiveHealthScore || 0}%` }}
            />
          </div>

          {/* AI Summary */}
          {data?.context?.aiContext?.patientSummary && (
            <p className="text-sm text-dark mt-4 leading-relaxed">
              🧠 {data.context.aiContext.patientSummary}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Sessions", value: data?.totalSessions, icon: <Activity size={20} className="text-primary" /> },
            { label: "Total Memories", value: data?.totalMemories, icon: <Heart size={20} className="text-primary" /> },
            { label: "Recall Rate", value: `${data?.context?.cognitive?.memoryRecallRate || 0}%`, icon: <Brain size={20} className="text-primary" /> },
            { label: "Best Time", value: data?.context?.patterns?.bestTimeOfDay || "Morning", icon: <TrendingUp size={20} className="text-primary" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="bg-soft p-2 rounded-xl">{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-dark">{stat.value}</p>
                <p className="text-muted text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Weekly Response Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">Weekly Response Trend</h2>
            {data?.weeklyTrend?.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weeklyTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => [v, n === "positive" ? "Positive" : "Total"]} />
                  <Bar dataKey="total" fill="#E8E6FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="positive" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted text-sm">
                No session data this week
              </div>
            )}
          </div>

          {/* MMSE Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">MMSE Score Trend</h2>
            {data?.mmseTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.mmseTrend}>
                  <XAxis dataKey="assessment" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 30]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}/30`, "MMSE Score"]} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6C63FF"
                    strokeWidth={2}
                    dot={{ fill: "#6C63FF", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted text-sm">
                No assessments done yet
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Top Memory Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">Top Memory Triggers</h2>
            {data?.topTags?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.topTags.slice(0, 6).map((tag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted w-16 capitalize">#{tag.tag}</span>
                    <div className="flex-1 bg-soft rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${tag.triggerScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-primary">{tag.triggerScore}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm text-center py-8">Upload memories with tags to see triggers</p>
            )}
          </div>

          {/* Emotion Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">Mood Distribution</h2>
            {data?.emotionData?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={data.emotionData}
                      dataKey="count"
                      nameKey="emotion"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                    >
                      {data.emotionData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 mt-2">
                  {data.emotionData.map((e, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                      <span className="text-xs text-muted capitalize">{e.emotion}</span>
                      <span className="text-xs font-medium text-dark ml-auto">{e.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted text-sm text-center py-8">No mood data yet</p>
            )}
          </div>

          {/* Memory Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">Memory Vault Breakdown</h2>
            <div className="flex flex-col gap-4">
              {[
                { type: "Photos", count: data?.memoryBreakdown?.photo || 0, color: "bg-purple-500", emoji: "📸" },
                { type: "Audio", count: data?.memoryBreakdown?.audio || 0, color: "bg-blue-500", emoji: "🎵" },
                { type: "Videos", count: data?.memoryBreakdown?.video || 0, color: "bg-pink-500", emoji: "🎬" },
                { type: "Letters", count: data?.memoryBreakdown?.letter || 0, color: "bg-amber-500", emoji: "📝" },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted">{m.type}</span>
                      <span className="text-xs font-medium text-dark">{m.count}</span>
                    </div>
                    <div className="w-full bg-soft rounded-full h-2">
                      <div
                        className={`${m.color} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.min(m.count * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Guide */}
            {data?.context?.aiContext?.clinicalSummary && (
              <div className="mt-4 bg-soft rounded-xl p-3">
                <p className="text-xs text-muted leading-relaxed">
                  🏥 {data.context.aiContext.clinicalSummary}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Visit Guide + Music Guide */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-3">💬 Visit Guide</h2>
            <p className="text-sm text-muted leading-relaxed">
              {data?.context?.aiContext?.visitGuide || "Upload memories and complete sessions to get personalized visit guidance."}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-3">🎵 Music Guide</h2>
            <p className="text-sm text-muted leading-relaxed">
              {data?.context?.aiContext?.musicGuide || "Upload audio memories to get personalized music recommendations."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DigitalTwin