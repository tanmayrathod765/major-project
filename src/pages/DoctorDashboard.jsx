import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, Brain, Activity, TrendingUp,
  AlertCircle, CheckCircle, Clock, FileText
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (user?.role === "doctor") {
      fetchAll()
    } else {
      setLoading(false)
    }
  }, [user?.role])

  if (user?.role !== "doctor") {
    return (
      <div className="flex min-h-screen bg-soft">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-dark mb-2">Doctor View</h1>
            <p className="text-muted">Only doctor accounts can access this dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  const fetchAll = async () => {
    try {
      const [statsRes, patientsRes] = await Promise.all([
        api.get("/doctor/stats"),
        api.get("/doctor/patients"),
      ])
      setStats(statsRes.data)
      setPatients(patientsRes.data)
    } catch {
      toast.error("Failed to load doctor dashboard")
    }
    setLoading(false)
  }

  const severityColor = {
    normal: "bg-green-100 text-green-700",
    mild: "bg-yellow-100 text-yellow-700",
    moderate: "bg-orange-100 text-orange-700",
    severe: "bg-red-100 text-red-700",
  }

  const stageColor = {
    mild: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    severe: "bg-red-100 text-red-700",
  }

  const COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444"]

  const pieData = stats ? [
    { name: "Normal", value: stats.severityBreakdown.normal },
    { name: "Mild", value: stats.severityBreakdown.mild },
    { name: "Moderate", value: stats.severityBreakdown.moderate },
    { name: "Severe", value: stats.severityBreakdown.severe },
  ] : []

  const filtered = patients
    .filter(p => filter === "all" || p.dementiaStage === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

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
          <h1 className="text-3xl font-bold text-dark">Doctor Dashboard</h1>
          <p className="text-muted mt-1">Clinical overview of all patients</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: "Total Patients", value: stats?.totalPatients, icon: <Users size={22} className="text-primary" />, bg: "bg-purple-50" },
            { label: "Total Sessions", value: stats?.totalSessions, icon: <Activity size={22} className="text-primary" />, bg: "bg-blue-50" },
            { label: "Assessments Done", value: stats?.totalAssessments, icon: <Brain size={22} className="text-primary" />, bg: "bg-green-50" },
            { label: "Total Caregivers", value: stats?.totalUsers, icon: <TrendingUp size={22} className="text-primary" />, bg: "bg-pink-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-dark">{stat.value ?? 0}</p>
                <p className="text-muted text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Severity Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">MMSE Severity Breakdown</h2>
            {pieData.every(d => d.value === 0) ? (
              <div className="text-center py-8">
                <Brain size={36} className="text-primary mx-auto mb-2 opacity-30" />
                <p className="text-muted text-sm">No assessments yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }}></div>
                        <span className="text-sm text-muted">{d.name}</span>
                      </div>
                      <span className="text-sm font-medium text-dark">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Alert Patients */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-dark mb-4">⚠️ Patients Needing Attention</h2>
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
              {patients
                .filter(p => p.dementiaStage === "severe" || p.mmseSevertiy === "severe" || p.mmseSevertiy === "moderate")
                .slice(0, 5)
                .map((p) => (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/doctor/patient/${p._id}`)}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle size={18} className="text-red-500" />
                      <div>
                        <p className="font-medium text-dark text-sm">{p.name}</p>
                        <p className="text-xs text-muted">
                          Stage: {p.dementiaStage} •
                          MMSE: {p.latestMMSE !== null ? `${p.latestMMSE}/30` : "Not assessed"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityColor[p.mmseSevertiy] || "bg-gray-100 text-gray-600"}`}>
                      {p.mmseSevertiy || "Unassessed"}
                    </span>
                  </div>
                ))}
              {patients.filter(p =>
                p.dementiaStage === "severe" ||
                p.mmseSevertiy === "severe" ||
                p.mmseSevertiy === "moderate"
              ).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
                  <p className="text-muted text-sm">All patients stable</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-dark">All Patients</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient..."
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">All Stages</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted text-sm border-b">
                  <th className="pb-3 font-medium">Patient</th>
                  <th className="pb-3 font-medium">Age</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">MMSE Score</th>
                  <th className="pb-3 font-medium">Sessions</th>
                  <th className="pb-3 font-medium">Memories</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-soft transition">
                    <td className="py-4">
                      <p className="font-medium text-dark">{p.name}</p>
                      <p className="text-xs text-muted">{p.createdBy?.name}</p>
                    </td>
                    <td className="py-4 text-muted text-sm">{p.age}</td>
                    <td className="py-4">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full capitalize">
                        {p.dementiaType}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${stageColor[p.dementiaStage]}`}>
                        {p.dementiaStage}
                      </span>
                    </td>
                    <td className="py-4">
                      {p.latestMMSE !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-dark">{p.latestMMSE}/30</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${severityColor[p.mmseSevertiy]}`}>
                            {p.mmseSevertiy}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Not assessed</span>
                      )}
                    </td>
                    <td className="py-4 text-dark text-sm">{p.totalSessions}</td>
                    <td className="py-4 text-dark text-sm">{p.totalMemories}</td>
                    <td className="py-4">
                      <button
                        onClick={() => navigate(`/patient/${p._id}`)}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Users size={40} className="text-primary mx-auto mb-3 opacity-30" />
                <p className="text-muted">No patients found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard