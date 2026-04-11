import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MdAccessTime,
  MdAttachMoney,
  MdCalendarMonth,
  MdCheckCircle,
  MdFilterList,
  MdInfoOutline,
  MdPayments,
  MdRefresh,
  MdSearch,
  MdTrendingUp,
  MdWarningAmber,
} from "react-icons/md";
import { showError } from "../../utils/toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LOAN_ENDPOINT_CANDIDATES = ["/loans", "/admin/loans", "/loans/admin"];

const demoLoans = [
  {
    _id: "demo-loan-1",
    farmerName: "Nimal Perera",
    farmerEmail: "nimal@example.com",
    categoryName: "Crop Loan",
    planName: "6 Month Standard",
    amount: 20000,
    totalPayable: 21200,
    installmentAmount: 3533.33,
    totalPaid: 7066.66,
    remainingBalance: 14133.34,
    arrearsAmount: 0,
    paymentFrequency: "monthly",
    status: "Active",
    nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "demo-loan-2",
    farmerName: "Sanduni Fernando",
    farmerEmail: "sanduni@example.com",
    categoryName: "Equipment Loan",
    planName: "12 Month Flexible",
    amount: 60000,
    totalPayable: 64800,
    installmentAmount: 5400,
    totalPaid: 10800,
    remainingBalance: 54000,
    arrearsAmount: 3200,
    paymentFrequency: "monthly",
    status: "Active",
    nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "demo-loan-3",
    farmerName: "Ashan Kumara",
    farmerEmail: "ashan@example.com",
    categoryName: "Livestock Loan",
    planName: "Weekly Micro Plan",
    amount: 12000,
    totalPayable: 12600,
    installmentAmount: 1050,
    totalPaid: 12600,
    remainingBalance: 0,
    arrearsAmount: 0,
    paymentFrequency: "weekly",
    status: "Completed",
    nextDueDate: null,
    approvedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const parseResponseList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.loans)) return data.loans;
  if (Array.isArray(data?.data)) return data.data;
  return [];
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

const daysUntil = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

const deriveLoanBucket = (loan) => {
  const status = (loan.status || "").toLowerCase();
  const dueInDays = daysUntil(loan.nextDueDate);
  const arrearsAmount = Number(loan.arrearsAmount || 0);

  if (status === "completed") return "completed";
  if (status === "active" && (arrearsAmount > 0 || (dueInDays !== null && dueInDays < 0))) return "overdue";
  if (status === "active" && dueInDays !== null && dueInDays >= 0 && dueInDays <= 7) return "dueSoon";
  return "active";
};

