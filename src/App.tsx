import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MyRecords from './pages/MyRecords'
import NewRecord from './pages/NewRecord'
import EditRecord from './pages/EditRecord'
import Summary from './pages/Summary'
import TimerPage from './pages/TimerPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/my-records" element={<MyRecords />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="/my-records/new" element={<NewRecord />} />
                <Route path="/my-records/:id/edit" element={<EditRecord />} />
                <Route path="/timer" element={<TimerPage />} />
              </Route>
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
