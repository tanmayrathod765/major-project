import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { Brain, Send, Mic, MicOff, Volume2, Heart } from "lucide-react"
import Sidebar from "../components/Sidebar"
import api from "../utils/api"
import toast from "react-hot-toast"

const AICompanion = () => {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    fetchPatient()
    // Welcome message
    setMessages([{
      role: "assistant",
      content: "Namaste! Main aapka dost hoon. Aaj kaisa feel kar rahe hain aap? 😊",
      timestamp: new Date()
    }])
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/patients/${id}`)
      setPatient(res.data)
    } catch {}
  }

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage) return

    const newMessages = [...messages, {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const conversationHistory = newMessages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await api.post(`/companion/${id}/chat`, {
        message: userMessage,
        conversationHistory: conversationHistory.slice(0, -1),
      })

      const assistantMessage = {
        role: "assistant",
        content: res.data.reply,
        timestamp: new Date()
      }

      setMessages([...newMessages, assistantMessage])

      // Auto speak response
      speakText(res.data.reply)

    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Main yahaan hoon aapke saath. 💜",
        timestamp: new Date()
      }])
    }
    setLoading(false)
  }

  const speakText = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "hi-IN"
    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

const startListening = () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    toast.error("Chrome browser use karo — mic support ke liye")
    return
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  let finalTranscript = ""
  
  recognition.lang = "hi-IN"
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    setIsListening(true)
    finalTranscript = ""
    toast("🎤 Sun raha hoon...", { duration: 3000 })
  }

  recognition.onresult = (e) => {
    let interimTranscript = ""
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript
      if (e.results[i].isFinal) {
        finalTranscript += transcript + " "
      } else {
        interimTranscript += transcript
      }
    }
    setInput(finalTranscript + interimTranscript)
  }

  recognition.onerror = (e) => {
    setIsListening(false)
    if (e.error === "no-speech") {
      toast.error("Koi awaaz nahi aayi — dobara try karo")
    } else if (e.error === "not-allowed") {
      toast.error("Mic permission do — browser settings mein")
    } else {
      toast.error("Mic error: " + e.error)
    }
  }

  recognition.onend = () => {
    setIsListening(false)
    // Auto send if something was captured
    if (finalTranscript.trim()) {
      setTimeout(() => {
        sendMessage(finalTranscript.trim())
      }, 200)
    }
  }

  recognitionRef.current = recognition
  recognition.start()
}
  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const QUICK_PHRASES = [
    "Mujhe apna ghar yaad aa raha hai",
    "Aaj kaafi achha lag raha hai",
    "Mujhe bhook lag rahi hai",
    "Main thaka hua hoon",
    "Koi gana sunao",
    "Mera parivaar kahan hai?",
  ]

  return (
    <div className="flex min-h-screen bg-soft">
      <Sidebar />

      <div className="flex-1 flex flex-col p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary p-3 rounded-2xl">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">AI Companion</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-muted text-sm">
                Talking with {patient?.name || "Patient"}
              </p>
              {isSpeaking && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Volume2 size={10} /> Speaking...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
          <p className="text-sm text-muted">
            🧠 This AI knows <strong>{patient?.name}</strong>'s memories, triggers, and life story.
            It speaks gently and personally — like a friend who has always been there.
          </p>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 mb-4 overflow-y-auto min-h-96 max-h-96">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="bg-primary p-2 rounded-full h-8 w-8 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Heart size={14} className="text-white" />
                </div>
              )}

              <div
                className={`max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-soft text-dark rounded-tl-none"}`}
              >
                {msg.content}
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-200" : "text-muted"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {msg.role === "assistant" && (
                <button
                  onClick={() => speakText(msg.content)}
                  className="ml-2 mt-1 p-1 text-muted hover:text-primary transition"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-primary p-2 rounded-full h-8 w-8 flex items-center justify-center mr-2 flex-shrink-0">
                <Heart size={14} className="text-white" />
              </div>
              <div className="bg-soft px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Phrases */}
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_PHRASES.map((phrase, i) => (
            <button
              key={i}
              onClick={() => sendMessage(phrase)}
              className="text-xs bg-white border border-gray-200 text-muted px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-4 rounded-xl transition flex-shrink-0 ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white border-2 border-gray-200 text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type or use mic to speak..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-dark focus:outline-none focus:border-primary transition"
          />


          

          

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-4 bg-primary text-white rounded-xl hover:bg-opacity-90 transition disabled:opacity-40 flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </div>

        

        <p className="text-center text-xs text-muted mt-3">
          AI speaks in Hindi by default • Click 🔊 to replay any message
        </p>
      </div>
    </div>
  )
}

export default AICompanion