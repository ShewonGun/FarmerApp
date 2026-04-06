import { NavLink, Outlet } from "react-router-dom";

const subNav = [
  { path: "/data-verification/account-verification", label: "Identity Verification" },
  { path: "/data-verification/payment-info", label: "Billing Information" },
  { path: "/data-verification/location-validation", label: "Address Verification" },
  { path: "/data-verification/training-engagement", label: "Training & Participation" },
];

export default function DataVerificationPage() {
  return (
    <section className="w-full max-w-4xl mx-auto py-6 md:py-10 px-2">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-gradient-to-r from-emerald-500 to-teal-600">
          <h1 className="text-white text-xl md:text-2xl font-bold font-['Sora']">
            Data & Verification
          </h1>
          <p className="text-emerald-50/90 text-xs md:text-sm font-['Sora'] mt-1">
            Complete each area to strengthen your profile and eligibility.
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-1 px-2 md:px-3 pt-2 pb-0 border-b border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40"
          aria-label="Data and verification sections"
        >
          {subNav.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium font-['Sora'] whitespace-nowrap transition-colors duration-150 border-b-2 -mb-px ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-400 bg-white dark:bg-slate-900 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/40"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 md:p-6 min-h-[12rem]">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
