import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MdDashboard,
  MdPeople,
  MdLogout,
  MdBook,
  MdMoney,
} from "react-icons/md";
import AgroFundLogo from "../../assets/AgroFundLogo.png";
import { sidebarState } from "../../utils/sidebarState";

const navItems = [
  { label: "Dashboard", icon: MdDashboard, path: "/admin" },
  { label: "Users", icon: MdPeople, path: "/admin/users"},
  //{ label: "Add Course", icon: MdAdd, path: "/admin/add-course"},
  { label: "Courses", icon: MdBook, path: "/admin/courses"},
  { label: "Requests", icon: MdMoney, path: "/admin/requests"},
  //{ label: "Analytics", icon: MdBarChart, path: "/admin/analytics"},
];

const bottomItems = [];

function NavItem({ item, collapsed, onClick }) {

  const location = useLocation();
  const isActive =
    item.path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(item.path);

  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : ""}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all duration-200 group hover:bg-gray-50 dark:hover:bg-slate-700 ${
        isActive
          ? 'bg-emerald-50/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 justify-start'
          : 'bg-transparent text-slate-500 dark:text-slate-400 justify-start'
      } ${collapsed ? 'md:justify-center' : 'justify-start'}`}
    >
      {/* Active bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r w-0.75 h-5 bg-emerald-500 dark:bg-emerald-400"
        />
      )}

      {/* Icon */}
      <span
        className={`shrink-0 flex text-xl transition-colors duration-200 ${
          isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <Icon />
      </span>

      {/* Label */}
      <span
        className={`text-xs font-medium whitespace-nowrap overflow-hidden flex-1 transition-all duration-300 font-['Sora'] ${
          collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
        }`}
      >
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && !collapsed && (
        <span
          className={`text-xs rounded-full font-semibold px-1.5 py-0.5 transition-all duration-200 text-[10px] font-['Sora'] ${
            isActive
              ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed}) {
  const [state, setState] = useState(sidebarState.getState());

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
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 ${
          state.collapsed ? 'md:w-18' : 'md:w-60'
        } w-60 md:translate-x-0 ${
          state.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      {/* Logo Section*/}
      <div
        className="flex items-center h-16 px-4 shrink-0 border-b border-gray-200 dark:border-slate-700"
      >
          <div
            className={`flex items-center gap-3 overflow-hidden w-full ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <img
              src={AgroFundLogo}
              alt="AgroFund Logo"
              className="shrink-0 w-10 h-10 object-cover rounded-[10px]"
            />
            <span
              className={`font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 text-slate-800 dark:text-slate-200 font-['Sora'] tracking-[0.03em] ${
                collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
              }`}
            >
              AgroFund
            </span>
          </div>
        </div>

      {/*Navigation Items*/}
      <nav className="flex-1 py-5 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem 
            key={item.label} 
            item={item} 
            collapsed={state.collapsed} 
            onClick={() => sidebarState.closeMobileMenu()} 
          />
        ))}
      </nav>

      {/*Bottom Section*/}
      <div
        className="py-4 px-2 flex flex-col gap-0.5 border-t border-gray-200 dark:border-slate-700"
      >
        {bottomItems.map((item) => (
          <NavItem 
            key={item.label} 
            item={item} 
            collapsed={state.collapsed} 
            onClick={() => sidebarState.closeMobileMenu()} 
          />
        ))}

        {/* User Profile Card */}
        <div
            className={`mt-3 mx-1 rounded-xl p-3 flex items-center gap-3 overflow-hidden transition-all duration-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${
              state.collapsed ? 'md:justify-center' : 'justify-start'
            }`}
          >
            <div
              className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${
                state.collapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-35 opacity-100'
              }`}
            >
              <p
                className="text-xs font-semibold leading-tight whitespace-nowrap text-slate-800 dark:text-slate-200 font-['Sora']"
              >
                Admin User
              </p>
              <p
                className="text-xs leading-tight whitespace-nowrap text-slate-500 dark:text-slate-400 font-['Sora']"
              >
                Administrator
              </p>
            </div>

            {/* Logout Button */}
            {!state.collapsed && (
              <button
                title="Logout"
                className="flex shrink-0 transition-opacity duration-150 hover:opacity-100 text-slate-400 dark:text-slate-500 bg-none border-none cursor-pointer p-0 text-base"
              >
                <MdLogout />
              </button>
            )}
          </div>
      </div>
    </aside>
    </>
  );
}