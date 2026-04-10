import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  { value: "loan", label: "Loan" },
  { value: "crop", label: "Crop" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "training", label: "Training" },
  { value: "general", label: "General" },
];

const PRIORITIES = ["Low", "Medium", "High"];

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const rawText = await response.text();
  return { success: false, message: rawText || "Unexpected server response." };
};

const SupportTicketPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: "general",
    subject: "",
    description: "",
    priority: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to submit a ticket.");
      return;
    }

    const subject = form.subject.trim();
    const description = form.description.trim();
    if (!subject || !description) {
      setError("Subject and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: form.category,
          subject,
          description,
          priority: form.priority,
        }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not create ticket.");
      }

      setSuccess(true);
      setForm({
        category: "general",
        subject: "",
        description: "",
        priority: "Medium",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 outline-none";

  const labelClass =
    "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']";

  return (
    <section className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start py-6 md:py-10 px-3 sm:px-4 lg:px-6">
      {/* lg: equal side columns so the form column stays visually centered; buttons sit in the right column */}
      <div className="grid w-full max-w-400 grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:gap-x-6 xl:gap-x-10">
        <div className="hidden min-h-0 lg:block" aria-hidden="true" />
        <div className="col-span-1 w-full max-w-2xl justify-self-center lg:col-start-2 lg:w-full lg:max-w-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 bg-linear-to-r from-emerald-500 to-teal-600">
              <h1 className="text-white text-xl md:text-2xl font-bold font-['Sora']">Support Ticket</h1>
            </div>

            <div className="p-4 md:p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-['Sora']">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-sm text-emerald-700 dark:text-emerald-300 font-['Sora']">
              Your ticket was submitted successfully. We&apos;ll be in touch soon.
            </div>
          )}

          <div className="mb-6 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
              Having a question or need support? We&apos;re happy to help. Fill out the form below and we&apos;ll respond as soon as we can.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label htmlFor="ticket-category" className={labelClass}>
                Category
              </label>
              <select
                id="ticket-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ticket-priority" className={labelClass}>
                Priority
              </label>
              <select
                id="ticket-priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="ticket-subject" className={labelClass}>
                Subject
              </label>
              <input
                id="ticket-subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="Brief summary of your issue"
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="ticket-description" className={labelClass}>
                Description
              </label>
              <textarea
                id="ticket-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={8}
                required
                placeholder="Describe your issue in detail..."
                className={`${inputClass} resize-y min-h-40`}
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-2 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center min-w-36 px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed font-['Sora']"
              >
                {submitting ? "Submitting…" : "Submit ticket"}
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>

        <aside className="col-span-1 flex w-full max-w-2xl flex-col gap-3 justify-self-center sm:max-w-sm lg:col-start-3 lg:mt-0 lg:w-52 lg:max-w-none lg:justify-self-end lg:self-start">
          <button
            type="button"
            onClick={() => navigate("/support-ticket/my-tickets")}
            className="w-full px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-['Sora'] text-center"
          >
            My Tickets
          </button>
          <button
            type="button"
            onClick={() => navigate("/support-ticket/feedback")}
            className="w-full px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-['Sora'] text-center"
          >
            Feedback
          </button>
        </aside>
      </div>
    </section>
  );
};

export default SupportTicketPage;
