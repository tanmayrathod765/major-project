import { useNavigate, useLocation } from "react-router-dom"
import { Brain, LayoutDashboard, LogOut, Stethoscope } from "lucide-react"
import { useAuth } from "../context/AuthContext"
const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/")
  }


const links = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/dashboard" },
  { icon: <Stethoscope size={20} />, label: "Doctor View", path: "/doctor" },
]

  return (
    <div className="w-64 min-h-screen bg-white shadow-sm flex flex-col justify-between px-4 py-6">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 mb-10 px-2">
          <Brain className="text-primary" size={26} />
          <span className="text-xl font-bold text-primary">GriefBridge</span>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <button
              key={i}
              onClick={() => navigate(link.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                ${location.pathname === link.path
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-soft hover:text-primary"
                }`}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* User + Logout */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-dark px-2 mb-1">{user?.name}</p>
        <p className="text-xs text-muted px-2 mb-4">{user?.role}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-red-50 hover:text-red-500 transition w-full"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar