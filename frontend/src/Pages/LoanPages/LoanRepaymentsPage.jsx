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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    <section className="mx-auto w-full max-w-7xl px-2 py-6 md:py-8">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)] dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] px-5 py-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 font-['Sora'] dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <HiCurrencyDollar className="h-4 w-4" />
                  Repayments
                </span>
                <h1 className="mt-4 max-w-2xl font-['Sora'] text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
                  Track every repayment, overdue month, and remaining balance.
                </h1>
                <p className="mt-4 max-w-2xl font-['Sora'] text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Review total payable, paid amount, remaining duration, overdue amounts, and the month each late installment belongs to across your approved loans.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/my-loans"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-['Sora'] text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600"
                  >
                    Back to My Loans
                  </Link>
                  <button
                    type="button"
                    onClick={() => fetchMyLoans({ showRefreshState: true })}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-['Sora'] text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
                  >
                    <HiArrowPath className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh Repayments
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Loans With Repayments</p>
                  <p className="mt-3 font-['Sora'] text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {visibleLoans.filter((loan) => ["active", "completed"].includes((loan.status || "").toLowerCase())).length}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total Paid</p>
                  <p className="mt-3 font-['Sora'] text-xl font-bold text-emerald-600 dark:text-emerald-300">
                    {formatCurrency(visibleLoans.reduce((sum, loan) => sum + Number(loan.totalPaid || 0), 0))}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Current Overdue</p>
                  <p className="mt-3 font-['Sora'] text-xl font-bold text-rose-600 dark:text-rose-300">
                    {formatCurrency(visibleLoans.reduce((sum, loan) => sum + Number(loan.arrearsAmount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">
              Loading your repayment history...
            </p>
          </div>
        ) : visibleLoans.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <HiExclamationTriangle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 font-['Sora'] text-xl font-semibold text-slate-900 dark:text-slate-100">
              No repayment records yet
            </h2>
            <p className="mt-3 font-['Sora'] text-sm leading-7 text-slate-500 dark:text-slate-400">
              Once one of your loans becomes active and repayments are recorded, the full history will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {visibleLoans.map((loan) => {
              const repayments = repaymentsByLoan[loan._id] || [];
              const remainingPayments = countRemainingPayments(loan);

              return (
                <article
                  key={loan._id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-['Sora'] text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {loan.categoryName || "Loan"}
                      </p>
                      <p className="mt-1 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">
                        {loan.planName || "Repayment plan"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 font-['Sora'] text-xs font-semibold ${getStatusTone(loan.status || "pending")}`}>
                      {loan.status || "Pending"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <HiCurrencyDollar className="h-5 w-5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Total Payable</span>
                      </div>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(loan.totalPayable)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <HiCurrencyDollar className="h-5 w-5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Paid Amount</span>
                      </div>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                        {formatCurrency(loan.totalPaid)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <HiClock className="h-5 w-5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Remaining Duration</span>
                      </div>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {remainingPayments} payment{remainingPayments === 1 ? "" : "s"} left
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <HiCalendarDays className="h-5 w-5" />
                        <span className="font-['Sora'] text-[11px] uppercase tracking-[0.2em]">Next Due Date</span>
                      </div>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(loan.nextDueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Remaining Balance
                      </p>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(loan.remainingBalance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Installment Amount
                      </p>
                      <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(loan.installmentAmount || loan.monthlyInstallment)}
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-4 ${Number(loan.arrearsAmount || 0) > 0 ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-700"}`}>
                      <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Overdue Amount
                      </p>
                      <p className={`mt-2 font-['Sora'] text-sm font-semibold ${Number(loan.arrearsAmount || 0) > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {formatCurrency(loan.arrearsAmount)}
                      </p>
                      <p className={`mt-1 font-['Sora'] text-xs ${Number(loan.arrearsAmount || 0) > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {Number(loan.arrearsAmount || 0) > 0 ? `Overdue month: ${formatMonthLabel(loan.nextDueDate)}` : "No overdue month"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Repayment History
                      </h3>
                      <span className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                        {repayments.length} recorded payment{repayments.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {repayments.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
                        <p className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                          No repayments have been recorded for this loan yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {repayments.map((repayment) => (
                          <div
                            key={repayment._id}
                            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(repayment.amount)}
                                </p>
                                <p className="mt-1 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                                  Paid on {formatDate(repayment.paidDate)}
                                </p>
                              </div>
                              <span className={`inline-flex rounded-full border px-3 py-1 font-['Sora'] text-xs font-semibold ${
                                repayment.wasOverdue
                                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                              }`}>
                                {repayment.wasOverdue ? "Late payment" : "On time"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <p className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                                Scheduled due: {formatDate(repayment.scheduledDueDate)}
                              </p>
                              <p className={`font-['Sora'] text-xs ${repayment.wasOverdue ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                                Overdue month: {repayment.wasOverdue ? formatMonthLabel(repayment.scheduledDueDate) : "No overdue month"}
                              </p>
                              <p className={`font-['Sora'] text-xs ${Number(repayment.overdueAmountBeforePayment || 0) > 0 ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                                Overdue before: {formatCurrency(repayment.overdueAmountBeforePayment)}
                              </p>
                              <p className={`font-['Sora'] text-xs ${Number(repayment.overdueAmountAfterPayment || 0) > 0 ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
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
