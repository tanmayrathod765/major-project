import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Zap, TrendingUp, Clock, Heart } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const SparkScore = () => {
  const { id } = useParams()
  const [sparkData, setSparkData] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [memoryHealth, setMemoryHealth] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchAll = async () => {
    try {
      const [sparkRes, predictRes, healthRes] = await Promise.all([
        api.get(`/analytics/spark/${id}`),
        api.get(`/analytics/predict/${id}`),
        api.get(`/analytics/memory-health/${id}`),
      ])
      setSparkData(sparkRes.data.sparkData)
      setPrediction(predictRes.data)
      setMemoryHealth(healthRes.data.memoryHealth.slice(0, 6))
    } catch {
      toast.error("Failed to load analytics")
    }
    setLoading(false)
  }

  const COLORS = ["#6C63FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

  if (loading) return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Spark Score</h1>
          <p className="text-muted mt-1">Relationship strength & visit analytics</p>
        </div>

        {/* Good Day Predictor */}
        {prediction && (
          <div className={`rounded-2xl p-6 shadow-sm mb-6 ${
            prediction.prediction === "good"
              ? "bg-green-50 border border-green-200"
              : prediction.prediction === "challenging"
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                prediction.prediction === "good" ? "bg-green-100" : "bg-yellow-100"
              }`}>
                <TrendingUp size={24} className={
                  prediction.prediction === "good" ? "text-green-600" : "text-yellow-600"
                } />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-dark">Today's Prediction</h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                    prediction.prediction === "good"
                      ? "bg-green-100 text-green-700"
                      : prediction.prediction === "challenging"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {prediction.prediction} day
                  </span>
                  <span className="text-xs text-muted ml-auto">
                    {prediction.confidence}% confidence
                  </span>
                </div>
                <p className="text-dark mb-2">{prediction.message}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted">
                    🕐 Best time: <strong>{prediction.bestTime}</strong>
                  </span>
                </div>
                <div className="mt-3 bg-white rounded-xl p-3">
                  <p className="text-sm text-muted">💡 <strong>Tip:</strong> {prediction.tip}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Spark Score Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">Relationship Spark Scores</h2>
            </div>

            {sparkData.length === 0 ? (
              <div className="text-center py-12">
                <Heart size={40} className="text-primary mx-auto mb-3 opacity-40" />
                <p className="text-muted">No session data yet</p>
                <p className="text-muted text-sm mt-1">Start a visit session to see scores</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sparkData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}/100`, "Spark Score"]}
                    />
                    {sparkData.map((entry, index) => (
                      <Bar key={entry.id} dataKey="sparkScore" fill={COLORS[index % COLORS.length]} radius={[6, 6, 0, 0]} />
                    ))}
                    <Bar dataKey="sparkScore" radius={[6, 6, 0, 0]}>
                      {sparkData.map((entry, index) => (
                        <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex flex-col gap-3 mt-4">
                  {sparkData.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                      <span className="text-sm font-medium text-dark flex-1">{c.name}</span>
                      <span className="text-xs text-muted">{c.totalSessions} sessions</span>
                      <span className="text-sm font-bold text-primary">{c.sparkScore}/100</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Memory Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Heart size={20} className="text-primary" />
              <h2 className="font-semibold text-dark">Memory Health</h2>
            </div>

            {memoryHealth.length === 0 ? (
              <div className="text-center py-12">
                <Heart size={40} className="text-primary mx-auto mb-3 opacity-40" />
                <p className="text-muted">No memory data yet</p>
                <p className="text-muted text-sm mt-1">Upload memories to see health scores</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {memoryHealth.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-dark capitalize">
                          {m.type} • {m.decade}
                          {m.tags.length > 0 && ` • #${m.tags[0]}`}
                        </span>
                        <span className="text-sm font-semibold text-primary">{m.healthScore}%</span>
                      </div>
                      <div className="w-full bg-soft rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${m.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {sparkData.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Sessions", value: sparkData.reduce((s, c) => s + c.totalSessions, 0), icon: <Clock size={20} className="text-primary" /> },
              { label: "Total Responses", value: sparkData.reduce((s, c) => s + c.totalResponses, 0), icon: <Heart size={20} className="text-primary" /> },
              { label: "Positive Responses", value: sparkData.reduce((s, c) => s + c.positiveResponses, 0), icon: <Zap size={20} className="text-primary" /> },
              { label: "Avg Spark Score", value: Math.round(sparkData.reduce((s, c) => s + c.sparkScore, 0) / sparkData.length) + "/100", icon: <TrendingUp size={20} className="text-primary" /> },
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
        )}
      </div>
    </div>
  )
}

export default SparkScore