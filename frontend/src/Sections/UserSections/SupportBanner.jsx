import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const SupportBanner = ({ compact = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleAddTicket = () => {
    if (!isAuthenticated) {
      navigate("/login?next=/support-ticket");
      return;
    }
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    navigate("/support-ticket");
  };

  return (
    <section
      className={`w-full bg-slate-50 dark:bg-slate-900 ${
        compact ? "py-0 h-full min-h-0 flex flex-col" : "py-16 md:py-20"
      }`}
    >
      <div
        className={`mx-auto ${compact ? "max-w-full px-0 flex-1 flex flex-col min-h-0 w-full" : "max-w-5xl px-6"}`}
      >
        <div
          className={`rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
            compact
              ? "flex-1 h-full min-h-75 w-full px-6 py-7 flex flex-col justify-between items-start gap-5"
              : "px-8 py-12 md:py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8"
          }`}
        >
          <div className={`text-left ${compact ? "max-w-none w-full" : "max-w-xl"}`}>
            <h2 className={`font-semibold font-['Sora'] tracking-tight ${compact ? "text-2xl leading-snug text-slate-900 dark:text-slate-100" : "text-2xl md:text-3xl leading-snug text-slate-900 dark:text-slate-100"}`}>
              Having a question or need support? We&apos;re happy to help.
            </h2>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 font-['Sora']">
              Submit a support ticket and our team will get back to you as soon as possible.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTicket}
            className={`shrink-0 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors duration-200 font-['Sora'] ${
              compact ? "self-start" : ""
            }`}
          >
            Add Ticket
          </button>
        </div>
      </div>
    </section>
  );
};

export default SupportBanner;
