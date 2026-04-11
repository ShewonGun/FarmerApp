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

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
    <section className="w-full max-w-5xl mx-auto py-6 px-2">
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <HiClipboardDocumentList className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] font-['Sora']">My Loans</span>
              </div>
              <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Your loan applications
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                Review status, repayment summary, and submitted details.
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                <Link
                  to="/loan"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 font-['Sora']"
                >
                  Apply Loan
                </Link>
                <Link
                  to="/loan-repayments"
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 font-['Sora'] dark:border-slate-700 dark:text-slate-300"
                >
                  Repayments
                </Link>
                <button
                  type="button"
                  onClick={refreshLoans}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 font-['Sora'] dark:border-slate-700 dark:text-slate-300"
                >
                  <HiArrowPath className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Total</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{stats.total}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Pending</p>
                <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-300 font-['Sora']">{stats.pending}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Active / Completed</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{stats.active + stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">Loading your loans...</p>
          </div>
        ) : userSpecificLoans.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900">
            <HiExclamationTriangle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">No loan applications yet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
              Submit your first request to see it here.
            </p>
            <Link
              to="/loan"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 font-['Sora']"
            >
              Go to Loan Application
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {userSpecificLoans.map((loan) => (
              <article
                key={loan._id || loan.submittedAt}
                className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.categoryName || "Loan Application"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                      {loan.planName || "Selected repayment plan"}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold font-['Sora'] ${getStatusTone(loan.status || "pending")}`}>
                    {loan.status || "Pending"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <HiCurrencyDollar className="h-3.5 w-3.5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Amount</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.amount)}
                    </p>
                  </div>

                  <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <HiCalendarDays className="h-3.5 w-3.5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Submitted</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatDate(loan.submittedAt || loan.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <HiClock className="h-3.5 w-3.5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Frequency</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.paymentFrequency || "Pending setup"}
                    </p>
                  </div>

                  <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <HiCheckBadge className="h-3.5 w-3.5" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Installment</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.installmentAmount
                        ? formatCurrency(loan.repaymentPreview.installmentAmount)
                        : loan.installmentAmount
                          ? formatCurrency(loan.installmentAmount)
                          : "Pending approval"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Purpose</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-['Sora']">
                    {loan.purpose || "No purpose provided."}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Payable</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.totalPayable
                        ? formatCurrency(loan.repaymentPreview.totalPayable)
                        : loan.totalPayable
                          ? formatCurrency(loan.totalPayable)
                          : "Pending calculation"}
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Payments</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.repaymentPreview?.numberOfPayments || loan.numberOfPayments || "Pending calculation"}
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Interest</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.interestRate ? `${loan.interestRate}%` : "Pending approval"}
                    </p>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Documents</p>
                    <div className="mt-1 space-y-0.5">
                      {(loan.requiredDocuments || []).length > 0 ? (
                        loan.requiredDocuments.map((documentName) => (
                          <p key={documentName} className="text-xs text-slate-600 dark:text-slate-300 font-['Sora']">
                            {documentName}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">No files listed</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <HiMiniArrowTrendingUp className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Loan Progress</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500"
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
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-['Sora']">
                    <span>Paid: {formatCurrency(loan.totalPaid || 0)}</span>
                    <span>Remaining: {formatCurrency(loan.remainingBalance || 0)}</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    to="/loan-repayments"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-300 font-['Sora'] dark:border-slate-700 dark:text-slate-300"
                  >
                    Repayment history
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
