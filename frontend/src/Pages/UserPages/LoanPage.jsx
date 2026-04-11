import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiArrowPath,
  HiCheckBadge,
  HiClipboardDocumentList,
  HiCurrencyDollar,
  HiLockClosed,
  HiInformationCircle,
  HiUserCircle,
} from "react-icons/hi2";
import { useAuth } from "../../Context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
    <section className="w-full max-w-6xl mx-auto py-6 px-2">
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Loan Application
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                Select category, plan, and amount. Submit in one step.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
              <span>{categories.length} categories</span>
              <span>•</span>
              <span>{plans.length} plans</span>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Sora'] dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {serverError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <form
            id="loan-application-form"
            onSubmit={handleSubmit}
            className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Apply
              </h2>
              <button
                type="button"
                onClick={() => navigate("/loan-plans")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 font-['Sora']"
              >
                <HiArrowPath className="h-4 w-4" />
                Plans
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Loan Category
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => {
                    const active = category._id === form.categoryId;
                    return (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => handleCategorySelect(category._id)}
                        className={`rounded-md border p-3 text-left ${
                          active
                            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                            : "border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">{category.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-['Sora']">{category.code || "Category"}</p>
                          </div>
                          {active && <HiCheckBadge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="loan-plan" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Repayment Plan
                  </label>
                  <select
                    id="loan-plan"
                    value={form.planId}
                    onChange={handlePlanChange}
                    disabled={!isAuthenticated || plans.length === 0}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  <label htmlFor="loan-amount" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Loan Amount
                  </label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-['Sora']">
                      LKR
                    </span>
                    <input
                      id="loan-amount"
                      value={form.amount}
                      onChange={handleAmountChange}
                      placeholder={selectedPlan ? `${selectedPlan.minLoanAmount}` : "Enter amount"}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400 font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  {selectedPlan && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                      Range: {formatCurrency(selectedPlan.minLoanAmount)} to {formatCurrency(selectedPlan.maxLoanAmount)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="loan-purpose" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Purpose
                </label>
                <textarea
                  id="loan-purpose"
                  value={form.purpose}
                  onChange={handlePurposeChange}
                  rows={3}
                  placeholder="What will you use this loan for?"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <HiUserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Farmer Details</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm font-['Sora'] text-slate-700 dark:text-slate-300">
                  <p>{farmerProfile?.name || user?.name || "Login required"}</p>
                  <p>{farmerProfile?.email || user?.email || "Login required"}</p>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2.5">
                    <HiLockClosed className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                    <div className="text-sm text-slate-700 dark:text-slate-300 font-['Sora']">
                      <p>Login is required to submit.</p>
                      <button
                        type="button"
                        onClick={() => navigate("/login", { state: { redirectTo: "/loan" } })}
                        className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Go to Login
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Sora']">
                  <input
                    type="checkbox"
                    checked={form.agreement}
                    onChange={handleAgreementChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>I confirm these details are accurate.</span>
                </label>
                <button
                  type="submit"
                  disabled={submitting || !selectedPlan || !selectedCategory || !isAuthenticated}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 font-['Sora']"
                >
                  {submitting ? "Submitting..." : isAuthenticated ? "Submit Loan Request" : "Login Required"}
                </button>
              </div>
            </div>
          </form>

          <aside className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 h-max">
            <div className="flex items-center gap-2">
              <HiCurrencyDollar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Overview</h3>
            </div>

            {selectedPlan ? (
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedPlan.planName}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><span>Total Payable</span><span className="font-semibold text-slate-900 dark:text-slate-100">{preview ? formatCurrency(preview.totalPayable) : "-"}</span></div>
                  <div className="flex items-center justify-between"><span>Installment</span><span className="font-semibold text-slate-900 dark:text-slate-100">{preview ? formatCurrency(preview.installmentAmount) : "-"}</span></div>
                  <div className="flex items-center justify-between"><span>Payments</span><span className="font-semibold text-slate-900 dark:text-slate-100">{preview?.numberOfPayments || "-"}</span></div>
                  <div className="flex items-center justify-between"><span>Frequency</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatFrequency(selectedPlan.paymentFrequency)}</span></div>
                  <div className="flex items-center justify-between"><span>Interest Type</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatInterestType(selectedPlan.interestType)}</span></div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">Select a plan to preview repayment details.</p>
            )}

            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-2">
                <HiInformationCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                <div className="text-xs leading-5 text-slate-700 dark:text-slate-300 font-['Sora']">
                  Categories define loan purpose. Plans define range and repayment terms.
                  <Link
                    to="/loan-calculator"
                    className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Open Calculator
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default LoanPage;
