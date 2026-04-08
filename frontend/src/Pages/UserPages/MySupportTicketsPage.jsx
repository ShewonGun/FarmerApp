import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const rawText = await response.text();
  return { success: false, message: rawText || "Unexpected server response." };
};

const statusStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "open") return "text-emerald-600 dark:text-emerald-400";
  if (s === "resolved" || s === "closed") return "text-slate-500 dark:text-slate-400";
  return "text-amber-600 dark:text-amber-400";
};

const MySupportTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/support-tickets/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.message || "Could not load tickets.");
        }
        setTickets(data.data || []);
      } catch (e) {
        setError(e.message || "Failed to load tickets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start py-6 md:py-10 px-3 sm:px-4 lg:px-6">
      <div className="grid w-full max-w-[1600px] grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:gap-x-6 xl:gap-x-10">
        <div className="hidden min-h-0 lg:block" aria-hidden="true" />
        <div className="col-span-1 w-full max-w-2xl justify-self-center lg:col-start-2 lg:w-full lg:max-w-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-gradient-to-r from-emerald-500 to-teal-600">
              <h1 className="text-white text-xl md:text-2xl font-bold font-['Sora']">My Tickets</h1>
            </div>
            <div className="p-4 md:p-6">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
              </div>
            )}
            {!loading && error && (
              <p className="text-sm text-red-600 dark:text-red-400 font-['Sora']">{error}</p>
            )}
            {!loading && !error && tickets.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                You don&apos;t have any support tickets yet.
              </p>
            )}
            {!loading && !error && tickets.length > 0 && (
              <ul className="space-y-3">
                {tickets.map((t) => (
                  <li
                    key={t._id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
                        {t.subject}
                      </p>
                      <span className={`text-xs font-medium font-['Sora'] ${statusStyle(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                      {t.category} · {t.priority} priority
                    </p>
                    {t.description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-['Sora'] line-clamp-3">
                        {t.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
        </div>

        <aside className="col-span-1 flex w-full max-w-2xl flex-col gap-3 justify-self-center sm:max-w-sm lg:col-start-3 lg:mt-0 lg:w-52 lg:max-w-none lg:justify-self-end lg:self-start">
          <Link
            to="/support-ticket"
            className="w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors font-['Sora']"
          >
            New ticket
          </Link>
          <Link
            to="/support-ticket/feedback"
            className="w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-['Sora']"
          >
            Feedback
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default MySupportTicketsPage;
