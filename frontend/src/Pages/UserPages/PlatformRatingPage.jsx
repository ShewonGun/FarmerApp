import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const rawText = await response.text();
  return { success: false, message: rawText || "Unexpected server response." };
};

const MEANING_LABELS = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const FEEDBACK_MAX = 500;

const CATEGORIES = [
  { key: "overallRating", label: "Overall Experience", short: "overall experience" },
  { key: "loanServiceRating", label: "Loan Services", short: "loan services" },
  { key: "trainingServiceRating", label: "Training & Courses", short: "training and courses" },
  { key: "supportServiceRating", label: "Support", short: "support" },
  { key: "usabilityRating", label: "Usability & Ease of Use", short: "usability" },
];

function averageRatingFromRecord(r) {
  if (!r) return 0;
  const vals = [
    r.overallRating,
    r.loanServiceRating,
    r.trainingServiceRating,
    r.supportServiceRating,
    r.usabilityRating,
  ].map((v) => Number(v) || 0);
  if (vals.some((v) => v < 1)) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / 5) * 10) / 10;
}

function InteractiveStarRating({
  id,
  label,
  shortLabel,
  value,
  onChange,
  disabled,
}) {
  const [hover, setHover] = useState(null);
  const highlight = hover ?? value;
  const meaning = highlight > 0 ? MEANING_LABELS[highlight] : "Select a rating";

  const handleKeyDown = (e, star) => {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, star + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, star - 1));
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 py-4 border-b border-slate-200/90 dark:border-slate-700/80 last:border-b-0 transition-colors duration-200 ease-in-out ${
        disabled ? "opacity-55 pointer-events-none" : ""
      }`}
      onMouseLeave={() => setHover(null)}
    >
      <div className="min-w-0 sm:max-w-[46%]">
        <p
          id={`${id}-label`}
          className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-['Sora'] leading-snug"
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">Required</p>
      </div>

        <div
        className="flex flex-col items-end gap-2 sm:min-w-64"
        role="group"
        aria-labelledby={`${id}-label`}
        aria-label={`Rate ${shortLabel}, 1 to 5 stars. Current selection ${value > 0 ? `${value} of 5` : "none"}.`}
      >
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const lit = highlight >= n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  aria-label={`${n} out of 5 stars, ${MEANING_LABELS[n]}`}
                  tabIndex={disabled ? -1 : 0}
                  onMouseEnter={() => !disabled && setHover(n)}
                  onFocus={() => !disabled && setHover(n)}
                  onBlur={() => setHover(null)}
                  onKeyDown={(e) => handleKeyDown(e, n)}
                  onClick={() => !disabled && onChange(n)}
                  className={`
                    relative p-1 rounded-md transition-all duration-200 ease-in-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
                    dark:focus-visible:ring-offset-slate-900
                    disabled:cursor-not-allowed
                    ${lit ? "text-emerald-500 dark:text-emerald-400 scale-110" : "text-slate-300 dark:text-slate-600"}
                    ${!disabled && !lit ? "hover:text-emerald-400/80 dark:hover:text-emerald-500/80" : ""}
                  `}
                >
                  <span className="text-2xl leading-none block transition-transform duration-200 ease-in-out hover:scale-110">
                    ★
                  </span>
                </button>
              );
            })}
          </div>
          <span
            className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400 min-w-24 text-right font-['Sora'] transition-colors duration-200 ease-in-out"
            aria-live="polite"
          >
            {meaning}
          </span>
        </div>
      </div>
    </div>
  );
}

function StarAverageDisplay({ value }) {
  const full = Math.floor(value);
  const partial = value - full;
  return (
    <div className="flex items-center gap-2" aria-label={`Average rating ${value} out of 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`text-lg leading-none ${n <= full ? "text-emerald-500 dark:text-emerald-400" : n === full + 1 && partial > 0 ? "text-emerald-500/50" : "text-slate-300 dark:text-slate-600"}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white font-['Sora'] tabular-nums">
        {value.toFixed(1)} / 5
      </span>
    </div>
  );
}

const emptyForm = () => ({
  overallRating: 0,
  loanServiceRating: 0,
  trainingServiceRating: 0,
  supportServiceRating: 0,
  usabilityRating: 0,
  feedback: "",
});

const PlatformRatingPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(undefined);
  const [loadError, setLoadError] = useState("");
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
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/platform-ratings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(res);
        if (cancelled) return;
        if (res.ok && data.data) {
          setExisting(data.data);
        } else if (res.status === 404) {
          setExisting(null);
        } else {
          setLoadError(data.message || "Could not load your rating.");
          setExisting(undefined);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || "Could not load your rating.");
          setExisting(undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inputClass =
    "w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 outline-none transition-[border-color,box-shadow] duration-200 ease-in-out placeholder:text-slate-400 dark:placeholder:text-slate-500";

  const setField = useCallback((key, v) => {
    setForm((prev) => ({ ...prev, [key]: v }));
    setError("");
  }, []);

  const setFeedback = useCallback((raw) => {
    const next = raw.slice(0, FEEDBACK_MAX);
    setForm((prev) => ({ ...prev, feedback: next }));
    setError("");
  }, []);

  const allRequiredSelected = useMemo(() => {
    return CATEGORIES.every((c) => form[c.key] >= 1 && form[c.key] <= 5);
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to continue.");
      return;
    }

    const {
      overallRating,
      loanServiceRating,
      trainingServiceRating,
      supportServiceRating,
      usabilityRating,
      feedback,
    } = form;

    if (
      !overallRating ||
      !loanServiceRating ||
      !trainingServiceRating ||
      !supportServiceRating ||
      !usabilityRating
    ) {
      setError("Please choose a score (1–5) for each category.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/platform-ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          overallRating,
          loanServiceRating,
          trainingServiceRating,
          supportServiceRating,
          usabilityRating,
          feedback: feedback.trim() || undefined,
        }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Could not submit rating.");
      }
      setSuccess(true);
      setExisting(data.data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = !loading && existing === null && !loadError;
  const showAlreadyRated = !loading && existing != null;
  const displayAverage = existing ? averageRatingFromRecord(existing) : 0;

  return (
    <section className="min-h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-center px-3 py-8">
      <div className="w-full max-w-3xl">
        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
            <h1 className="text-slate-900 dark:text-slate-100 text-xl font-semibold font-['Sora'] tracking-tight">
              Rate the platform
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-['Sora'] leading-relaxed max-w-2xl">
              Share how AgroFund works for you. Your ratings help us improve loans, courses, support, and usability.
            </p>
          </div>

          <div className="px-5 md:px-6 py-5 md:py-6">
            {loading && (
              <div className="flex justify-center py-10">
                <div
                  className="inline-block animate-spin rounded-full h-9 w-9 border-[3px] border-emerald-200 dark:border-emerald-500/30 border-t-emerald-600 dark:border-t-emerald-400"
                  role="status"
                  aria-label="Loading"
                />
              </div>
            )}

            {loadError && (
              <div className="mb-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-200 font-['Sora']">
                {loadError}
              </div>
            )}

            {error && (
              <div className="mb-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-200 font-['Sora']">
                {error}
              </div>
            )}

            {showAlreadyRated && (
              <div className="space-y-4 text-sm text-slate-800 dark:text-slate-200 font-['Sora']">
                {success && (
                  <div className="rounded-md border border-emerald-200 dark:border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-3.5">
                    <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                      Thank you for helping improve AgroFund!
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Your average rating</p>
                    <div className="mt-1.5">
                      {displayAverage > 0 ? (
                        <StarAverageDisplay value={displayAverage} />
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
                      )}
                    </div>
                  </div>
                )}
                {!success && (
                  <>
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                      You have already submitted a platform rating.
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-500">Your average rating</p>
                    {displayAverage > 0 ? (
                      <StarAverageDisplay value={displayAverage} />
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">—</p>
                    )}
                  </>
                )}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 font-['Sora']"
                  role="list"
                  aria-label="Your category ratings"
                >
                  {[
                    ["Overall", existing?.overallRating],
                    ["Loan services", existing?.loanServiceRating],
                    ["Training", existing?.trainingServiceRating],
                    ["Support", existing?.supportServiceRating],
                    ["Usability", existing?.usabilityRating],
                  ].map(([label, num]) => (
                    <p
                      key={label}
                      className="text-sm text-slate-800 dark:text-slate-100 flex flex-wrap items-baseline gap-1"
                      role="listitem"
                    >
                      <span className="text-slate-600 dark:text-slate-400">{label}:</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{num ?? "—"}</span>
                    </p>
                  ))}
                </div>
                {existing?.feedback && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700/60 pt-3 leading-relaxed">
                    {existing.feedback}
                  </p>
                )}
              </div>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora'] mb-3.5 leading-relaxed">
                  Tap or use keyboard arrows on a star row to set your score. Optional written feedback may appear on
                  the homepage when shared publicly.
                </p>

                <div className="rounded-md border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 px-1 sm:px-3 divide-y divide-slate-200 dark:divide-slate-700/40">
                  {CATEGORIES.map((cat) => (
                    <InteractiveStarRating
                      key={cat.key}
                      id={`rating-${cat.key}`}
                      label={cat.label}
                      shortLabel={cat.short}
                      value={form[cat.key]}
                      onChange={(n) => setField(cat.key, n)}
                    />
                  ))}
                </div>

                <div className="pt-4.5">
                  <label htmlFor="platform-feedback-text" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-[0.16em] mb-1.5 font-['Sora']">
                    Feedback (optional)
                  </label>
                  <textarea
                    id="platform-feedback-text"
                    value={form.feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={FEEDBACK_MAX}
                    rows={7}
                    placeholder="Share what you liked or what we can improve..."
                    className={`${inputClass} resize-y min-h-36`}
                    aria-describedby="feedback-counter"
                  />
                  <p id="feedback-counter" className="mt-1.5 text-right text-xs text-slate-500 font-['Sora'] tabular-nums">
                    {form.feedback.length} / {FEEDBACK_MAX}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !allRequiredSelected}
                  className="mt-5 w-full inline-flex items-center justify-center px-4 py-3 rounded-md text-sm font-semibold text-white font-['Sora'] bg-emerald-600 hover:bg-emerald-700 transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                      Submitting…
                    </span>
                  ) : (
                    "Submit rating"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformRatingPage;