const getStatusTone = (bucket) => {
  switch (bucket) {
    case "overdue":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40";
    case "dueSoon":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

const normalizeLoan = (loan) => {
  const installmentAmount = Number(loan.installmentAmount || loan.monthlyInstallment || 0);
  const categoryName =
    loan.categoryName ||
    loan.category?.name ||
    loan.categoryLabel ||
    (typeof loan.category === "string" ? loan.category : "Uncategorized");
  const planName =
    loan.planName ||
    loan.plan?.planName ||
    loan.planLabel ||
    (typeof loan.plan === "string" ? loan.plan : "No plan");
  const farmerName =
    loan.farmerName ||
    loan.farmerId?.name ||
    loan.farmer?.name ||
    loan.borrowerName ||
    "Unknown farmer";
  const farmerEmail =
    loan.farmerEmail ||
    loan.farmerId?.email ||
    loan.farmer?.email ||
    "";

  return {
    ...loan,
    installmentAmount,
    categoryName,
    planName,
    farmerName,
    farmerEmail,
    arrearsAmount: Number(loan.arrearsAmount || 0),
    remainingBalance: Number(loan.remainingBalance || 0),
    totalPayable: Number(loan.totalPayable || 0),
    totalPaid: Number(loan.totalPaid || 0),
    statusBucket: deriveLoanBucket({ ...loan, installmentAmount }),
  };
};

const Requests = () => {
  const [loans, setLoans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    plan: "all",
    status: "all",
    arrears: "all",
    date: "all",
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setUsingDemoData(false);

      const [categoriesRes, plansRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/loan-categories`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders() }),
      ]);

      if (categoriesRes.status === "fulfilled") {
        setCategories(categoriesRes.value.data || []);
      }

      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.data?.plans || []);
      }

      let loanList = [];
      let fetched = false;

      for (const endpoint of LOAN_ENDPOINT_CANDIDATES) {
        try {
          const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            headers: getAuthHeaders(),
          });
          loanList = parseResponseList(response.data);
          fetched = true;
          break;
        } catch (error) {
          if (error?.response?.status && error.response.status !== 404) {
            throw error;
          }
        }
      }

      if (!fetched) {
        setUsingDemoData(true);
        loanList = demoLoans;
      }

      setLoans(loanList.map(normalizeLoan));
    } catch (error) {
      console.error("Error fetching loan management data:", error);
      setUsingDemoData(true);
      setLoans(demoLoans.map(normalizeLoan));
      showError("Loan API is not fully available yet. Showing preview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const normalizedSearch = filters.search.trim().toLowerCase();
      const dueDate = loan.nextDueDate ? new Date(loan.nextDueDate) : null;
      const now = new Date();
      const dateMatch =
        filters.date === "all" ||
        (filters.date === "today" && dueDate && dueDate.toDateString() === now.toDateString()) ||
        (filters.date === "thisWeek" && dueDate && daysUntil(dueDate) !== null && daysUntil(dueDate) <= 7 && daysUntil(dueDate) >= 0) ||
        (filters.date === "past" && dueDate && daysUntil(dueDate) !== null && daysUntil(dueDate) < 0);

      const searchMatch =
        !normalizedSearch ||
        loan.farmerName.toLowerCase().includes(normalizedSearch) ||
        loan.farmerEmail.toLowerCase().includes(normalizedSearch) ||
        loan.categoryName.toLowerCase().includes(normalizedSearch) ||
        loan.planName.toLowerCase().includes(normalizedSearch);

      const categoryMatch = filters.category === "all" || loan.categoryName === filters.category;
      const planMatch = filters.plan === "all" || loan.planName === filters.plan;
      const statusMatch = filters.status === "all" || loan.statusBucket === filters.status;
      const arrearsMatch =
        filters.arrears === "all" ||
        (filters.arrears === "withArrears" && loan.arrearsAmount > 0) ||
        (filters.arrears === "clear" && loan.arrearsAmount <= 0);

      return searchMatch && categoryMatch && planMatch && statusMatch && arrearsMatch && dateMatch;
    });
  }, [filters, loans]);

  const groupedCounts = useMemo(() => {
    const counts = {
      active: 0,
      dueSoon: 0,
      overdue: 0,
      completed: 0,
    };

    loans.forEach((loan) => {
      counts[loan.statusBucket] += 1;
    });

    return counts;
  }, [loans]);

  const totalArrears = useMemo(
    () => loans.reduce((sum, loan) => sum + Number(loan.arrearsAmount || 0), 0),
    [loans]
  );

  const filterOptions = {
    categories:
      categories.length > 0
        ? categories.map((category) => category.name)
        : [...new Set(loans.map((loan) => loan.categoryName))],
    plans:
      plans.length > 0
        ? plans.map((plan) => plan.planName)
        : [...new Set(loans.map((loan) => loan.planName))],
  };

  const summaryCards = [
    {
      label: "All Active Loans",
      value: groupedCounts.active + groupedCounts.dueSoon + groupedCounts.overdue,
      helper: `${formatCurrency(totalArrears)} total arrears tracked`,
      icon: MdAttachMoney,
      tone: "from-emerald-500 to-teal-500",
    },
    {
      label: "Due Soon",
      value: groupedCounts.dueSoon,
      helper: "Installments due within 7 days",
      icon: MdAccessTime,
      tone: "from-amber-500 to-orange-500",
    },
    {
      label: "Overdue",
      value: groupedCounts.overdue,
      helper: "Arrears or missed due dates",
      icon: MdWarningAmber,
      tone: "from-rose-500 to-red-500",
    },
    {
      label: "Completed",
      value: groupedCounts.completed,
      helper: "Fully settled loans",
      icon: MdCheckCircle,
      tone: "from-sky-500 to-cyan-500",
    },
  ];

  return (
    <div className="p-4 md:p-5 lg:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora'] tracking-tight">
                Active Loans Management
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                View all active loans and details, track due soon and overdue accounts, and filter by category, plan, status, arrears, and date.
              </p>
            </div>

            <button
              onClick={fetchLoans}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 font-['Sora']"
            >
              <MdRefresh className={loading ? "animate-spin text-base" : "text-base"} />
              Refresh Loans
            </button>
          </div>

          {usingDemoData && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <MdInfoOutline className="mt-0.5 text-lg text-amber-600 dark:text-amber-300 shrink-0" />
                <p className="text-xs leading-6 text-amber-800 dark:text-amber-200 font-['Sora']">
                  Preview mode is active because the backend does not yet expose a full admin loan-list endpoint. The page layout, filters, and statuses are ready, and it will switch to real data as soon as that endpoint exists.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                      {card.label}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loading ? "..." : card.value}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                      {card.helper}
                    </p>
                  </div>
                  <div className={`rounded-2xl bg-linear-to-r ${card.tone} p-3 text-white shadow-sm`}>
                    <Icon className="text-xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-5">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-lg text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
              Filters
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <label className="relative xl:col-span-2">
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
              {filterOptions.categories.map((category) => (
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
              {filterOptions.plans.map((plan) => (
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
              <option value="active">Active</option>
              <option value="dueSoon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>

            <div className="grid grid-cols-2 gap-3 xl:col-span-2">
              <select
                value={filters.arrears}
                onChange={(event) => setFilters((current) => ({ ...current, arrears: event.target.value }))}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
              >
                <option value="all">All Arrears</option>
                <option value="withArrears">With Arrears</option>
                <option value="clear">Arrears Cleared</option>
              </select>

              <select
                value={filters.date}
                onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-400 font-['Sora']"
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today</option>
                <option value="thisWeek">This Week</option>
                <option value="past">Past Due</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-4">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                  Loan Portfolio
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  {filteredLoans.length} loan records match the current filters.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <MdInfoOutline className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  No loans match the current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr>
                      {["Farmer", "Category / Plan", "Status", "Due Date", "Arrears", "Balance"].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                            {loan.farmerName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                            {loan.farmerEmail || "No email"}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm text-slate-900 dark:text-slate-100 font-['Sora']">{loan.categoryName}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">{loan.planName}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold font-['Sora'] ${getStatusTone(loan.statusBucket)}`}>
                            {loan.statusBucket === "dueSoon"
                              ? "Due Soon"
                              : loan.statusBucket.charAt(0).toUpperCase() + loan.statusBucket.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm text-slate-900 dark:text-slate-100 font-['Sora']">{formatDate(loan.nextDueDate)}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                            {loan.nextDueDate ? `${daysUntil(loan.nextDueDate)} days` : "Closed"}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                            {formatCurrency(loan.arrearsAmount)}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                            {formatCurrency(loan.remainingBalance)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredLoans.slice(0, 4).map((loan) => (
              <div
                key={loan._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {loan.farmerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                      {loan.categoryName} • {loan.planName}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold font-['Sora'] ${getStatusTone(loan.statusBucket)}`}>
                    {loan.statusBucket === "dueSoon"
                      ? "Due Soon"
                      : loan.statusBucket.charAt(0).toUpperCase() + loan.statusBucket.slice(1)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MdPayments className="text-base" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Installment</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.installmentAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MdCalendarMonth className="text-base" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Next Due</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatDate(loan.nextDueDate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MdTrendingUp className="text-base" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Paid</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.totalPaid)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MdAttachMoney className="text-base" />
                      <span className="text-[11px] uppercase tracking-[0.2em] font-['Sora']">Balance</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.remainingBalance)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">Arrears</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                      {formatCurrency(loan.arrearsAmount)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${
                        loan.arrearsAmount > 0 ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          loan.totalPayable > 0
                            ? (loan.totalPaid / loan.totalPayable) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredLoans.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-10 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Adjust filters or connect the loan-list endpoint to populate detailed cards here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Requests;
