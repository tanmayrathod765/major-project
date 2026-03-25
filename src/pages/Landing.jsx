import { useNavigate } from "react-router-dom"
import { Brain, Heart, Music, Star } from "lucide-react"

const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-soft">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="text-primary" size={28} />
          <span className="text-2xl font-bold text-primary">GriefBridge</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 text-primary font-medium border-2 border-primary rounded-xl hover:bg-primary hover:text-white transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2 bg-primary text-white font-medium rounded-xl hover:bg-opacity-90 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-24">
        <span className="bg-purple-100 text-primary text-sm font-medium px-4 py-1 rounded-full mb-6">
          AI Powered Dementia Care
        </span>
        <h1 className="text-5xl font-bold text-dark max-w-3xl leading-tight">
          Bridging the Silence Between
          <span className="text-primary"> Families </span>
          and Their Loved Ones
        </h1>
        <p className="text-muted text-lg mt-6 max-w-2xl">
          GriefBridge uses AI to help families communicate meaningfully with dementia patients —
          turning silent visits into moments of genuine human connection.
        </p>
        <div className="flex gap-4 mt-10">
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 transition text-lg"
          >
            Start For Free
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition text-lg"
          >
            Login
          </button>
        </div>
      </div>

      {/* Stats */}
<div className="flex justify-center gap-16 py-12 bg-white">
  {[
    { value: "55M+", label: "Dementia patients worldwide" },
    { value: "19", label: "AI-powered features" },
    { value: "100%", label: "Free to use" },
    { value: "3", label: "Dementia types supported" },
  ].map((stat, i) => (
    <div key={i} className="text-center">
      <p className="text-4xl font-bold text-primary">{stat.value}</p>
      <p className="text-muted text-sm mt-1">{stat.label}</p>
    </div>
  ))}
</div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-10 pb-20">
        {[
          { icon: <Brain size={32} className="text-primary" />, title: "Memory Portrait", desc: "AI builds a personal knowledge graph of your loved one's entire life" },
          { icon: <Heart size={32} className="text-primary" />, title: "Visit Companion", desc: "Real-time AI prompts during visits — never run out of things to say" },
          { icon: <Music size={32} className="text-primary" />, title: "Music Therapy", desc: "Personalized songs mapped to life decades trigger deep memories" },
          { icon: <Star size={32} className="text-primary" />, title: "Ghost Voice", desc: "Preserve your loved one's voice forever using AI voice cloning" },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold text-dark mb-2">{f.title}</h3>
            <p className="text-muted text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-10 text-muted text-sm">
        Made with ❤️ for 55 million dementia families worldwide
      </div>

    </div>
  )
}

export default Landing