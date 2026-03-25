import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import MemoryVault from "./pages/MemoryVault"
import VisitCompanion from "./pages/VisitCompanion"
import MusicTherapy from "./pages/MusicTherapy"
import SparkScore from "./pages/SparkScore"
import GhostVoice from "./pages/GhostVoice"
import LastLetter from "./pages/LastLetter"
import LifeStoryBook from "./pages/LifeStoryBook"
import PatientProfile from "./pages/PatientProfile"
import CaregiverHub from "./pages/CaregiverHub"
import MMSEAssessment from "./pages/MMSEAssessment"
import DoctorDashboard from "./pages/DoctorDashboard"
import CognitiveGames from "./pages/CognitiveGames"
import EmotionDetection from "./pages/EmotionDetection"
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/patient/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
          <Route path="/patient/:id/vault" element={<ProtectedRoute><MemoryVault /></ProtectedRoute>} />
          <Route path="/patient/:id/visit" element={<ProtectedRoute><VisitCompanion /></ProtectedRoute>} />
          <Route path="/patient/:id/music" element={<ProtectedRoute><MusicTherapy /></ProtectedRoute>} />
          <Route path="/patient/:id/spark" element={<ProtectedRoute><SparkScore /></ProtectedRoute>} />
          <Route path="/patient/:id/ghost-voice" element={<ProtectedRoute><GhostVoice /></ProtectedRoute>} />
          <Route path="/patient/:id/last-letter" element={<ProtectedRoute><LastLetter /></ProtectedRoute>} />
          <Route path="/patient/:id/life-story" element={<ProtectedRoute><LifeStoryBook /></ProtectedRoute>} />
          <Route path="/patient/:id/caregiver-hub" element={<ProtectedRoute><CaregiverHub /></ProtectedRoute>} />
          <Route path="/patient/:id/mmse" element={<ProtectedRoute><MMSEAssessment /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/patient/:id/cognitive-games" element={<ProtectedRoute><CognitiveGames /></ProtectedRoute>} />
          <Route path="/patient/:id/emotion" element={<ProtectedRoute><EmotionDetection /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App