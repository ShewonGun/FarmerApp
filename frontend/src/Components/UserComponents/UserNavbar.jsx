import { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MdKeyboardArrowDown,
  MdPerson,
  MdLogout,
  MdBook,
  MdMenu,
  MdVerifiedUser,
  MdSupportAgent,
  MdStar,
  MdNotifications,
} from "react-icons/md";
import ThemeToggle from "../AdminComponents/ThemeToggle";
import { useAuth } from "../../Context/AuthContext";
import { sidebarState } from "../../utils/sidebarState";
import { API_BASE_URL } from "../../utils/api";

const ticketIdStr = (id) => (id != null ? String(id) : "");

const UserNavbar = () => {
  const [showUser, setShowUser] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navAvatarError, setNavAvatarError] = useState(false);
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [resolvedNotifications, setResolvedNotifications] = useState([]);
  const { user, logout } = useAuth();
  const userRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setNavAvatarError(false);
  }, [user?.picture]);

  useEffect(() => {
    let cancelled = false;

    const loadVerificationStatus = async () => {
      if (!user || user.role !== "farmer") {
        setIsVerifiedUser(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setIsVerifiedUser(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/verification-trust/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (!cancelled) setIsVerifiedUser(false);
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setIsVerifiedUser(data?.data?.verificationStatus === "Verified");
        }
      } catch {
        if (!cancelled) setIsVerifiedUser(false);
      }
    };

    loadVerificationStatus();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user || user.role !== "farmer") {
      setResolvedNotifications([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setResolvedNotifications([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/support-tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const data = await response.json();
      const tickets = Array.isArray(data?.data) ? data.data : [];
      const resolved = tickets
        .filter(
          (t) =>
            (t.status || "").toLowerCase() === "resolved" &&
            t.readNotification !== true
        )
        .sort(
          (a, b) =>
            new Date(b.resolvedAt || b.updatedAt || b.createdAt) -
            new Date(a.resolvedAt || a.updatedAt || a.createdAt)
        );

      setResolvedNotifications(resolved);
    } catch {
      // No-op
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== "farmer") {
      setResolvedNotifications([]);
      return;
    }
    loadNotifications();
  }, [user, location.pathname, loadNotifications]);

  useEffect(() => {
    if (user?.role === "farmer" && showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, user, loadNotifications]);

  const unreadNotificationCount = resolvedNotifications.length;

  const markSingleNotificationAsRead = async (ticketId) => {
    const id = ticketIdStr(ticketId);
    const token = localStorage.getItem("token");
    if (!token || !user || user.role !== "farmer" || !id) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/support-tickets/my/${encodeURIComponent(id)}/notification/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return false;
      setResolvedNotifications((prev) => prev.filter((t) => ticketIdStr(t._id) !== id));
      await loadNotifications();
      return true;
    } catch {
      return false;
    }
  };

  const handleNotificationClick = async (ticket) => {
    if (!ticket?._id) return;
    const id = ticketIdStr(ticket._id);
    setResolvedNotifications((prev) => prev.filter((t) => ticketIdStr(t._id) !== id));
    const ok = await markSingleNotificationAsRead(id);
    if (!ok) {
      toast.error("Could not mark notification as read. Try again.");
      await loadNotifications();
      return;
    }
    setShowNotifications(false);
    navigate("/support-ticket/my-tickets", { state: { openTicketId: id } });
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleKycReminderClick = () => {
    setShowNotifications(false);
    navigate("/data-verification");
  };

  const handleMenuNavigate = (path) => {
    setShowUser(false);
    navigate(path);
  };

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
        <NavLink
          to="/weather"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] transition-all duration-150 ${
              isActive
                ? ' text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`
          }
        >
          Weather
        </NavLink>
      </nav>

      {/* Right side - Theme toggle + Auth/User */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        {user?.role === "farmer" && (
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <MdNotifications className="text-xl" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4.5 text-center font-['Sora']">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-700 shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-50">
                <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">Notifications</p>
                </div>

                {!isVerifiedUser && (
                  <div className="border-b border-slate-200/60 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleKycReminderClick}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <p className="text-xs font-semibold font-['Sora'] text-slate-900 dark:text-white">
                        Complete Identity Verification
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-['Sora'] line-clamp-2">
                        Finish your KYC to unlock the full platform experience and build trust with lenders.
                      </p>
                    </button>
                  </div>
                )}

                {resolvedNotifications.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    No ticket notifications yet.
                  </p>
                ) : (
                  <ul className="py-1">
                    {resolvedNotifications.map((ticket) => {
                      return (
                        <li key={ticket._id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(ticket)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                          >
                            <p className="text-xs font-semibold font-['Sora'] truncate text-slate-900 dark:text-white">
                              Ticket resolved: {ticket.subject || "Support ticket"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-['Sora'] line-clamp-2">
                              {ticket.adminReply?.trim() || "Your ticket has been resolved by admin."}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

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
            {user?.picture && !navAvatarError ? (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/30 dark:border-slate-600"
                onError={() => setNavAvatarError(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-linear-to-br from-emerald-500 to-emerald-400 text-white font-['Sora']">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold leading-tight text-slate-700 dark:text-slate-300 font-['Sora']">
                  {user?.name || 'User'}
                </p>
                {isVerifiedUser && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#00A6FF] text-white shadow-[0_0_0_2px_rgba(255,255,255,0.75)] dark:shadow-[0_0_0_2px_rgba(15,23,42,0.9)]"
                    title="Verified user"
                    aria-label="Verified user"
                  >
                    <MdVerifiedUser className="text-[11px]" />
                  </span>
                )}
              </div>
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
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150 w-64 top-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 dark:border-slate-600/50 shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-50">
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
              <button
                type="button"
                onClick={() => handleMenuNavigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdPerson className="text-base text-slate-500 dark:text-slate-400" />
                My Profile
              </button>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <button
                type="button"
                onClick={() => handleMenuNavigate("/data-verification")}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdVerifiedUser className="text-base text-slate-500 dark:text-slate-400" />
                Data & Verification
              </button>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <button
                type="button"
                onClick={() => handleMenuNavigate("/my-courses")}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdBook className="text-base text-slate-500 dark:text-slate-400" />
                My Courses
              </button>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <button
                type="button"
                onClick={() => handleMenuNavigate("/support-ticket")}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdSupportAgent className="text-base text-slate-500 dark:text-slate-400" />
                Support ticket
              </button>

              <div className="border-t border-slate-200/60 dark:border-slate-700 my-1" />

              <button
                type="button"
                onClick={() => handleMenuNavigate("/platform-rating")}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 text-[13px] font-['Sora'] text-left"
              >
                <MdStar className="text-base text-slate-500 dark:text-slate-400" />
                Rate Us
              </button>

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