import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import ToasterConfig from "./Components/SharedComponents/ToasterConfig"
import Navbar from "./Components/AdminComponents/Navbar"
import Sidebar from "./Components/AdminComponents/Sidebar"
import Dashboard from "./Pages/AdminPages/Dashboard"
import Course from "./Pages/AdminPages/Course"
import Users from "./Pages/AdminPages/Users"
import Requests from "./Pages/AdminPages/Requests"
import Login from "./Pages/SharedPages/Login"
import Signup from "./Pages/SharedPages/Signup"
import ProtectedRoute from "./Routes/ProtectedRoute"
import { sidebarState } from "./utils/sidebarState"

const App = () => {
  const [state, setState] = useState(sidebarState.getState())
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = sidebarState.subscribe(setState)
    return unsubscribe
  }, [])

  // Check if current route is an auth page (login/signup)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Toast Notifications */}
      <ToasterConfig />
      
      {!isAuthPage && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      
      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${!isAuthPage ? `pt-16 ${state.collapsed ? 'md:ml-18' : 'md:ml-60'}` : ''}`}>
        <Routes>
          {/* Default Route - Redirect to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App