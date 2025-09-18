import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { Registration } from './pages/Registration'
import { ConversationalRegistration } from './pages/ConversationalRegistration'
import { Checkin } from './pages/Checkin'
import { QRVerification } from './pages/QRVerification'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/chat-register" element={<ConversationalRegistration />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/qr-verification" element={<QRVerification />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
