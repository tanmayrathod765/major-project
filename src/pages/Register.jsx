import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Brain } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"

const Register = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "family" })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/auth/register", form)
      login(res.data.user, res.data.token)
      toast.success("Welcome to GriefBridge " + res.data.user.name)
      navigate("/dashboard")
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-soft flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Brain className="text-primary" size={28} />
          <span className="text-2xl font-bold text-primary">GriefBridge</span>
        </div>

        <h2 className="text-2xl font-bold text-dark text-center mb-2">Create Account</h2>
        <p className="text-muted text-center mb-8">Start your care journey today</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">I am a</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
            >
              <option value="family">Family Member</option>
              <option value="caregiver">Professional Caregiver</option>
              <option value="doctor">Doctor / Neurologist</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-opacity-90 transition mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register