import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

function formatReviewDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const suf =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${day}${suf} ${month}, ${d.getFullYear()}`;
}

function StarRow({ value }) {
  const n = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-lg leading-none ${i <= n ? "text-amber-400" : "text-slate-200 dark:text-slate-600"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function Avatar({ name, picture }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
      />
    );
  }
  return (
    <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-sm font-semibold font-['Sora']">
      {initial}
    </div>
  );
}

function TestimonialCard({ item }) {
  const title =
    item.user?.role === "farmer" ? "Farmer" : item.user?.role === "admin" ? "Admin" : "Member";

  return (
    <article className="flex h-full min-h-55 flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-md shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <StarRow value={item.overallRating} />
        <time className="text-xs text-slate-400 dark:text-slate-500 font-['Sora'] whitespace-nowrap">
          {formatReviewDate(item.createdAt)}
        </time>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-['Sora'] text-left">
        {item.feedback}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Avatar name={item.user?.name} picture={item.user?.picture} />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white font-['Sora']">
            {item.user?.name || "Member"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">{title}</p>
        </div>
      </div>
    </article>
  );
}

const PlatformRatingsTestimonials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [start, setStart] = useState(0);

  const perPage = 2;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/platform-ratings/testimonials?limit=24`);
        const body = await res.json();
        if (!res.ok || !body.success) {
          throw new Error(body.message || "Could not load ratings");
        }
        if (!cancelled) setItems(Array.isArray(body.data) ? body.data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load ratings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxStart = useMemo(() => Math.max(0, items.length - perPage), [items.length]);

  useEffect(() => {
    setStart((s) => Math.min(s, maxStart));
  }, [maxStart]);

  const visible = useMemo(() => items.slice(start, start + perPage), [items, start]);

  const goPrev = useCallback(() => {
    setStart((s) => Math.max(0, s - perPage));
  }, []);

  const goNext = useCallback(() => {
    setStart((s) => Math.min(maxStart, s + perPage));
  }, [maxStart]);

  const canPrev = start > 0;
  const canNext = start < maxStart;

  return (
    <section className="relative w-full py-16 md:py-20 bg-slate-50 dark:bg-slate-900">
      <div className="relative w-full max-w-6xl mx-auto px-6">
        <header className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold font-['Sora'] flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1">
            <span className="text-slate-900 dark:text-white">What people Think</span>
            <span className="text-emerald-600 dark:text-emerald-400">About Us</span>
          </h2>
        </header>

        {loading && (
          <p className="text-center text-sm text-slate-600 dark:text-white/90 font-['Sora']">
            Loading reviews…
          </p>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-slate-600 dark:text-white/90 font-['Sora']">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-center text-sm text-slate-600 dark:text-white/90 font-['Sora'] max-w-md mx-auto">
            No public reviews yet.
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Previous reviews"
              className="order-2 flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800/60 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800 md:order-1"
            >
              <span className="text-lg leading-none">‹</span>
            </button>

            <div className="order-1 grid min-h-0 flex-1 grid-cols-1 gap-6 md:order-2 md:grid-cols-2 md:gap-6">
              {visible.map((item) => (
                <TestimonialCard key={item._id} item={item} />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              aria-label="Next reviews"
              className="order-3 flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800/60 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800 md:order-3"
            >
              <span className="text-lg leading-none">›</span>
            </button>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/login?next=/platform-rating"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/25 transition hover:bg-emerald-700 font-['Sora']"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PlatformRatingsTestimonials;
