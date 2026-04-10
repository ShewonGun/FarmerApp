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

/** Star 1 smallest → star 5 largest (Tailwind classes) */
const STAR_SIZE_CLASSES = [
  "text-[0.7rem]",
  "text-[0.88rem]",
  "text-[1.06rem]",
  "text-[1.22rem]",
  "text-[1.38rem]",
];

const labelClass =
  "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-['Sora']";

const StarRatingRow = ({ label, value, onChange, disabled }) => (
  <div className={disabled ? "opacity-55" : ""}>
    <span className={labelClass}>{label}</span>
    <div
      className="flex flex-wrap items-end gap-1.5 sm:gap-2"
      role="group"
      aria-label={label}
      aria-disabled={disabled || undefined}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${n} of 5`}
            aria-pressed={value === n}
            className={`${STAR_SIZE_CLASSES[n - 1]} leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded disabled:cursor-not-allowed ${
              active ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
            } ${disabled ? "" : "hover:text-amber-300"}`}
            onClick={() => !disabled && onChange(n)}
          >
            ★
          </button>
        );
      })}
      <span className="ml-1 text-xs tabular-nums text-slate-500 dark:text-slate-400 font-['Sora']">
        {value > 0 ? value : "—"}
      </span>
    </div>
  </div>
);

const emptyForm = () => ({
  rating: 0,
  responseQuality: 0,
  resolutionSpeed: 0,
  helpfulness: 0,
  feedback: "",
});

const PlatformFeedbackPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ratingInfo, setRatingInfo] = useState({ loading: false, data: undefined });

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setListLoading(false);
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
        setListError(e.message || "Failed to load tickets.");
      } finally {
        setListLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTicket?._id) {
      setRatingInfo({ loading: false, data: undefined });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    (async () => {
      setRatingInfo({ loading: true, data: undefined });
      setError("");
      setSuccess(false);
      setForm(emptyForm());
      try {
        const res = await fetch(`${API_BASE_URL}/ticket-ratings/ticket/${selectedTicket._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(res);
        if (cancelled) return;
        if (res.ok) {
          setRatingInfo({ loading: false, data: data.data });
        } else if (res.status === 404) {
          setRatingInfo({ loading: false, data: null });
        } else {
          setRatingInfo({ loading: false, data: null });
          setError(data.message || "Could not check existing rating.");
        }
      } catch (e) {
        if (!cancelled) {
          setRatingInfo({ loading: false, data: null });
          setError(e.message || "Could not load rating.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTicket]);

  const inputClass =
    "w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none";

  const handleSelectTicket = (t) => {
    setError("");
    setSelectedTicket(t);
  };

  /** API only accepts ratings when status is Resolved */
  const canSubmitRating = selectedTicket?.status === "Resolved";

  const handleBackToList = () => {
    setSelectedTicket(null);
    setRatingInfo({ loading: false, data: undefined });
    setForm(emptyForm());
    setError("");
    setSuccess(false);
  };

  const setField = (key, v) => {
    setForm((prev) => ({ ...prev, [key]: v }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !selectedTicket?._id) {
      setError("Please log in and select a ticket.");
      return;
    }
    if (selectedTicket.status !== "Resolved") {
      setError("You can submit a rating after this ticket is marked resolved.");
      return;
    }

    const { rating, responseQuality, resolutionSpeed, helpfulness, feedback } = form;
    if (!rating || !responseQuality || !resolutionSpeed || !helpfulness) {
      setError("Please choose a score (1–5) for each rating row.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/ticket-ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          rating,
          responseQuality,
          resolutionSpeed,
          helpfulness,
          feedback: feedback.trim() || undefined,
        }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Could not submit rating.");
      }
      setSuccess(true);
      setRatingInfo({ loading: false, data: data.data });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const showList = !selectedTicket;
  const showForm = selectedTicket && !ratingInfo.loading && ratingInfo.data === null;
  const showAlreadyRated = selectedTicket && !ratingInfo.loading && ratingInfo.data != null;

  return (
    <section className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start py-6 md:py-10 px-3 sm:px-4 lg:px-6">
      <div className="grid w-full max-w-400 grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:gap-x-6 xl:gap-x-10">
        <div className="hidden min-h-0 lg:block" aria-hidden="true" />
        <div className="col-span-1 w-full max-w-2xl justify-self-center self-start lg:col-start-2 lg:w-full lg:max-w-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-linear-to-r from-emerald-500 to-teal-600">
              <h1 className="text-white text-xl md:text-2xl font-bold font-['Sora']">
                {showList ? "Ticket feedback" : "Rate this ticket"}
              </h1>
            </div>
            <div className="p-4 md:p-6">
              {showList && (
                <>
                  <p className="mb-6 text-sm text-slate-600 dark:text-slate-300 font-['Sora'] pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                    Open any ticket to see the feedback form. You can submit your rating once the ticket is marked resolved. Comments are optional.
                  </p>
                  {listLoading && (
                    <div className="flex justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  )}
                  {!listLoading && listError && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-['Sora']">{listError}</p>
                  )}
                  {!listLoading && !listError && tickets.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                      You don&apos;t have any support tickets yet.
                    </p>
                  )}
                  {!listLoading && !listError && tickets.length > 0 && (
                    <ul className="space-y-3">
                      {tickets.map((t) => {
                        const resolved = t.status === "Resolved";
                        return (
                          <li key={t._id}>
                            <button
                              type="button"
                              onClick={() => handleSelectTicket(t)}
                              className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/40 transition-colors font-['Sora'] cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.subject}</p>
                                <span className={`text-xs font-medium ${statusStyle(t.status)}`}>{t.status}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {t.category} · {t.priority} priority
                              </p>
                              {t.description && (
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{t.description}</p>
                              )}
                              {!resolved && (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                  Open to view the form — submit when this ticket is resolved.
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}

              {!showList && selectedTicket && (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline font-['Sora']"
                    >
                      ← All tickets
                    </button>
                  </div>
                  <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora']">
                    {selectedTicket.subject}
                  </p>
                </>
              )}

              {selectedTicket && ratingInfo.loading && (
                <div className="flex justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
                </div>
              )}

              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
                  {error}
                </div>
              )}

              {showAlreadyRated && (
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  {success && (
                    <p className="px-3 py-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-medium">
                      Thank you — your rating was saved.
                    </p>
                  )}
                  {!success && (
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                      You have already submitted feedback for this ticket.
                    </p>
                  )}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <li>Rating: {ratingInfo.data?.rating}</li>
                    <li>Response quality: {ratingInfo.data?.responseQuality ?? "—"}</li>
                    <li>Resolution speed: {ratingInfo.data?.resolutionSpeed ?? "—"}</li>
                    <li>Helpfulness: {ratingInfo.data?.helpfulness ?? "—"}</li>
                  </ul>
                  {ratingInfo.data?.feedback && (
                    <p className="text-sm border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                      {ratingInfo.data.feedback}
                    </p>
                  )}
                </div>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!canSubmitRating && (
                    <div className="px-3 py-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-800 dark:text-amber-200 font-['Sora']">
                      This ticket isn&apos;t resolved yet. You can fill in your ratings below;{" "}
                      <strong>Submit</strong> is enabled once support marks the ticket{" "}
                      <strong>Resolved</strong>.
                    </div>
                  )}
                  <StarRatingRow
                    label="Rating (required)"
                    value={form.rating}
                    onChange={(n) => setField("rating", n)}
                  />
                  <StarRatingRow
                    label="Response quality (required)"
                    value={form.responseQuality}
                    onChange={(n) => setField("responseQuality", n)}
                  />
                  <StarRatingRow
                    label="Resolution speed (required)"
                    value={form.resolutionSpeed}
                    onChange={(n) => setField("resolutionSpeed", n)}
                  />
                  <StarRatingRow
                    label="Helpfulness (required)"
                    value={form.helpfulness}
                    onChange={(n) => setField("helpfulness", n)}
                  />

                  <div>
                    <label htmlFor="ticket-feedback-text" className={labelClass}>
                      Feedback (optional)
                    </label>
                    <textarea
                      id="ticket-feedback-text"
                      value={form.feedback}
                      onChange={(e) => setField("feedback", e.target.value)}
                      rows={5}
                      placeholder="Add any extra comments…"
                      className={`${inputClass} resize-y min-h-32`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !canSubmitRating}
                      className="inline-flex items-center justify-center min-w-36 px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed font-['Sora']"
                    >
                      {submitting ? "Submitting…" : "Submit rating"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>

        <aside className="col-span-1 flex w-full max-w-2xl flex-col gap-3 justify-self-center self-start sm:max-w-sm lg:col-start-3 lg:mt-0 lg:w-52 lg:max-w-none lg:justify-self-end">
          <Link
            to="/support-ticket"
            className="w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors font-['Sora']"
          >
            New ticket
          </Link>
          <Link
            to="/support-ticket/my-tickets"
            className="w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-['Sora']"
          >
            My Tickets
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default PlatformFeedbackPage;
