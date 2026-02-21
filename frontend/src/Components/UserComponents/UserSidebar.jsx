import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MdAttachMoney,
  MdBook,
  MdPayments,
} from "react-icons/md";
import { sidebarState } from "../../utils/sidebarState";
import { useAuth } from "../../Context/AuthContext";

const navItems = [
  { label: "Loans", icon: MdAttachMoney, path: "/loan" },
  { label: "Courses", icon: MdBook, path: "/courses" },
  { label: "Loan Plans", icon: MdPayments, path: "/loan-plans" },
];

function NavItem({ item, onClick, onProtected, isAuthenticated }) {
  const handleClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast('Please log in to continue.', { icon: '⚠️' });
      return;
    }
    onClick?.();
  };
  return (
    <NavLink
      to={item.path}
      onClick={handleClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all duration-200 group hover:bg-gray-50 dark:hover:bg-slate-700 ${
          isActive
            ? 'bg-emerald-50/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-transparent text-slate-500 dark:text-slate-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r w-0.75 h-5 bg-emerald-500 dark:bg-emerald-400" />
          )}

          {/* Icon */}
          <span
            className={`shrink-0 flex text-xl transition-colors duration-200 ${
              isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <item.icon />
          </span>

          {/* Label */}
          <span className="text-xs font-medium whitespace-nowrap font-['Sora']">
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function UserSidebar() {
  const [state, setState] = useState(sidebarState.getState());
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = sidebarState.subscribe(setState);
    return unsubscribe;
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {state.mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => sidebarState.closeMobileMenu()}
        />
      )}
      
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 w-60 ${
          state.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <img
              src="/AgroFundLogo.png"
              alt="AgroFund Logo"
              className="shrink-0 w-8 h-8 object-cover rounded-lg"
            />
            <span className="text-base font-bold font-['Sora']">
              <span className="text-slate-800 dark:text-white">Agro</span><span className="text-emerald-600 dark:text-emerald-400">Fund</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-5 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isAuthenticated={!!user}
              onClick={() => sidebarState.closeMobileMenu()}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="py-4 px-2 border-t border-gray-200 dark:border-slate-700">
          {user ? (
            <div className="mx-1 rounded-xl p-3 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-linear-to-br from-emerald-500 to-emerald-400 text-white font-['Sora']">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight whitespace-nowrap text-slate-800 dark:text-slate-200 font-['Sora'] truncate">
                  {user.name}
                </p>
                <p className="text-xs leading-tight whitespace-nowrap text-slate-500 dark:text-slate-400 font-['Sora']">
                  Farmer
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-1 flex flex-col gap-2">
              <Link
                to="/signup"
                onClick={() => sidebarState.closeMobileMenu()}
                className="w-full text-center px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-150"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => sidebarState.closeMobileMenu()}
                className="w-full text-center px-4 py-2 rounded-lg text-sm font-medium font-['Sora'] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors duration-150"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}