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
import Tickets from "./Pages/AdminPages/Tickets"
import RepayPlans from "./Pages/AdminPages/RepayPlans"
import LoanRepayments from "./Pages/AdminPages/LoanRepayments"
import Login from "./Pages/SharedPages/Login"
import Signup from "./Pages/SharedPages/Signup"
import LandingPage from "./Pages/UserPages/LandingPage"
import CoursesPage from "./Pages/UserPages/CoursesPage"
import CoursePageUser from "./Pages/UserPages/CoursePageUser"
import MyCourses from "./Pages/UserPages/MyCourses"
import LoanPage from "./Pages/LoanPages/LoanPage"
import MyLoansPage from "./Pages/LoanPages/MyLoansPage"
import LoanCalculatorPage from "./Pages/LoanPages/LoanCalculatorPage"
import LoanRepaymentsPage from "./Pages/LoanPages/LoanRepaymentsPage"
import ProtectedRoute from "./Routes/ProtectedRoute"
import { sidebarState } from "./utils/sidebarState"
import UserLoanPlans from "./Pages/UserPages/UserLoanPlans"
import WeatherPage from "./Pages/UserPages/WeatherPage"
import ProfilePage from "./Pages/UserPages/ProfilePage"
import DataVerificationPage from "./Pages/UserPages/DataVerificationPage"
import SupportTicketPage from "./Pages/UserPages/SupportTicketPage"
import MySupportTicketsPage from "./Pages/UserPages/MySupportTicketsPage"
import PlatformFeedbackPage from "./Pages/UserPages/PlatformFeedbackPage"
import PlatformRatingPage from "./Pages/UserPages/PlatformRatingPage"
import {
  AccountVerificationSection,
  PaymentInfoSection,
  LocationValidationSection,
  TrainingEngagementSection,
} from "./Pages/UserPages/DataVerificationSections"

// Renders landing page for everyone, but bumps admins to their dashboard
const RootRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (location.state?.fromAdminLogout) return <LandingPage />;
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
  const isUserPage = location.pathname === '/' || location.pathname.startsWith('/landing') || location.pathname.startsWith('/courses') || location.pathname.startsWith('/my-courses') || location.pathname.startsWith('/my-loans') || location.pathname.startsWith('/loan') || location.pathname.startsWith('/weather') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/data-verification') || location.pathname.match(/^\/course\/[^/]+$/)

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
          ? 'pt-16 px-2 lg:px-10' 
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
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route
            path="/data-verification"
            element={
              <ProtectedRoute>
                <DataVerificationPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="account-verification" replace />} />
            <Route path="account-verification" element={<AccountVerificationSection />} />
            <Route path="payment-info" element={<PaymentInfoSection />} />
            <Route path="location-validation" element={<LocationValidationSection />} />
            <Route path="training-engagement" element={<TrainingEngagementSection />} />
          </Route>
          <Route path="/loan" element={<LoanPage />} />
          <Route path="/loan-calculator" element={<LoanCalculatorPage />} />
          <Route path="/my-loans" element={<ProtectedRoute allowedRoles={['farmer']}><MyLoansPage /></ProtectedRoute>} />
          <Route path="/loan-repayments" element={<ProtectedRoute allowedRoles={['farmer']}><LoanRepaymentsPage /></ProtectedRoute>} />
          <Route path="/loan-plans" element={<ProtectedRoute allowedRoles={['farmer']}><UserLoanPlans /></ProtectedRoute>} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route
            path="/support-ticket/my-tickets"
            element={
              <ProtectedRoute>
                <MySupportTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support-ticket/feedback"
            element={
              <ProtectedRoute>
                <PlatformFeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support-ticket"
            element={
              <ProtectedRoute>
                <SupportTicketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform-rating"
            element={
              <ProtectedRoute>
                <PlatformRatingPage />
              </ProtectedRoute>
            }
          />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<Navigate to="/admin/tickets" replace />} />
          <Route path="/admin/repayments" element={<ProtectedRoute><RepayPlans /></ProtectedRoute>} />
          <Route path="/admin/loan-repayments" element={<ProtectedRoute><LoanRepayments /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
