import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowPath,
  HiCalendarDays,
  HiClock,
  HiCurrencyDollar,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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

const formatMonthLabel = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
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

const countRemainingPayments = (loan) => {
  const installmentAmount = Number(loan.installmentAmount || loan.monthlyInstallment || 0);
  const remainingBalance = Number(loan.remainingBalance || 0);

  if (!installmentAmount || remainingBalance <= 0) return 0;
  return Math.ceil(remainingBalance / installmentAmount);
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

const LoanRepaymentsPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [repaymentsByLoan, setRepaymentsByLoan] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const fetchMyLoans = async ({ showRefreshState = false } = {}) => {
    if (!token) {
      setLoans([]);
      setLoading(false);
      return;
    }

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/loans/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load your loans.");
      }

      setLoans(Array.isArray(data.loans) ? data.loans : []);
    } catch (error) {
      console.error("Error loading repayment page loans:", error);
      setLoans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, [token]);

  useEffect(() => {
    const loadRepayments = async () => {
      if (!token || loans.length === 0) {
        setRepaymentsByLoan({});
        return;
      }

      const eligibleLoans = loans.filter((loan) => ["active", "completed"].includes((loan.status || "").toLowerCase()));

      if (eligibleLoans.length === 0) {
        setRepaymentsByLoan({});
        return;
      }

      const entries = await Promise.all(
        eligibleLoans.map(async (loan) => {
          try {
            const response = await fetch(`${API_BASE_URL}/loans/repay/${loan._id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await parseApiResponse(response);

            if (!response.ok) {
              return [loan._id, []];
            }

            return [loan._id, Array.isArray(data) ? data : []];
          } catch {
            return [loan._id, []];
          }
        })
      );

      setRepaymentsByLoan(Object.fromEntries(entries));
    };

    loadRepayments();
  }, [loans, token]);

  const visibleLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (!user?.id) return true;
      if (!loan.farmerId) return true;
      return String(loan.farmerId) === String(user.id);
    });
  }, [loans, user?.id]);

  return (
    <section className="mx-auto w-full max-w-5xl px-2 py-6">
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <HiCurrencyDollar className="h-4 w-4" />
                <span className="font-['Sora'] text-xs font-semibold uppercase tracking-[0.2em]">Repayments</span>
              </div>
              <h1 className="mt-2 font-['Sora'] text-xl font-semibold text-slate-900 dark:text-slate-100">
                Track repayment progress and overdue amounts
              </h1>
              <p className="mt-1.5 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">
                View paid totals, remaining balance, and payment history for each loan.
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                <Link
                  to="/my-loans"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3.5 py-2 font-['Sora'] text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Back to My Loans
                </Link>
                <button
                  type="button"
                  onClick={() => fetchMyLoans({ showRefreshState: true })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 font-['Sora'] text-xs font-semibold text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                >
                  <HiArrowPath className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Loans With Repayments</p>
                <p className="mt-1 font-['Sora'] text-xl font-bold text-slate-900 dark:text-slate-100">
                  {visibleLoans.filter((loan) => ["active", "completed"].includes((loan.status || "").toLowerCase())).length}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total Paid</p>
                <p className="mt-1 font-['Sora'] text-base font-bold text-emerald-600 dark:text-emerald-300">
                  {formatCurrency(visibleLoans.reduce((sum, loan) => sum + Number(loan.totalPaid || 0), 0))}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current Overdue</p>
                <p className="mt-1 font-['Sora'] text-base font-bold text-rose-600 dark:text-rose-300">
                  {formatCurrency(visibleLoans.reduce((sum, loan) => sum + Number(loan.arrearsAmount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-3 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">Loading your repayment history...</p>
          </div>
        ) : visibleLoans.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900">
            <HiExclamationTriangle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-3 font-['Sora'] text-lg font-semibold text-slate-900 dark:text-slate-100">No repayment records yet</h2>
            <p className="mt-2 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">
              Repayment entries will appear after your active loans receive payments.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleLoans.map((loan) => {
              const repayments = repaymentsByLoan[loan._id] || [];
              const remainingPayments = countRemainingPayments(loan);

              return (
                <article
                  key={loan._id}
                  className="rounded-md border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {loan.categoryName || "Loan"}
                      </p>
                      <p className="mt-0.5 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                        {loan.planName || "Repayment plan"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-md border px-2.5 py-1 font-['Sora'] text-[11px] font-semibold ${getStatusTone(loan.status || "pending")}`}>
                      {loan.status || "Pending"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <HiCurrencyDollar className="h-3.5 w-3.5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Total Payable</span>
                      </div>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(loan.totalPayable)}</p>
                    </div>

                    <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <HiCurrencyDollar className="h-3.5 w-3.5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Paid Amount</span>
                      </div>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-emerald-600 dark:text-emerald-300">{formatCurrency(loan.totalPaid)}</p>
                    </div>

                    <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <HiClock className="h-3.5 w-3.5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Remaining</span>
                      </div>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {remainingPayments} payment{remainingPayments === 1 ? "" : "s"} left
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-50/90 p-2.5 dark:bg-slate-800/60">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <HiCalendarDays className="h-3.5 w-3.5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Next Due</span>
                      </div>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">{formatDate(loan.nextDueDate)}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Remaining Balance</p>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(loan.remainingBalance)}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Installment</p>
                      <p className="mt-1 font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(loan.installmentAmount || loan.monthlyInstallment)}</p>
                    </div>

                    <div className={`rounded-md border p-2.5 ${Number(loan.arrearsAmount || 0) > 0 ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-700"}`}>
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overdue</p>
                      <p className={`mt-1 font-['Sora'] text-xs font-semibold ${Number(loan.arrearsAmount || 0) > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {formatCurrency(loan.arrearsAmount)}
                      </p>
                      <p className={`mt-1 font-['Sora'] text-[11px] ${Number(loan.arrearsAmount || 0) > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {Number(loan.arrearsAmount || 0) > 0 ? `Overdue month: ${formatMonthLabel(loan.nextDueDate)}` : "No overdue month"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">Repayment History</h3>
                      <span className="font-['Sora'] text-[11px] text-slate-500 dark:text-slate-400">
                        {repayments.length} recorded payment{repayments.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {repayments.length === 0 ? (
                      <div className="mt-3 rounded-md border border-dashed border-slate-300 px-4 py-5 text-center dark:border-slate-700">
                        <p className="font-['Sora'] text-[11px] text-slate-500 dark:text-slate-400">No repayments have been recorded yet.</p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {repayments.map((repayment) => (
                          <div
                            key={repayment._id}
                            className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/40"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-['Sora'] text-xs font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(repayment.amount)}</p>
                                <p className="mt-0.5 font-['Sora'] text-[11px] text-slate-500 dark:text-slate-400">Paid on {formatDate(repayment.paidDate)}</p>
                              </div>
                              <span className={`inline-flex rounded-md border px-2.5 py-1 font-['Sora'] text-[11px] font-semibold ${
                                repayment.wasOverdue
                                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                              }`}>
                                {repayment.wasOverdue ? "Late" : "On time"}
                              </span>
                            </div>

                            <div className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
                              <p className="font-['Sora'] text-[11px] text-slate-500 dark:text-slate-400">Due: {formatDate(repayment.scheduledDueDate)}</p>
                              <p className={`font-['Sora'] text-[11px] ${repayment.wasOverdue ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                                Overdue month: {repayment.wasOverdue ? formatMonthLabel(repayment.scheduledDueDate) : "No overdue month"}
                              </p>
                              <p className={`font-['Sora'] text-[11px] ${Number(repayment.overdueAmountBeforePayment || 0) > 0 ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                                Overdue before: {formatCurrency(repayment.overdueAmountBeforePayment)}
                              </p>
                              <p className={`font-['Sora'] text-[11px] ${Number(repayment.overdueAmountAfterPayment || 0) > 0 ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                                Overdue after: {formatCurrency(repayment.overdueAmountAfterPayment)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default LoanRepaymentsPage;
