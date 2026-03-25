import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import {
  Image, Mic, Video, FileText,
  Upload, Trash2, Eye, Plus
} from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]

const typeConfig = {
  photo: { icon: <Image size={20} />, color: "bg-purple-100 text-purple-700", accept: { "image/*": [] } },
  audio: { icon: <Mic size={20} />, color: "bg-blue-100 text-blue-700", accept: { "audio/*": [] } },
  video: { icon: <Video size={20} />, color: "bg-pink-100 text-pink-700", accept: { "video/*": [] } },
  letter: { icon: <FileText size={20} />, color: "bg-amber-100 text-amber-700", accept: { "image/*": [], "application/pdf": [] } },
}

const UploadZone = ({ type, onUpload }) => {
  const [tags, setTags] = useState("")
  const [decade, setDecade] = useState("1980s")
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: typeConfig[type].accept,
    maxFiles: 1,
    onDrop: (accepted) => setFile(accepted[0]),
  })

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first")
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    formData.append("tags", tags)
    formData.append("decade", decade)
    const success = await onUpload(formData)
    if (success) {
      setFile(null)
      setTags("")
    }
    setUploading(false)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className={`p-2 rounded-lg ${typeConfig[type].color}`}>
          {typeConfig[type].icon}
        </span>
        <h3 className="font-semibold text-dark capitalize">{type}</h3>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${isDragActive ? "border-primary bg-soft" : "border-gray-200 hover:border-primary"}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div>
            <p className="text-primary font-medium text-sm">{file.name}</p>
            <p className="text-muted text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <Upload size={24} className="text-muted mx-auto mb-2" />
            <p className="text-muted text-sm">
              {isDragActive ? "Drop here!" : "Drag & drop or click to upload"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <select
          value={decade}
          onChange={(e) => setDecade(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-dark focus:outline-none focus:border-primary"
        >
          {DECADES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-dark focus:outline-none focus:border-primary"
        />

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-primary text-white py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  )
}

const MemoryCard = ({ memory, onDelete }) => {
  const BASE_URL = "http://localhost:5000"

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      {/* Preview */}
      <div className="bg-soft rounded-xl h-36 mb-4 flex items-center justify-center overflow-hidden">
        {memory.type === "photo" && memory.filePath ? (
          <img
            src={`${BASE_URL}/${memory.filePath}`}
            alt="memory"
            className="w-full h-full object-cover rounded-xl"
          />
        ) : memory.type === "audio" ? (
          <audio controls className="w-full px-2">
            <source src={`${BASE_URL}/${memory.filePath}`} />
          </audio>
        ) : memory.type === "video" ? (
          <video controls className="w-full h-full rounded-xl">
            <source src={`${BASE_URL}/${memory.filePath}`} />
          </video>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {typeConfig[memory.type]?.icon}
            <p className="text-muted text-xs">
              {memory.type === "letter" ? "Letter uploaded" : memory.type}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeConfig[memory.type]?.color}`}>
          {memory.type}
        </span>
        <span className="text-xs text-muted">{memory.decade}</span>
      </div>

      {/* Tags */}
      {memory.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {memory.tags.map((tag, i) => (
            <span key={i} className="text-xs bg-soft text-primary px-2 py-1 rounded-full">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Transcript */}
      {memory.transcript && (
        <p className="text-xs text-muted mb-3 line-clamp-2">{memory.transcript}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDelete(memory._id)}
          className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 border border-red-100 py-2 rounded-xl hover:bg-red-50 transition"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  )
}

const MemoryVault = () => {
  const { id } = useParams()
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchMemories()
  }, [id])

  const fetchMemories = async () => {
    try {
      const res = await api.get(`/memories/${id}`)
      setMemories(res.data)
    } catch {
      toast.error("Failed to load memories")
    }
    setLoading(false)
  }

  const handleUpload = async (formData) => {
    try {
      const res = await api.post(`/memories/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setMemories([res.data, ...memories])
      toast.success("Memory uploaded!")
      return true
    } catch {
      toast.error("Upload failed")
      return false
    }
  }

  const handleDelete = async (memoryId) => {
    try {
      await api.delete(`/memories/${memoryId}`)
      setMemories(memories.filter((m) => m._id !== memoryId))
      toast.success("Memory deleted")
    } catch {
      toast.error("Delete failed")
    }
  }

  const filtered = filter === "all"
    ? memories
    : memories.filter((m) => m.type === filter)

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark">Memory Vault</h1>
            <p className="text-muted mt-1">{memories.length} memories stored</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
          >
            <Plus size={20} />
            Add Memory
          </button>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-dark mb-4">Upload New Memory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["photo", "audio", "video", "letter"].map((type) => (
                <UploadZone key={type} type={type} onUpload={handleUpload} />
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "photo", "audio", "video", "letter"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize
                ${filter === f
                  ? "bg-primary text-white"
                  : "bg-white text-muted hover:text-primary"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Memory Grid */}
        {loading ? (
          <p className="text-muted text-center mt-20">Loading memories...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-20">
            <Upload size={48} className="text-primary mx-auto mb-4 opacity-40" />
            <p className="text-muted text-lg">No memories yet</p>
            <p className="text-muted text-sm mt-1">Click "Add Memory" to upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((memory) => (
              <MemoryCard key={memory._id} memory={memory} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryVault
