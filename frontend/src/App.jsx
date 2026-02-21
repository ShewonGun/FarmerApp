import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "./Context/AuthContext"
import ToasterConfig from "./Components/SharedComponents/ToasterConfig"
import Navbar from "./Components/AdminComponents/Navbar"
import Sidebar from "./Components/AdminComponents/Sidebar"
import UserNavbar from "./Components/UserComponents/UserNavbar"
import UserSidebar from "./Components/UserComponents/UserSidebar"
import Dashboard from "./Pages/AdminPages/Dashboard"
import Course from "./Pages/AdminPages/Course"
import Users from "./Pages/AdminPages/Users"
import Requests from "./Pages/AdminPages/Requests"
import RepayPlans from "./Pages/AdminPages/RepayPlans"
import Login from "./Pages/SharedPages/Login"
import Signup from "./Pages/SharedPages/Signup"
import LandingPage from "./Pages/UserPages/LandingPage"
import CoursesPage from "./Pages/UserPages/CoursesPage"
import CoursePageUser from "./Pages/UserPages/CoursePageUser"
import MyCourses from "./Pages/UserPages/MyCourses"
import LoanPage from "./Pages/UserPages/LoanPage"
import ProtectedRoute from "./Routes/ProtectedRoute"
import { sidebarState } from "./utils/sidebarState"
import UserLoanPlans from "./Pages/UserPages/UserLoanPlans"

// Renders landing page for everyone, but bumps admins to their dashboard
const RootRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <LandingPage />;
};

const App = () => {
  const [state, setState] = useState(sidebarState.getState())
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = sidebarState.subscribe(setState)
    return unsubscribe
  }, [])

  // Check if current route is an auth page (login/signup)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  
  // Check if current route is a user/farmer page
  const isUserPage = location.pathname === '/' || location.pathname.startsWith('/landing') || location.pathname.startsWith('/courses') || location.pathname.startsWith('/my-courses') || location.pathname.startsWith('/loan') || location.pathname.match(/^\/course\/[^/]+$/)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Toast Notifications */}
      <ToasterConfig />
      
      {!isAuthPage && !isUserPage && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      
      {isUserPage && (
        <>
          <UserNavbar />
          <UserSidebar />
        </>
      )}
      
      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${
        !isAuthPage && !isUserPage 
          ? `pt-16 ${state.collapsed ? 'md:ml-18' : 'md:ml-60'}` 
          : isUserPage 
          ? 'pt-16 px-4 lg:px-10' 
          : ''
      }`}>
        <Routes>
          {/* Default Route - Landing page (public) */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<RootRoute />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected User/Farmer Routes */}
          <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><CoursePageUser /></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
          <Route path="/loan" element={<ProtectedRoute><LoanPage /></ProtectedRoute>} />
          <Route path="/loan-plans" element={<ProtectedRoute><UserLoanPlans /></ProtectedRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="/admin/repayments" element={<ProtectedRoute><RepayPlans /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App