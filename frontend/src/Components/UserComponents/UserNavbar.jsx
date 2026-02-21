import { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MdKeyboardArrowDown,
  MdPerson,
  MdLogout,
  MdBook,
  MdMenu,
} from "react-icons/md";
import ThemeToggle from "../AdminComponents/ThemeToggle";
import { useAuth } from "../../Context/AuthContext";
import { sidebarState } from "../../utils/sidebarState";


const UserNavbar = () => {
  const [showUser, setShowUser] = useState(false);
  const { user, logout } = useAuth();
  const userRef = useRef(null);

  const handleProtectedNav = (e) => {
    if (!user) {
      e.preventDefault();
      toast('Please log in to continue.', {
        icon: '⚠️',
      });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 lg:px-20 px-4 md:px-5 gap-4 md:gap-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => sidebarState.toggleSidebar()}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 bg-transparent border-none cursor-pointer"
      >
        <MdMenu className="text-xl" />
      </button>

      {/* Left side - Brand Name */}
      <Link to="/" className="hidden md:flex items-center gap-2">
        <img src="/AgroFundLogo.png" alt="AgroFund Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
        <span className="text-base font-bold font-['Sora']">
          <span className="text-slate-800 dark:text-white">Agro</span><span className="text-emerald-600 dark:text-emerald-400">Fund</span>
        </span>
      </Link>

      {/* Middle - Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
        <NavLink
          to="/loan"
          onClick={handleProtectedNav}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] transition-all duration-150 ${
              isActive
                ? ' text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`
          }
        >
          Loans
        </NavLink>
        <NavLink
          to="/courses"
          onClick={handleProtectedNav}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] transition-all duration-150 ${
              isActive
                ? ' text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`
          }
        >
          Courses
        </NavLink>
        <NavLink
          to="/loan-plans"
          onClick={handleProtectedNav}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] transition-all duration-150 ${
              isActive
                ? ' text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`
          }
        >
          Plans
        </NavLink>
      </nav>

      {/* Right side - Theme toggle + Auth/User */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />

        <div className="hidden md:block w-px h-6 bg-slate-200/90 dark:bg-slate-700" />

        {/* Not logged in → Login + Signup buttons */}
        {!user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-md text-sm font-medium font-['Sora'] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-1.5 rounded-md text-sm font-medium font-['Sora'] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-150"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          /* Logged in → User dropdown */
          <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-linear-to-br from-emerald-500 to-emerald-400 text-white font-['Sora']">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold leading-tight text-slate-700 dark:text-slate-300 font-['Sora']">
                {user?.name || 'User'}
              </p>
              <p className="text-xs leading-tight text-slate-500 dark:text-slate-400 font-['Sora']">
                Farmer
              </p>
            </div>
            <span
              className={`text-slate-500 dark:text-slate-400 text-lg flex transition-transform duration-200 ${
                showUser ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <MdKeyboardArrowDown />
            </span>
          </button>

          {/* User dropdown */}
          {showUser && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150 w-64 top-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg z-50">
              {/* Profile info */}
              <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-['Sora'] truncate">
                  {user?.name || 'User'}
                </p>
                <p
                  className="text-xs mt-0.5 text-slate-500 dark:text-slate-400 font-['Sora'] truncate"
                  title={user?.email || 'email@example.com'}
                >
                  {user?.email || 'email@example.com'}
                </p>
              </div>

              {/* Menu items */}
              <button className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left">
                <MdPerson className="text-base text-slate-500 dark:text-slate-400" />
                My Profile
              </button>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <Link
                to="/my-courses"
                onClick={() => setShowUser(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdBook className="text-base text-slate-500 dark:text-slate-400" />
                My Courses
              </Link>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-red-500 dark:text-red-400 text-[13px] font-['Sora'] text-left"
              >
                <MdLogout className="text-base" />
                Logout
              </button>
            </div>
          )}
        </div>
        )} {/* end auth ternary */}
      </div>
    </header>
  );
};

export default UserNavbar;