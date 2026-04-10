import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MdCalendarToday,
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

const roundCurrency = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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

const getStatusTone = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/40";
  }

  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-700";
};

const calculatePenaltyFee = (baseAmount, latePenalty) => {
  const normalizedBase = Number(baseAmount || 0);
  const penaltyValue = Number(latePenalty?.value || 0);

  if (normalizedBase <= 0 || penaltyValue <= 0) {
    return 0;
  }

  if (latePenalty?.type === "fixed") {
    return roundCurrency(penaltyValue);
  }

  return roundCurrency((normalizedBase * penaltyValue) / 100);
};

const getPenaltyLabel = (latePenalty) => {
  if (!latePenalty?.value) {
    return "No late penalty rule";
  }

  if (latePenalty.type === "fixed") {
    return `${formatCurrency(latePenalty.value)} fixed fee`;
  }

  return `${latePenalty.value}% of overdue amount`;
};

const LoanRepayments = () => {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingRepayments, setLoadingRepayments] = useState(false);
  const [savingRepayment, setSavingRepayment] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    plan: "all",
    status: "active",
  });
  const [repaymentForm, setRepaymentForm] = useState({
    amount: "",
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const fetchLoans = async ({ preserveSelection = true } = {}) => {
    try {
      setLoadingLoans(true);
      const response = await axios.get(`${API_BASE_URL}/loans/admin`, {
        headers: getAuthHeaders(),
      });

      const nextLoans = response.data.loans || [];
      setLoans(nextLoans);

      if (preserveSelection && selectedLoanId) {
        const stillExists = nextLoans.some((loan) => loan._id === selectedLoanId);
        if (!stillExists) {
          setSelectedLoanId("");
          setRepayments([]);
        }
      }
    } catch (error) {
      console.error("Error loading loans:", error);
      showError("Failed to load loan records");
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchRepayments = async (loanId) => {
    if (!loanId) {
      setRepayments([]);
      return;
    }

    try {
      setLoadingRepayments(true);
      const response = await axios.get(`${API_BASE_URL}/loans/repay/${loanId}`, {
        headers: getAuthHeaders(),
      });
      setRepayments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading repayments:", error);
      showError("Failed to load repayment history");
      setRepayments([]);
    } finally {
      setLoadingRepayments(false);
    }
  };

  useEffect(() => {
    fetchLoans({ preserveSelection: false });
  }, []);

  const activeLoans = useMemo(() => {
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

  useEffect(() => {
    if (!selectedLoanId && activeLoans.length > 0) {
      setSelectedLoanId(activeLoans[0]._id);
      return;
    }

    if (selectedLoanId && !activeLoans.some((loan) => loan._id === selectedLoanId)) {
      setSelectedLoanId(activeLoans[0]?._id || "");
    }
  }, [activeLoans, selectedLoanId]);

  useEffect(() => {
    if (selectedLoanId) {
      fetchRepayments(selectedLoanId);
    } else {
      setRepayments([]);
    }
  }, [selectedLoanId]);

  const categories = [...new Set(loans.map((loan) => loan.categoryName).filter(Boolean))];
  const plans = [...new Set(loans.map((loan) => loan.planName).filter(Boolean))];
  const selectedLoan = loans.find((loan) => loan._id === selectedLoanId) || null;

  const handleRepaymentSubmit = async (event) => {
    event.preventDefault();

    if (!selectedLoan) {
      showError("Select a loan before recording a repayment");
      return;
    }

    const amount = Number(repaymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showError("Enter a valid repayment amount");
      return;
    }

    if (!repaymentForm.paidDate) {
      showError("Choose the repayment date");
      return;
    }

    try {
      setSavingRepayment(true);
      await axios.post(
        `${API_BASE_URL}/loans/repay/${selectedLoan._id}`,
        {
          amount,
          paidDate: repaymentForm.paidDate,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      showSuccess("Repayment recorded successfully");
      setRepaymentForm({
        amount: "",
        paidDate: new Date().toISOString().slice(0, 10),
      });
      await fetchLoans();
      await fetchRepayments(selectedLoan._id);
    } catch (error) {
      console.error("Error recording repayment:", error);
      showError(error?.response?.data?.message || "Failed to record repayment");
    } finally {
      setSavingRepayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900 md:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-['Sora'] text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-xl">
                Loan Repayments
              </h1>
              <p className="mt-1 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                Record repayments for approved loans, confirm current balances, and review the full repayment trail before the farmer leaves the desk.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchLoans()}
              disabled={loadingLoans}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-['Sora'] text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <MdRefresh className={loadingLoans ? "animate-spin text-base" : "text-base"} />
              Refresh Loans
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search farmer, category or plan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="active">Active Loans</option>
              <option value="completed">Completed Loans</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
              <h2 className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
                Eligible Loan Accounts
              </h2>
              <p className="mt-1 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                {activeLoans.length} loans match your current filters.
              </p>
            </div>

            {loadingLoans ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="font-['Sora'] text-sm text-slate-600 dark:text-slate-300">
                  No loans available for repayment posting right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeLoans.map((loan) => (
                  <button
                    key={loan._id}
                    type="button"
                    onClick={() => setSelectedLoanId(loan._id)}
                    className={`w-full px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
                      selectedLoanId === loan._id ? "bg-emerald-50/70 dark:bg-emerald-900/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {loan.farmerName || "Unknown Farmer"}
                        </p>
                        <p className="mt-1 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                          {loan.categoryName} | {loan.planName}
                        </p>
                        <p className="mt-2 font-['Sora'] text-xs text-slate-600 dark:text-slate-300">
                          Remaining {formatCurrency(loan.remainingBalance)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full border px-3 py-1 font-['Sora'] text-xs font-semibold ${getStatusTone(loan.status)}`}>
                          {loan.status}
                        </span>
                        <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(loan.installmentAmount || loan.monthlyInstallment)}
                        </p>
                        <p className="mt-1 font-['Sora'] text-[11px] text-slate-500 dark:text-slate-400">
                          Due {formatDate(loan.nextDueDate)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-5">
            {!selectedLoan ? (
              <div className="flex min-h-[320px] items-center justify-center text-center">
                <div>
                  <p className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Select a loan account
                  </p>
                  <p className="mt-2 font-['Sora'] text-xs leading-6 text-slate-500 dark:text-slate-400">
                    Pick an active loan from the list to record a repayment and review its running collection history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Repayment Desk
                    </p>
                    <h2 className="mt-2 font-['Sora'] text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedLoan.farmerName}
                    </h2>
                    <p className="mt-1 font-['Sora'] text-sm text-slate-500 dark:text-slate-400">
                      {selectedLoan.categoryName} | {selectedLoan.planName}
                    </p>
                  </div>

                  <span className={`inline-flex rounded-full border px-3 py-1 font-['Sora'] text-xs font-semibold ${getStatusTone(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Remaining Balance</p>
                    <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(selectedLoan.remainingBalance)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Installment Amount</p>
                    <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(selectedLoan.installmentAmount || selectedLoan.monthlyInstallment)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total Paid</p>
                    <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(selectedLoan.totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Next Due Date</p>
                    <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(selectedLoan.nextDueDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-900/60">
                    <p className="font-['Sora'] text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Overdue Month</p>
                    <p className="mt-2 font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedLoan.arrearsAmount > 0 ? formatMonthLabel(selectedLoan.nextDueDate) : "No overdue month"}
                    </p>
                  </div>
                </div>

                {selectedLoan.arrearsAmount > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <MdWarningAmber className="text-base" />
                      <p className="font-['Sora'] text-xs font-semibold uppercase tracking-[0.2em]">
                        Arrears Alert
                      </p>
                    </div>
                    <p className="mt-2 font-['Sora'] text-sm text-slate-700 dark:text-slate-200">
                      Current overdue amount: {formatCurrency(selectedLoan.arrearsAmount)}
                    </p>
                    <p className="mt-1 font-['Sora'] text-sm font-semibold text-rose-600 dark:text-rose-300">
                      Overdue month: {formatMonthLabel(selectedLoan.nextDueDate)}
                    </p>
                    <p className="mt-1 font-['Sora'] text-sm font-semibold text-rose-600 dark:text-rose-300">
                      Penalty fee: {formatCurrency(calculatePenaltyFee(selectedLoan.arrearsAmount, selectedLoan.latePenalty))}
                    </p>
                    <p className="mt-1 font-['Sora'] text-xs text-slate-600 dark:text-slate-300">
                      Penalty rule: {getPenaltyLabel(selectedLoan.latePenalty)}
                    </p>
                  </div>
                )}

                {selectedLoan.status.toLowerCase() !== "active" ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center dark:border-slate-700">
                    <p className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      This loan is not open for repayments
                    </p>
                    <p className="mt-2 font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                      Only active loans can receive new repayment postings.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRepaymentSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <MdOutlinePayments className="text-lg text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Record Repayment
                      </h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="font-['Sora'] text-xs font-medium text-slate-600 dark:text-slate-300">
                          Repayment Amount
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={repaymentForm.amount}
                          onChange={(event) => setRepaymentForm((current) => ({ ...current, amount: event.target.value }))}
                          placeholder="Enter collected amount"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="font-['Sora'] text-xs font-medium text-slate-600 dark:text-slate-300">
                          Paid Date
                        </span>
                        <div className="relative">
                          <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400" />
                          <input
                            type="date"
                            value={repaymentForm.paidDate}
                            onChange={(event) => setRepaymentForm((current) => ({ ...current, paidDate: event.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 font-['Sora'] text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingRepayment}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 font-['Sora'] text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      <MdOutlinePayments className="text-base" />
                      {savingRepayment ? "Saving Repayment..." : "Update Loan Repayment"}
                    </button>
                  </form>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-['Sora'] text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Repayment History
                    </h3>
                    <button
                      type="button"
                      onClick={() => fetchRepayments(selectedLoan._id)}
                      disabled={loadingRepayments}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-['Sora'] text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                    >
                      <MdRefresh className={loadingRepayments ? "animate-spin text-sm" : "text-sm"} />
                      Refresh History
                    </button>
                  </div>

                  {loadingRepayments ? (
                    <div className="mt-4 flex items-center justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  ) : repayments.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
                      <p className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                        No repayments recorded yet for this loan.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {repayments.map((repayment) => (
                        <div
                          key={repayment._id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50"
                        >
                          <div className="flex items-start justify-between gap-3">
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
                                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                            }`}>
                              {repayment.wasOverdue ? "Late" : "On Time"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <p className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                              Scheduled Due: {formatDate(repayment.scheduledDueDate)}
                            </p>
                            <p className={`font-['Sora'] text-xs ${repayment.wasOverdue ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                              Overdue Month: {repayment.wasOverdue ? formatMonthLabel(repayment.scheduledDueDate) : "No overdue month"}
                            </p>
                            <p className={`font-['Sora'] text-xs ${repayment.wasOverdue ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                              Overdue Before: {formatCurrency(repayment.overdueAmountBeforePayment)}
                            </p>
                            <p className={`font-['Sora'] text-xs ${repayment.overdueAmountAfterPayment > 0 ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                              Overdue After: {formatCurrency(repayment.overdueAmountAfterPayment)}
                            </p>
                            <p className={`font-['Sora'] text-xs ${repayment.wasOverdue ? "font-semibold text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                              Penalty Fee: {repayment.wasOverdue ? formatCurrency(calculatePenaltyFee(repayment.overdueAmountBeforePayment, selectedLoan.latePenalty)) : formatCurrency(0)}
                            </p>
                            <p className="font-['Sora'] text-xs text-slate-500 dark:text-slate-400">
                              Installments Covered: {repayment.installmentsCovered || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoanRepayments;
