import { useState } from "react"
import { useParams } from "react-router-dom"
import { Music, Search, Play, ExternalLink } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]

const MusicTherapy = () => {
  const { id } = useParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDecade, setSelectedDecade] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [playing, setPlaying] = useState(null)

  const searchByDecade = async (decade) => {
    setLoading(true)
    setSelectedDecade(decade)
    setPlaying(null)
    try {
      const res = await api.get(`/music/search/${decade}`)
      setVideos(res.data.videos)
    } catch {
      toast.error("Failed to load music")
    }
    setLoading(false)
  }

  const searchByQuery = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setPlaying(null)
    try {
      const res = await api.get(`/music/search?query=${encodeURIComponent(searchQuery)}`)
      setVideos(res.data.videos)
    } catch {
      toast.error("Search failed")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Music Therapy</h1>
          <p className="text-muted mt-1">Play familiar songs to trigger happy memories</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchByQuery()}
              placeholder="Search a specific song or artist..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary"
            />
            <button
              onClick={searchByQuery}
              className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
            >
              <Search size={18} />
              Search
            </button>
          </div>
        </div>

        {/* Decade Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-dark mb-3">Browse by Decade</h2>
          <div className="flex flex-wrap gap-3">
            {DECADES.map((decade) => (
              <button
                key={decade}
                onClick={() => searchByDecade(decade)}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition
                  ${selectedDecade === decade
                    ? "bg-primary text-white"
                    : "bg-white text-muted hover:text-primary hover:border-primary border border-gray-200"}`}
              >
                {decade}
              </button>
            ))}
          </div>
        </div>

        {/* Video Player */}
        {playing && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
                title="Music Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center mt-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted">Loading songs...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center mt-20">
            <Music size={48} className="text-primary mx-auto mb-4 opacity-40" />
            <p className="text-muted text-lg">Select a decade or search for a song</p>
            <p className="text-muted text-sm mt-1">Music therapy helps trigger deep memories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="relative group cursor-pointer" onClick={() => setPlaying(video.id)}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <div className="bg-primary p-3 rounded-full">
                      <Play size={24} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-dark text-sm line-clamp-2 mb-1">{video.title}</p>
                  <p className="text-muted text-xs mb-3">{video.channel}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPlaying(video.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-primary text-white py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition"
                    >
                      <Play size={14} />
                      Play
                    </button>
                    <a
                      href={`https://youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center p-2 border border-gray-200 rounded-xl hover:border-primary transition"
                    >
                      <ExternalLink size={14} className="text-muted" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicTherapy