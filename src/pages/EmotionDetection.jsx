import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { Camera, CameraOff, Smile, AlertCircle, Sparkles, Activity } from "lucide-react"
import Sidebar from "../components/Sidebar"
import toast from "react-hot-toast"

const AI_BASE_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000"

const EMOTION_CONFIG = {
  happy: { emoji: "😊", color: "text-green-600", bg: "bg-green-100", label: "Happy" },
  sad: { emoji: "😢", color: "text-blue-600", bg: "bg-blue-100", label: "Sad" },
  angry: { emoji: "😠", color: "text-red-600", bg: "bg-red-100", label: "Angry" },
  fear: { emoji: "😨", color: "text-purple-600", bg: "bg-purple-100", label: "Fearful" },
  surprise: { emoji: "😮", color: "text-yellow-600", bg: "bg-yellow-100", label: "Surprised" },
  disgust: { emoji: "😒", color: "text-orange-600", bg: "bg-orange-100", label: "Uncomfortable" },
  neutral: { emoji: "😐", color: "text-gray-600", bg: "bg-gray-100", label: "Neutral" },
}

const EmotionDetection = () => {
  const { id } = useParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [autoDetect, setAutoDetect] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => {
      stopCamera()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (autoDetect && cameraOn) {
      intervalRef.current = setInterval(() => {
        captureAndDetect()
      }, 5000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoDetect, cameraOn])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraOn(true)
      toast.success("Camera started!")
    } catch (e) {
      toast.error("Camera access denied — please allow camera permission")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraOn(false)
    setAutoDetect(false)
    setResult(null)
  }

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setLoading(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0)

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const formData = new FormData()
        formData.append("file", blob, "capture.jpg")

        const token = localStorage.getItem("token")
        const res = await fetch(`${AI_BASE_URL}/ai/detect-emotion`, {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (data.success) {
          setResult(data)
          setHistory(prev => [{
            ...data,
            timestamp: new Date().toLocaleTimeString()
          }, ...prev.slice(0, 9)])
        }
        setLoading(false)
      }, "image/jpeg", 0.8)

    } catch (e) {
      toast.error("Detection failed: " + e.message)
      setLoading(false)
    }
  }

  const emotion = result ? EMOTION_CONFIG[result.dominant_emotion] || EMOTION_CONFIG.neutral : null

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">Emotion Detection</h1>
          <p className="text-muted mt-1">
            Real-time AI emotion monitoring during patient visits
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Camera Panel */}
          <div className="flex flex-col gap-4">

            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex gap-2">
                <Sparkles size={18} className="text-primary mt-0.5" />
                <p className="text-sm text-muted">
                  Point camera at the patient during a visit.
                  AI detects emotions in real-time and suggests
                  the best care action.
                </p>
              </div>
            </div>

            {/* Camera View */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative bg-dark aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraOn && (
                  <div className="text-center text-white">
                    <CameraOff size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm opacity-70">Camera is off</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Analyzing...</p>
                    </div>
                  </div>
                )}

                {/* Live indicator */}
                {autoDetect && cameraOn && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  {!cameraOn ? (
                    <button
                      onClick={startCamera}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
                    >
                      <Camera size={18} />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                    >
                      <CameraOff size={18} />
                      Stop Camera
                    </button>
                  )}

                  <button
                    onClick={captureAndDetect}
                    disabled={!cameraOn || loading}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary py-3 rounded-xl font-medium hover:bg-primary hover:text-white transition disabled:opacity-40"
                  >
                    <Smile size={18} />
                    Detect Now
                  </button>
                </div>

                {/* Auto Detect Toggle */}
                {cameraOn && (
                  <div className="flex items-center justify-between bg-soft rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-dark">Auto Detect</p>
                      <p className="text-xs text-muted">Detects every 5 seconds</p>
                    </div>
                    <button
                      onClick={() => setAutoDetect(!autoDetect)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        autoDetect ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        autoDetect ? "left-7" : "left-1"
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-4">

            {/* Current Emotion */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-dark mb-4">Current Emotion</h2>

              {!result ? (
                <div className="text-center py-8">
                  <Activity size={40} className="text-primary mx-auto mb-3 opacity-30" />
                  <p className="text-muted text-sm">Start camera and detect emotion</p>
                </div>
              ) : (
                <div>
                  {/* Main Emotion */}
                  <div className={`${emotion?.bg} rounded-2xl p-5 text-center mb-4`}>
                    <div className="text-5xl mb-2">{emotion?.emoji}</div>
                    <p className={`text-xl font-bold ${emotion?.color}`}>
                      {emotion?.label}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {result.emotions[result.dominant_emotion]?.toFixed(1)}% confidence
                    </p>
                  </div>

                  {/* All Emotions Bar */}
                  <div className="flex flex-col gap-2 mb-4">
                    {Object.entries(result.emotions || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([emotion, score]) => (
                        <div key={emotion} className="flex items-center gap-2">
                          <span className="text-xs text-muted w-16 capitalize">{emotion}</span>
                          <div className="flex-1 bg-soft rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted w-10 text-right">
                            {score.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* AI Suggestion */}
                  <div className={`rounded-xl p-4 ${result.is_positive ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                    <div className="flex gap-2">
                      <Sparkles size={16} className={result.is_positive ? "text-green-600" : "text-yellow-600"} />
                      <p className="text-sm text-dark leading-relaxed">
                        {result.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detection History */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex-1">
              <h2 className="font-semibold text-dark mb-4">
                Session History ({history.length})
              </h2>

              {history.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted text-sm">No detections yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {history.map((h, i) => {
                    const cfg = EMOTION_CONFIG[h.dominant_emotion] || EMOTION_CONFIG.neutral
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-soft rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cfg.emoji}</span>
                          <div>
                            <p className="text-sm font-medium text-dark capitalize">
                              {cfg.label}
                            </p>
                            <p className="text-xs text-muted">{h.timestamp}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {h.emotions[h.dominant_emotion]?.toFixed(0)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmotionDetection