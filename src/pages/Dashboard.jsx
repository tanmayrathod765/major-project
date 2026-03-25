import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, User, Brain, Heart } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const Dashboard = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    age: "",
    dementiaType: "primary",
    dementiaStage: "mild",
    language: "hindi",
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients")
      setPatients(res.data)
    } catch {
      toast.error("Failed to load patients")
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddPatient = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/patients", form)
      setPatients([...patients, res.data])
      setShowForm(false)
      setForm({
        name: "",
        age: "",
        dementiaType: "primary",
        dementiaStage: "mild",
        language: "hindi",
      })
      toast.success("Patient added successfully!")
    } catch {
      toast.error("Failed to add patient")
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

  const totalMemories = patients.length * 5
  const totalSessions = patients.length * 2

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark">Dashboard</h1>
            <p className="text-muted mt-1">Manage your loved ones with care</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
          >
            <Plus size={20} />
            Add Patient
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            {
              label: "Total Patients",
              value: patients.length,
              icon: <User size={24} className="text-primary" />,
              bg: "bg-purple-50",
            },
            {
              label: "Total Sessions",
              value: totalSessions,
              icon: <Brain size={24} className="text-primary" />,
              bg: "bg-blue-50",
            },
            {
              label: "Memories Stored",
              value: totalMemories,
              icon: <Heart size={24} className="text-primary" />,
              bg: "bg-pink-50",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4"
            >
              <div className={`${stat.bg} p-3 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-dark">{stat.value}</p>
                <p className="text-muted text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Patient Cards */}
        {loading ? (
          <div className="flex items-center justify-center mt-20 gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center mt-20">
            <Brain size={56} className="text-primary mx-auto mb-4 opacity-30" />
            <p className="text-dark text-xl font-semibold">No patients yet</p>
            <p className="text-muted text-sm mt-2 mb-6">
              Add your first patient to start the care journey
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
            >
              Add First Patient
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-dark mb-4">
              Your Patients ({patients.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => navigate(`/patient/${patient._id}`)}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-primary"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-soft p-3 rounded-xl">
                      <User size={28} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark text-lg">
                        {patient.name}
                      </h3>
                      <p className="text-muted text-sm">Age: {patient.age}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${typeColor[patient.dementiaType]}`}
                    >
                      {patient.dementiaType}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${stageColor[patient.dementiaStage]}`}
                    >
                      {patient.dementiaStage} stage
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted capitalize">
                      🌐 {patient.language}
                    </span>
                    <span className="text-xs text-primary font-medium">
                      View Profile →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Patient Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-dark mb-6">Add New Patient</h2>
            <form onSubmit={handleAddPatient} className="flex flex-col gap-4">

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Dementia Type
                </label>
                <select
                  name="dementiaType"
                  value={form.dementiaType}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
                >
                  <option value="primary">Primary (Alzheimer's, Lewy Body etc.)</option>
                  <option value="secondary">Secondary (Infection, Alcohol related)</option>
                  <option value="reversible">Reversible (Vitamin deficiency etc.)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Dementia Stage
                </label>
                <select
                  name="dementiaStage"
                  value={form.dementiaStage}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark mb-1 block">
                  Preferred Language
                </label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
                >
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                  <option value="marathi">Marathi</option>
                  <option value="gujarati">Gujarati</option>
                  <option value="punjabi">Punjabi</option>
                  <option value="bengali">Bengali</option>
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-gray-200 text-muted py-3 rounded-xl font-medium hover:border-primary hover:text-primary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                >
                  Add Patient
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard