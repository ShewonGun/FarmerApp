import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ticketIdStr = (id) => (id != null ? String(id) : "");

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
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const markReadAttemptedForOpenId = useRef(new Set());

  const selectedTicket = useMemo(
    () =>
      tickets.find((t) => ticketIdStr(t._id) === ticketIdStr(selectedTicketId)) ||
      null,
    [tickets, selectedTicketId]
  );

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

  useEffect(() => {
    const openTicketId = location.state?.openTicketId;
    if (!openTicketId || tickets.length === 0) return;
    const oid = ticketIdStr(openTicketId);
    const exists = tickets.some((t) => ticketIdStr(t._id) === oid);
    if (exists) setSelectedTicketId(oid);
  }, [location.state, tickets]);

  useEffect(() => {
    const openTicketId = location.state?.openTicketId;
    if (!openTicketId || tickets.length === 0) return;
    const id = ticketIdStr(openTicketId);
    if (markReadAttemptedForOpenId.current.has(id)) return;

    const ticket = tickets.find((t) => ticketIdStr(t._id) === id);
    if (!ticket) return;
    if ((ticket.status || "").toLowerCase() !== "resolved") return;
    if (ticket.readNotification === true) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    markReadAttemptedForOpenId.current.add(id);

    (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/support-tickets/my/${encodeURIComponent(id)}/notification/read`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          markReadAttemptedForOpenId.current.delete(id);
          return;
        }
        setTickets((prev) =>
          prev.map((t) =>
            ticketIdStr(t._id) === id ? { ...t, readNotification: true } : t
          )
        );
      } catch {
        markReadAttemptedForOpenId.current.delete(id);
      }
    })();
  }, [tickets, location.state]);

  return (
    <section className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start py-6 md:py-10 px-3 sm:px-4 lg:px-6">
      <div className="grid w-full max-w-400 grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:gap-x-6 xl:gap-x-10">
        <div className="hidden min-h-0 lg:block" aria-hidden="true" />
        <div className="col-span-1 w-full max-w-2xl justify-self-center lg:col-start-2 lg:w-full lg:max-w-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-linear-to-r from-emerald-500 to-teal-600">
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
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/90 dark:hover:bg-slate-800/60 transition-colors"
                    onClick={() => setSelectedTicketId(t._id)}
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
            className="w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors font-['Sora']"
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

      {selectedTicket && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close ticket details"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedTicketId(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
                  Ticket Details
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Full details of your support ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MdClose />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Subject
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {selectedTicket.subject || "—"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Category
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {selectedTicket.category || "—"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Priority
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {selectedTicket.priority || "—"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Status
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {selectedTicket.status || "—"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Description
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-24 whitespace-pre-wrap">
                  {selectedTicket.description || "—"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Admin Reply
                </label>
                <div className="w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-24 whitespace-pre-wrap">
                  {selectedTicket.adminReply?.trim() || "No reply yet."}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="px-4 py-2 rounded-md text-sm font-medium font-['Sora'] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MySupportTicketsPage;
