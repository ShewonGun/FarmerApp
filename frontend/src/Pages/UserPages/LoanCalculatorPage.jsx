import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiArrowPath,
  HiCalculator,
  HiCheckBadge,
  HiCurrencyDollar,
  HiInformationCircle,
} from "react-icons/hi2";
import {
  calculatePenaltyExample,
  calculatePreview,
  formatDuration,
  formatFrequency,
  formatInterestType,
} from "../../utils/loan/loanPreview";

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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getPenaltyLabel = (plan, penaltyAmount) => {
  if (!plan?.latePenalty?.value) {
    return "No late penalty configured";
  }

  if (plan.latePenalty.type === "fixed") {
    return `${formatCurrency(penaltyAmount)} fixed late fee`;
  }

  return `${plan.latePenalty.value}% of one installment as a late-fee example`;
};

const LoanCalculatorPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    planId: "",
    amount: "",
  });

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === form.categoryId) || null,
    [categories, form.categoryId]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan._id === form.planId) || null,
    [plans, form.planId]
  );

  const amountNumber = Number(form.amount);
  const preview = useMemo(
    () => calculatePreview(amountNumber, selectedPlan),
    [amountNumber, selectedPlan]
  );

  const penaltyExample = useMemo(
    () => calculatePenaltyExample(selectedPlan, preview?.installmentAmount),
    [preview?.installmentAmount, selectedPlan]
  );

  useEffect(() => {
    const loadCalculatorData = async () => {
      const token = localStorage.getItem("token");

      try {
        setLoading(true);
        setServerError("");

        const categoriesResponse = await fetch(`${API_BASE_URL}/loan-categories`);
        const categoriesData = await parseApiResponse(categoriesResponse);

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || "Failed to load loan categories.");
        }

        const activeCategories = (categoriesData || []).filter((category) => category.isActive !== false);
        setCategories(activeCategories);

        let activePlans = [];
        if (token) {
          const plansResponse = await fetch(`${API_BASE_URL}/plans/active`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const plansData = await parseApiResponse(plansResponse);

          if (!plansResponse.ok) {
            throw new Error(plansData.message || "Failed to load active plans.");
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
        setServerError(error.message || "Unable to load calculator data.");
      } finally {
        setLoading(false);
      }
    };

    loadCalculatorData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-block h-11 w-11 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-['Sora']">Preparing your calculator...</p>
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
              <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <HiCalculator className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] font-['Sora']">Loan Calculator</span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Estimate before you apply
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                Select category, plan, and amount to preview repayment terms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/loan"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 font-['Sora']"
              >
                Back to Loan
              </Link>
              <button
                type="button"
                onClick={() =>
                  navigate("/loan", {
                    state: {
                      selectedPlanId: form.planId,
                      suggestedAmount: form.amount,
                    },
                  })
                }
                disabled={!selectedPlan || !form.amount}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 font-['Sora'] dark:border-slate-700 dark:text-slate-300"
              >
                Use Terms
              </button>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Sora'] dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {serverError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                Inputs
              </h2>
              <Link
                to="/loan-plans"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 font-['Sora'] dark:border-slate-700 dark:text-slate-300"
              >
                <HiArrowPath className="h-4 w-4" />
                Plans
              </Link>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Category
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => {
                    const active = category._id === form.categoryId;
                    return (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, categoryId: category._id }))}
                        className={`rounded-md border p-3 text-left ${
                          active
                            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                            : "border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50"
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
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Repayment Plan
                  </label>
                  <select
                    value={form.planId}
                    onChange={(event) => setForm((current) => ({ ...current, planId: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {plans.length === 0 && <option value="">Log in to load active plans</option>}
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.planName} - {formatFrequency(plan.paymentFrequency)} - {plan.interestRate}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">
                    Loan Amount
                  </label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-['Sora']">
                      LKR
                    </span>
                    <input
                      value={form.amount}
                      onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
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

              <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-2">
                  <HiInformationCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  <p className="text-xs leading-5 text-slate-700 dark:text-slate-300 font-['Sora']">
                    This preview helps planning only. Final values are validated on submission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <HiCurrencyDollar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                  Calculation Result
                </h3>
              </div>

              {preview ? (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50/90 p-3 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Installment</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.installmentAmount)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50/90 p-3 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Payments</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{preview.numberOfPayments}</p>
                  </div>
                  <div className="rounded-md bg-slate-50/90 p-3 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Interest</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.totalInterest)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50/90 p-3 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Repayment</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.totalPayable)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Select a plan and amount to view results.
                </p>
              )}
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-['Sora']">Plan Snapshot</p>
              {selectedPlan ? (
                <div className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <div className="flex items-center justify-between"><span>Category</span><span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCategory?.name || "-"}</span></div>
                  <div className="flex items-center justify-between"><span>Duration</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatDuration(selectedPlan.duration)}</span></div>
                  <div className="flex items-center justify-between"><span>Frequency</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatFrequency(selectedPlan.paymentFrequency)}</span></div>
                  <div className="flex items-center justify-between"><span>Interest Type</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatInterestType(selectedPlan.interestType)}</span></div>
                  <div className="flex items-center justify-between"><span>Penalty Example</span><span className="font-semibold text-rose-600 dark:text-rose-300">{preview ? formatCurrency(penaltyExample) : "-"}</span></div>
                  <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                    {preview ? getPenaltyLabel(selectedPlan, penaltyExample) : "Penalty example appears after calculation."}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Log in and select a plan to compare terms.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoanCalculatorPage;
