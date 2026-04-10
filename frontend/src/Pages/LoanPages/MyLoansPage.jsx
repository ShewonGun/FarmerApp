import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowPath,
  HiCalendarDays,
  HiCheckBadge,
  HiClipboardDocumentList,
  HiClock,
  HiCurrencyDollar,
  HiExclamationTriangle,
  HiMiniArrowTrendingUp,
} from "react-icons/hi2";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getStoredLoans = (userId) => {
  if (!userId) return [];

  try {
    const rawValue = localStorage.getItem(`farmer-loans:${userId}`);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const rawText = await response.text();
  return {
    success: false,
    message: rawText || "Unexpected server response.",
  };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusTone = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40";
  }

  if (normalized === "active") {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/40";
  }

  return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40";
};

const MyLoansPage = () => {
  const { user } = useAuth();
  const [storedLoans, setStoredLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyLoans = async () => {
      const token = localStorage.getItem("token");
      const localLoans = getStoredLoans(user?.id);

      if (!user?.id || !token) {
        setStoredLoans(localLoans);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/loans/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load your loans.");
        }

        const backendLoans = Array.isArray(data.loans) ? data.loans : [];
        const mergedLoans = [...backendLoans];

        localLoans.forEach((localLoan) => {
          const exists = mergedLoans.some((backendLoan) => backendLoan._id === localLoan._id);
          if (!exists) {
            mergedLoans.push(localLoan);
          }
        });

        setStoredLoans(mergedLoans);
      } catch {
        setStoredLoans(localLoans);
      } finally {
        setLoading(false);
      }
    };

    loadMyLoans();
  }, [user?.id]);

  const userSpecificLoans = useMemo(() => {
    return storedLoans.filter((loan) => {
      if (!user?.id) return false;
      if (!loan.farmerId) return true;
      return String(loan.farmerId) === String(user.id);
    });
  }, [storedLoans, user?.id]);

  const stats = useMemo(() => {
    const pending = userSpecificLoans.filter((loan) => (loan.status || "").toLowerCase() === "pending").length;
    const active = userSpecificLoans.filter((loan) => (loan.status || "").toLowerCase() === "active").length;
    const completed = userSpecificLoans.filter((loan) => (loan.status || "").toLowerCase() === "completed").length;

    return {
      total: userSpecificLoans.length,
      pending,
      active,
      completed,
    };
  }, [userSpecificLoans]);

  const refreshLoans = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStoredLoans(getStoredLoans(user?.id));
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/loans/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(parseApiResponse)
      .then((data) => {
        const backendLoans = Array.isArray(data.loans) ? data.loans : [];
        const localLoans = getStoredLoans(user?.id);
        const mergedLoans = [...backendLoans];

        localLoans.forEach((localLoan) => {
          const exists = mergedLoans.some((backendLoan) => backendLoan._id === localLoan._id);
          if (!exists) {
            mergedLoans.push(localLoan);
          }
        });

        setStoredLoans(mergedLoans);
      })
      .catch(() => {
        setStoredLoans(getStoredLoans(user?.id));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <section className="w-full max-w-7xl mx-auto py-6 md:py-8 px-2">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[28px] border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-slate-900 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] px-5 py-6 md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 font-['Sora'] dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <HiClipboardDocumentList className="h-4 w-4" />
                  My Loans
                </span>
                <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Sora'] md:text-4xl">
                  View your current loan applications and their details.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 font-['Sora']">
                  This page focuses on the loans you have applied for: selected category, plan, amount, purpose, repayment preview, uploaded documents, and current status.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/loan"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 font-['Sora']"
                  >
                    Apply for a Loan
                  </Link>
                  <Link
                    to="/loan-repayments"
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 font-['Sora'] dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                  >
                    View Repayments
                  </Link>
                  <button
                    type="button"
                    onClick={refreshLoans}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 font-['Sora'] dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
                  >
                    <HiArrowPath className="h-4 w-4" />
                    Refresh My Loans
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Applied</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{stats.total}</p>
                </div>
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Pending</p>
                  <p className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-300 font-['Sora']">{stats.pending}</p>
                </div>
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Active / Completed</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{stats.active + stats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
              Loading your loan applications...
            </p>
          </div>
        ) : userSpecificLoans.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <HiExclamationTriangle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              No loan applications yet
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400 font-['Sora']">
              Once you submit a loan request from the apply-loan page, it will appear here with its loan details.
            </p>
            <Link
              to="/loan"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 font-['Sora']"
            >
              Go to Loan Application
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {userSpecificLoans.map((loan) => (
              <article
                key={loan._id || loan.submittedAt}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.categoryName || "Loan Application"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                      {loan.planName || "Selected repayment plan"}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold font-['Sora'] ${getStatusTone(loan.status || "pending")}`}>
                    {loan.status || "Pending"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <HiCurrencyDollar className="h-5 w-5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Loan Amount</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.amount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <HiCalendarDays className="h-5 w-5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Submitted</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatDate(loan.submittedAt || loan.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <HiClock className="h-5 w-5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Repayment Frequency</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.paymentFrequency || "Pending setup"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <HiCheckBadge className="h-5 w-5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Installment</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.installmentAmount
                        ? formatCurrency(loan.repaymentPreview.installmentAmount)
                        : loan.installmentAmount
                          ? formatCurrency(loan.installmentAmount)
                          : "Pending approval"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Purpose of Loan
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300 font-['Sora']">
                    {loan.purpose || "No purpose provided."}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      Total Payable
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.totalPayable
                        ? formatCurrency(loan.repaymentPreview.totalPayable)
                        : loan.totalPayable
                          ? formatCurrency(loan.totalPayable)
                          : "Pending calculation"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      Number Of Payments
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.numberOfPayments || loan.numberOfPayments || "Pending calculation"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      Interest
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.interestRate ? `${loan.interestRate}%` : "Pending approval"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      Uploaded Documents
                    </p>
                    <div className="mt-2 space-y-1">
                      {(loan.requiredDocuments || []).length > 0 ? (
                        loan.requiredDocuments.map((documentName) => (
                          <p key={documentName} className="text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                            {documentName}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">No files listed</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <HiMiniArrowTrendingUp className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Loan Progress</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{
                        width: `${Math.min(
                          100,
                          loan.totalPayable > 0
                            ? ((loan.totalPaid || 0) / loan.totalPayable) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    <span>Paid: {formatCurrency(loan.totalPaid || 0)}</span>
                    <span>Remaining: {formatCurrency(loan.remainingBalance || 0)}</span>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Link
                    to="/loan-repayments"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 font-['Sora'] dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
                  >
                    See repayment history
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyLoansPage;
