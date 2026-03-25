import { useNavigate, useLocation } from "react-router-dom"
import { Brain, LayoutDashboard, Users, LogOut, Activity } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <nav className="bg-white shadow-sm px-10 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
        <Brain className="text-primary" size={26} />
        <span className="text-xl font-bold text-primary">GriefBridge</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">Welcome, <strong>{user?.name}</strong></span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted hover:text-red-500 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar