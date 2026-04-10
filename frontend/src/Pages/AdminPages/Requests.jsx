import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MdCheckCircle,
  MdClose,
  MdFilterList,
  MdOutlineCalendarToday,
  MdOutlinePayments,
  MdRefresh,
  MdSearch,
  MdWarningAmber,
} from "react-icons/md";
import { showError, showSuccess } from "../../utils/toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusTone = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/40";
  }

  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40";
  }

  if (normalized === "rejected") {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40";
  }

  return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40";
};

const Requests = () => {
  const [loans, setLoans] = useState([]);
  const [repaymentsByLoan, setRepaymentsByLoan] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeLoanId, setActiveLoanId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    plan: "all",
    status: "all",
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/loans/admin`, {
        headers: getAuthHeaders(),
      });
      setLoans(response.data.loans || []);
    } catch (error) {
      console.error("Error loading admin loans:", error);
      showError("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchRepayments = async (loanId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/loans/repay/${loanId}`, {
        headers: getAuthHeaders(),
      });
      setRepaymentsByLoan((current) => ({
        ...current,
        [loanId]: response.data || [],
      }));
    } catch (error) {
      console.error("Error loading repayments:", error);
      showError("Failed to load repayments for this loan");
    }
  };

  const handleApprove = async (loanId) => {
    try {
      await axios.put(`${API_BASE_URL}/loans/approve/${loanId}`, {}, {
        headers: getAuthHeaders(),
      });
      showSuccess("Loan approved successfully");
      await fetchLoans();
      setActiveLoanId(loanId);
      await fetchRepayments(loanId);
    } catch (error) {
      console.error("Error approving loan:", error);
      showError(error?.response?.data?.message || "Failed to approve loan");
    }
  };

  const handleReject = async (loanId) => {
    try {
      await axios.put(`${API_BASE_URL}/loans/reject/${loanId}`, {}, {
        headers: getAuthHeaders(),
      });
      showSuccess("Loan rejected successfully");
      await fetchLoans();
    } catch (error) {
      console.error("Error rejecting loan:", error);
      showError(error?.response?.data?.message || "Failed to reject loan");
    }
  };

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const normalizedSearch = filters.search.trim().toLowerCase();
      const searchMatch =
        !normalizedSearch ||
        (loan.farmerName || "").toLowerCase().includes(normalizedSearch) ||
        (loan.farmerEmail || "").toLowerCase().includes(normalizedSearch) ||
        (loan.categoryName || "").toLowerCase().includes(normalizedSearch) ||
        (loan.planName || "").toLowerCase().includes(normalizedSearch);

      const categoryMatch = filters.category === "all" || loan.categoryName === filters.category;
      const planMatch = filters.plan === "all" || loan.planName === filters.plan;
      const statusMatch = filters.status === "all" || (loan.status || "").toLowerCase() === filters.status;

      return searchMatch && categoryMatch && planMatch && statusMatch;
    });
  }, [filters, loans]);

  const categories = [...new Set(loans.map((loan) => loan.categoryName).filter(Boolean))];
  const plans = [...new Set(loans.map((loan) => loan.planName).filter(Boolean))];
  const selectedLoan = loans.find((loan) => loan._id === activeLoanId) || null;
  const selectedRepayments = activeLoanId ? repaymentsByLoan[activeLoanId] || [] : [];

  return (
    <div className="p-4 md:p-5 lg:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] tracking-tight">
                Loan Applications Review
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                Review all applied loans, search by category and plan, approve or reject applications, and inspect repayments once a loan becomes active.
              </p>
            </div>

            <button
              onClick={fetchLoans}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 font-['Sora']"
            >
              <MdRefresh className={loading ? "animate-spin text-base" : "text-base"} />
              Refresh Applications
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-5">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-lg text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              Search & Filters
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search farmer, category or plan"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
              />
            </label>

            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.plan}
              onChange={(event) => setFilters((current) => ({ ...current, plan: event.target.value }))}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
            >
              <option value="all">All Plans</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-4">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                  Applied Loans
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  {filteredLoans.length} applications match your current filters.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  No loan applications found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLoans.map((loan) => (
                  <button
                    key={loan._id}
                    type="button"
                    onClick={async () => {
                      setActiveLoanId(loan._id);
                      if ((loan.status || "").toLowerCase() === "active" || (loan.status || "").toLowerCase() === "completed") {
                        await fetchRepayments(loan._id);
                      }
                    }}
                    className={`w-full text-left px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
                      activeLoanId === loan._id ? "bg-emerald-50/70 dark:bg-emerald-900/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                          {loan.farmerName || "Unknown Farmer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                          {loan.farmerEmail || "No email"}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-['Sora']">
                          {loan.categoryName} | {loan.planName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold font-['Sora'] ${getStatusTone(loan.status)}`}>
                          {loan.status}
                        </span>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                          {formatCurrency(loan.amount)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-5">
            {!selectedLoan ? (
              <div className="flex min-h-[280px] items-center justify-center text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                    Select a loan application
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400 font-['Sora']">
                    Choose any application on the left to review its details, then approve or reject it.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      Loan Review
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {selectedLoan.farmerName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                      {selectedLoan.categoryName} | {selectedLoan.planName}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold font-['Sora'] ${getStatusTone(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Amount</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(selectedLoan.amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Submitted</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatDate(selectedLoan.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Payable</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(selectedLoan.totalPayable)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Installment</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(selectedLoan.installmentAmount || selectedLoan.monthlyInstallment)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {(selectedLoan.status || "").toLowerCase() === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedLoan._id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 font-['Sora']"
                      >
                        <MdCheckCircle className="text-base" />
                        Approve Loan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(selectedLoan._id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 font-['Sora']"
                      >
                        <MdClose className="text-base" />
                        Reject Loan
                      </button>
                    </>
                  )}

                  {((selectedLoan.status || "").toLowerCase() === "active" || (selectedLoan.status || "").toLowerCase() === "completed") && (
                    <button
                      type="button"
                      onClick={() => fetchRepayments(selectedLoan._id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 font-['Sora'] dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                    >
                      <MdOutlinePayments className="text-base" />
                      Load Repayments
                    </button>
                  )}
                </div>

                {((selectedLoan.status || "").toLowerCase() === "active" || (selectedLoan.status || "").toLowerCase() === "completed") && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2">
                      <MdOutlinePayments className="text-lg text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                        Repayments
                      </h3>
                    </div>

                    {selectedRepayments.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-6 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                          No repayments recorded yet for this loan.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {selectedRepayments.map((repayment) => (
                          <div
                            key={repayment._id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                                  {formatCurrency(repayment.amount)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                                  Paid on {formatDate(repayment.paidDate)}
                                </p>
                              </div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold font-['Sora'] ${
                                repayment.wasOverdue
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
                              }`}>
                                {repayment.wasOverdue ? "Late" : "On Time"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                                <div className="flex items-center gap-2">
                                  <MdOutlineCalendarToday className="text-sm" />
                                  Scheduled Due: {formatDate(repayment.scheduledDueDate)}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                                Overdue Before: {formatCurrency(repayment.overdueAmountBeforePayment)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                                Overdue After: {formatCurrency(repayment.overdueAmountAfterPayment)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                                Installments Covered: {repayment.installmentsCovered || 0}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedLoan.arrearsAmount > 0 && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <MdWarningAmber className="text-base" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] font-['Sora']">
                        Arrears
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 font-['Sora']">
                      Current arrears amount: {formatCurrency(selectedLoan.arrearsAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Requests;
