import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiArrowPath,
  HiCheckBadge,
  HiClipboardDocumentList,
  HiCurrencyDollar,
  HiDocumentArrowUp,
  HiLockClosed,
  HiInformationCircle,
  HiUserCircle,
} from "react-icons/hi2";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

const getDurationInMonths = (duration = {}) => {
  switch (duration.unit) {
    case "days":
      return duration.value / 30;
    case "weeks":
      return duration.value / 4;
    case "years":
      return duration.value * 12;
    case "months":
    default:
      return duration.value;
  }
};

const getPaymentSchedule = (durationInMonths, paymentFrequency = "monthly") => {
  switch (paymentFrequency) {
    case "weekly":
      return Math.max(1, Math.round(durationInMonths * 4));
    case "biweekly":
      return Math.max(1, Math.round(durationInMonths * 2));
    case "quarterly":
      return Math.max(1, Math.round(durationInMonths / 3));
    case "monthly":
    default:
      return Math.max(1, Math.round(durationInMonths));
  }
};

const calculatePreview = (amount, plan) => {
  const principal = Number(amount);

  if (!plan || !Number.isFinite(principal) || principal <= 0) {
    return null;
  }

  const durationInMonths = getDurationInMonths(plan.duration);
  const numberOfPayments = getPaymentSchedule(durationInMonths, plan.paymentFrequency);
  const annualRate = Number(plan.interestRate) / 100;
  let installmentAmount = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (plan.interestType === "reducing" || plan.interestType === "compound") {
    const periodsPerYear =
      plan.paymentFrequency === "weekly"
        ? 52
        : plan.paymentFrequency === "biweekly"
          ? 26
          : plan.paymentFrequency === "quarterly"
            ? 4
            : 12;
    const periodicRate = annualRate / periodsPerYear;

    if (periodicRate > 0) {
      installmentAmount =
        (principal * periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) /
        (Math.pow(1 + periodicRate, numberOfPayments) - 1);
    } else {
      installmentAmount = principal / numberOfPayments;
    }

    totalPayable = installmentAmount * numberOfPayments;
    totalInterest = totalPayable - principal;
  } else {
    totalInterest = principal * annualRate * (durationInMonths / 12);
    totalPayable = principal + totalInterest;
    installmentAmount = totalPayable / numberOfPayments;
  }

  return {
    installmentAmount: Math.round(installmentAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    numberOfPayments,
  };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDuration = (duration = {}) => {
  if (!duration.value || !duration.unit) {
    return "-";
  }

  const label =
    duration.unit === "months"
      ? duration.value === 1
        ? "Month"
        : "Months"
      : duration.unit === "years"
        ? duration.value === 1
          ? "Year"
          : "Years"
        : duration.unit === "weeks"
          ? duration.value === 1
            ? "Week"
            : "Weeks"
          : duration.value === 1
            ? "Day"
            : "Days";

  return `${duration.value} ${label}`;
};

const formatFrequency = (frequency) => {
  const labels = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
  };

  return labels[frequency] || frequency || "-";
};

const formatInterestType = (type) => {
  const labels = {
    simple: "Simple",
    compound: "Compound",
    flat: "Flat",
    reducing: "Reducing",
  };

  return labels[type] || type || "-";
};

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

const saveLoanForFarmer = (userId, loanRecord) => {
  if (!userId || !loanRecord) return;

  const existingLoans = getStoredLoans(userId);
  const dedupedLoans = existingLoans.filter((item) => item._id !== loanRecord._id);
  localStorage.setItem(`farmer-loans:${userId}`, JSON.stringify([loanRecord, ...dedupedLoans]));
};

const LoanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    planId: "",
    amount: "",
    purpose: "",
    agreement: false,
  });
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan._id === form.planId) || null,
    [plans, form.planId]
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === form.categoryId) || null,
    [categories, form.categoryId]
  );

  const amountNumber = Number(form.amount);
  const preview = useMemo(
    () => calculatePreview(amountNumber, selectedPlan),
    [amountNumber, selectedPlan]
  );

  useEffect(() => {
    const routePlanId = location.state?.selectedPlanId;
    const routeAmount = location.state?.suggestedAmount;

    if (routePlanId || routeAmount) {
      setForm((current) => ({
        ...current,
        planId: routePlanId || current.planId,
        amount: routeAmount ? String(routeAmount) : current.amount,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const loadLoanData = async () => {
      const token = localStorage.getItem("token");

      try {
        setLoading(true);
        setServerError("");

        const categoriesResponse = await fetch(`${API_BASE_URL}/loan-categories`);
        const categoriesData = await parseApiResponse(categoriesResponse);

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || categoriesData.error || "Failed to load loan categories.");
        }

        const activeCategories = (categoriesData || []).filter((category) => category.isActive !== false);
        setCategories(activeCategories);

        let activePlans = [];
        if (token) {
          const [plansResponse, profileResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/plans/active`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            user?.id
              ? fetch(`${API_BASE_URL}/user/${user.id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                })
              : Promise.resolve(null),
          ]);

          const plansData = await parseApiResponse(plansResponse);

          if (!plansResponse.ok) {
            throw new Error(plansData.message || "Failed to load loan plans.");
          }

          if (profileResponse) {
            const profileData = await parseApiResponse(profileResponse);
            if (profileResponse.ok) {
              setFarmerProfile(profileData.user || null);
            }
          }

          activePlans = plansData.plans || [];
        }

        setPlans(activePlans);

        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || activeCategories[0]?._id || "",
          planId: current.planId || activePlans[0]?._id || "",
        }));

      } catch (error) {
        setServerError(error.message || "Unable to load loan application data.");
      } finally {
        setLoading(false);
      }
    };

    loadLoanData();
  }, [user?.id]);

  const handleCategorySelect = (categoryId) => {
    setForm((current) => ({ ...current, categoryId }));
  };

  const handlePlanChange = (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, planId: value }));
  };

  const handleAmountChange = (event) => {
    const value = event.target.value;
    if (value === "" || /^[0-9]+(\.[0-9]{0,2})?$/.test(value)) {
      setForm((current) => ({ ...current, amount: value }));
    }
  };

  const handlePurposeChange = (event) => {
    setForm((current) => ({ ...current, purpose: event.target.value }));
  };

  const handleAgreementChange = (event) => {
    setForm((current) => ({ ...current, agreement: event.target.checked }));
  };

  const handleDocumentsChange = (event) => {
    setUploadedDocuments(Array.from(event.target.files || []));
  };

  const scrollToApplicationForm = () => {
    document.getElementById("loan-application-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      document.getElementById("loan-amount")?.focus();
    }, 450);
  };

  const validateForm = () => {
    if (!form.categoryId) {
      return "Please select a loan category.";
    }

    if (!form.planId) {
      return "Please select a repayment plan.";
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return "Enter a valid loan amount.";
    }

    if (!form.purpose.trim()) {
      return "Please enter the purpose of your loan.";
    }

    if (selectedPlan) {
      if (amountNumber < selectedPlan.minLoanAmount || amountNumber > selectedPlan.maxLoanAmount) {
        return `Loan amount must be between ${formatCurrency(selectedPlan.minLoanAmount)} and ${formatCurrency(selectedPlan.maxLoanAmount)}.`;
      }
    }

    if (!form.agreement) {
      return "Please confirm the loan application agreement.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to continue.");
      navigate("/login", {
        state: {
          redirectTo: "/loan",
        },
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/loans/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: form.categoryId,
          planId: form.planId,
          amount: amountNumber,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Loan application failed.");
      }

      const createdLoan = {
        ...data,
        farmerId: user?.id || data.farmerId || "",
        farmerName: farmerProfile?.name || user?.name || "",
        farmerEmail: farmerProfile?.email || user?.email || "",
        categoryName: selectedCategory?.name || data.categoryName || "Loan Category",
        planName: selectedPlan?.planName || data.planName || "Repayment Plan",
        purpose: form.purpose.trim(),
        submittedAt: new Date().toISOString(),
        requiredDocuments: uploadedDocuments.map((file) => file.name),
        repaymentPreview: preview,
        paymentFrequency: selectedPlan?.paymentFrequency || data.paymentFrequency || "",
        installmentAmount:
          data.installmentAmount ||
          data.monthlyInstallment ||
          preview?.installmentAmount ||
          0,
        status: data.status || "Pending",
      };

      saveLoanForFarmer(user?.id, createdLoan);

      toast.success("Loan application submitted successfully.");
      setForm((current) => ({
        ...current,
        amount: "",
        purpose: "",
        agreement: false,
      }));
      setUploadedDocuments([]);
      navigate("/my-loans");
    } catch (error) {
      toast.error(error.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-block h-11 w-11 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">Preparing your loan workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto py-6 md:py-8 px-2">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[28px] border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-slate-900 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] px-5 py-6 md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 font-['Sora'] dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <HiCheckBadge className="h-4 w-4" />
                  Loan Application
                </span>
                <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Sora'] md:text-4xl">
                  Apply for a loan with one clear flow.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 font-['Sora']">
                  Choose the purpose, pick a repayment plan, enter the amount, and submit. Full repayment details can stay on the profile side later.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <span className="rounded-full bg-white/85 px-3 py-2 shadow-sm dark:bg-slate-900/70">
                    {categories.length} categories available
                  </span>
                  <span className="rounded-full bg-white/85 px-3 py-2 shadow-sm dark:bg-slate-900/70">
                    {plans.length} active plans
                  </span>
                </div>

                <button
                  type="button"
                  onClick={isAuthenticated ? scrollToApplicationForm : () => navigate("/login", { state: { redirectTo: "/loan" } })}
                  className="mt-7 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 font-['Sora'] shadow-[0_18px_35px_-18px_rgba(16,185,129,0.85)]"
                >
                  {isAuthenticated ? "Apply for Loan" : "Log In to Apply"}
                </button>
                <Link
                  to="/loan-calculator"
                  className="mt-3 inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white/85 px-7 py-3.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 font-['Sora'] dark:border-emerald-800 dark:bg-slate-900/65 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                >
                  Open Loan Calculator
                </Link>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Quick Overview</p>
                <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <p>
                    {selectedCategory ? `${selectedCategory.name} selected` : "Choose a loan category to get started."}
                  </p>
                  <p>
                    {selectedPlan
                      ? `${selectedPlan.planName} gives you ${formatDuration(selectedPlan.duration).toLowerCase()} with ${formatFrequency(selectedPlan.paymentFrequency).toLowerCase()} repayments.`
                      : "Pick a repayment plan to preview the expected installment."}
                  </p>
                  <p>
                    {preview
                      ? `Estimated installment: ${formatCurrency(preview.installmentAmount)}`
                      : "Enter an amount to see your repayment estimate."}
                  </p>
                  <p>
                    Compare total interest, total repayment, and a penalty example in the calculator before applying.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Sora'] dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {serverError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <form
            id="loan-application-form"
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Application Form</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Select category, plan, and amount</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/loan-plans")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 font-['Sora'] dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
              >
                <HiArrowPath className="h-4 w-4" />
                Browse all plans
              </button>
            </div>

              <div className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <HiClipboardDocumentList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Selected Category</p>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100 font-['Sora']">
                    {selectedCategory?.name || "Choose a category"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400 font-['Sora']">
                    {selectedCategory?.description || "Pick the purpose that best matches the loan request."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <HiCurrencyDollar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Selected Plan</p>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100 font-['Sora']">
                    {selectedPlan?.planName || "Choose a repayment plan"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400 font-['Sora']">
                    {selectedPlan
                      ? `${formatDuration(selectedPlan.duration)} • ${formatFrequency(selectedPlan.paymentFrequency)} • ${selectedPlan.interestRate}%`
                      : "Plan terms will appear here once selected."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                Loan Category
              </label>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {categories.map((category) => {
                  const active = category._id === form.categoryId;
                  return (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => handleCategorySelect(category._id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-700 dark:bg-emerald-900/20"
                          : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">{category.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">{category.code || "Category"}</p>
                        </div>
                        {active && <HiCheckBadge className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 font-['Sora']">
                        {category.description || "Use this category to classify the purpose of your loan request."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="loan-plan" className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Repayment Plan
                </label>
                <select
                  id="loan-plan"
                  value={form.planId}
                  onChange={handlePlanChange}
                  disabled={!isAuthenticated || plans.length === 0}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                >
                  {!isAuthenticated && <option value="">Log in to view plans</option>}
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.planName} - {formatFrequency(plan.paymentFrequency)} - {plan.interestRate}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="loan-amount" className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Loan Amount
                </label>
                <div className="relative mt-3">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 font-['Sora']">
                    LKR
                  </span>
                  <input
                    id="loan-amount"
                    value={form.amount}
                    onChange={handleAmountChange}
                    placeholder={selectedPlan ? `${selectedPlan.minLoanAmount}` : "Enter amount"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-14 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
                  />
                </div>
                {selectedPlan && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                    Available range: {formatCurrency(selectedPlan.minLoanAmount)} to {formatCurrency(selectedPlan.maxLoanAmount)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="loan-purpose" className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                Purpose of Loan
              </label>
              <textarea
                id="loan-purpose"
                value={form.purpose}
                onChange={handlePurposeChange}
                rows={4}
                placeholder="Explain what the loan will be used for, such as seeds, equipment, irrigation, or livestock support."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <HiUserCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Farmer Details</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Full Name</p>
                  <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 font-['Sora']">
                    {farmerProfile?.name || user?.name || "Login required"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Email</p>
                  <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 font-['Sora']">
                    {farmerProfile?.email || user?.email || "Login required"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Role</p>
                  <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 font-['Sora']">
                    {farmerProfile?.role || user?.role || "Farmer"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Account Status</p>
                  <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 font-['Sora']">
                    {isAuthenticated ? "Auto-filled from your account" : "Login to auto-fill your details"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <HiDocumentArrowUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Required Documents</p>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <p className="text-xs leading-6 text-slate-500 dark:text-slate-400 font-['Sora']">
                    {selectedCategory?.requiredDocuments?.length
                      ? "Upload the supporting files listed for the selected category."
                      : "This category does not list specific required documents yet."}
                  </p>
                  {selectedCategory?.requiredDocuments?.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 font-['Sora']">
                      {selectedCategory.requiredDocuments.map((documentName) => (
                        <li key={documentName} className="flex items-center gap-2">
                          <HiCheckBadge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{documentName}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 dark:border-slate-600 dark:bg-slate-900/50">
                  <input
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 font-['Sora'] dark:text-slate-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
                  />
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400 font-['Sora']">
                    Selected files stay on the page for review. Backend upload wiring can be connected next if you want full document submission support.
                  </p>
                  {uploadedDocuments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedDocuments.map((file) => (
                        <p key={`${file.name}-${file.size}`} className="text-xs text-slate-600 dark:text-slate-300 font-['Sora']">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <HiLockClosed className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="text-sm leading-6 text-slate-700 dark:text-slate-300 font-['Sora']">
                    <p>Browsing is open, but you need to log in before selecting a plan and submitting a loan request.</p>
                    <button
                      type="button"
                      onClick={() => navigate("/login", { state: { redirectTo: "/loan" } })}
                      className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                <input
                  type="checkbox"
                  checked={form.agreement}
                  onChange={handleAgreementChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I confirm that the selected category, plan, loan purpose, and farmer details are accurate for this application.
                </span>
              </label>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  {isAuthenticated
                    ? "Applications are submitted through your logged-in farmer account."
                    : "Log in to activate the loan application form."}
                </p>
                <button
                  type="submit"
                  disabled={submitting || !selectedPlan || !selectedCategory || !isAuthenticated}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60 font-['Sora']"
                >
                  {submitting ? "Submitting..." : isAuthenticated ? "Submit Loan Request" : "Login Required"}
                </button>
              </div>
            </div>
          </form>

          <div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <HiCurrencyDollar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Overview</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                    {selectedPlan ? "Quick plan snapshot" : "Select a plan"}
                  </h3>
                </div>
              </div>
              {selectedPlan ? (
                <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Selected Plan</p>
                    <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{selectedPlan.planName}</p>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span>Total Payable</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{preview ? formatCurrency(preview.totalPayable) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Installment Amount</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{preview ? formatCurrency(preview.installmentAmount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Number of Payments</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{preview?.numberOfPayments || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Repayment Frequency</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatFrequency(selectedPlan.paymentFrequency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Interest Type</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{formatInterestType(selectedPlan.interestType)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">Select a plan to see the repayment summary preview here.</p>
              )}
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <HiInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="text-sm leading-6 text-slate-700 dark:text-slate-300 font-['Sora']">
                    <p>
                      Categories describe the loan purpose, while plans define the interest, duration, payment frequency, and allowed amount range.
                    </p>
                    <Link
                      to="/loan-calculator"
                      className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Try the calculator
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoanPage;
