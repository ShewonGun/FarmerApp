import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  MdMenu,
  MdChevronRight,
  MdKeyboardArrowDown,
  MdPerson,
  MdLogout,
} from "react-icons/md";
import { sidebarState } from "../../utils/sidebarState";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../Context/AuthContext";

function useBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  return segments.length === 0
    ? [{ label: "Dashboard", path: "/admin" }]
    : [
        { label: "Dashboard", path: "/admin" },
        ...segments.map((seg, i) => ({
          label: seg.charAt(0).toUpperCase() + seg.slice(1),
          path: "/admin/" + segments.slice(0, i + 1).join("/"),
        })),
      ];
}
export default function Navbar({ collapsed, toggleSidebar }) {
  const breadcrumb = useBreadcrumb();
  const [showUser, setShowUser] = useState(false);
  const [state, setState] = useState(sidebarState.getState());
  const { user, logout } = useAuth();

  const userRef = useRef(null);

  useEffect(() => {
    const unsubscribe = sidebarState.subscribe(setState);
    return unsubscribe;
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className={`fixed top-0 z-20 flex items-center justify-between h-16 px-4 md:px-5 gap-2 md:gap-4 transition-all duration-300 left-0 right-0 ${
        state.collapsed ? 'md:left-18' : 'md:left-60'
      } bg-white/92 dark:bg-slate-900/92 backdrop-blur-[14px] border-b border-slate-200/7 dark:border-slate-700/50`}
    >
      {/* Left side - Menu button + Logo/Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => sidebarState.toggleSidebar()}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-700 bg-slate-50/4 dark:bg-slate-800/40 border-none cursor-pointer text-slate-500 dark:text-slate-400 text-xl"
        >
          <MdMenu />
        </button>

        {/* Logo/Brand for mobile, Breadcrumb for desktop */}
        <div className="md:hidden">
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-200 font-['Sora']">
            AgroFund
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, i) => {
            const isLast = i === breadcrumb.length - 1;
            return (
              <span key={crumb.path} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="text-slate-300 dark:text-slate-600 text-base flex">
                    <MdChevronRight />
                  </span>
                )}
                <span
                  className={`text-xs font-medium ${
                    isLast
                      ? 'text-slate-800 dark:text-slate-200 font-semibold cursor-default'
                      : 'text-slate-500 dark:text-slate-400 cursor-pointer'
                  } font-['Sora']`}
                >
                  {crumb.label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right side - Theme toggle + User dropdown */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        
        <div className="hidden md:block w-px h-6 bg-slate-200/9 dark:bg-slate-700" />

        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUser(!showUser); }}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-linear-to-br from-emerald-500 to-emerald-400 text-white font-['Sora']"
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p
                className="text-xs font-semibold leading-tight text-slate-700 dark:text-slate-300 font-['Sora']"
              >
                {user?.name || 'User'}
              </p>
              <p
                className="text-xs leading-tight text-slate-500 dark:text-slate-400 font-['Sora']"
              >
                {user?.role === 'admin' ? 'Administrator' : 'User'}
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
            <div
              className="absolute right-0 mt-2 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150 w-64 top-full bg-white dark:bg-slate-800 border border-slate-200/8 dark:border-slate-700 shadow-lg z-50"
            >
              {/* Profile info */}
              <div
                className="px-4 py-3 border-b border-slate-200/6 dark:border-slate-700"
              >
                <p
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-['Sora'] truncate"
                >
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
              {[
                { label: "My Profile",  icon: MdPerson   },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/5 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
                >
                  <Icon className="text-base text-slate-500 dark:text-slate-400" />
                  {label}
                </button>
              ))}

              <div className="border-t border-slate-200/6 dark:border-slate-700 my-1" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/5 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-red-500 dark:text-red-400 text-[13px] font-['Sora'] text-left"
              >
                <MdLogout style={{ fontSize: "16px" }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}