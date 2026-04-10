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
    <section className="w-full max-w-7xl mx-auto py-6 md:py-8 px-2">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[28px] border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-slate-900 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))] px-5 py-6 md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 font-['Sora'] dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <HiCalculator className="h-4 w-4" />
                  Loan Calculator
                </span>
                <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Sora'] md:text-4xl">
                  Simulate the loan before you apply.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 font-['Sora']">
                  Choose a category, compare a plan, enter the amount, and get a fast estimate for installments, interest, total repayment, and a late-fee example.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/loan"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 font-['Sora']"
                  >
                    Back to Loan Page
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
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white/85 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 font-['Sora'] dark:border-emerald-800 dark:bg-slate-900/65 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                  >
                    Use These Terms
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Snapshot</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <p>{selectedCategory ? `Category: ${selectedCategory.name}` : "Choose a category first."}</p>
                  <p>{selectedPlan ? `Plan: ${selectedPlan.planName}` : "Log in to load active plans."}</p>
                  <p>{preview ? `Estimated repayment: ${formatCurrency(preview.totalPayable)}` : "Enter an amount to see the estimate."}</p>
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

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Calculator Inputs</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">Compare your loan terms</h2>
              </div>
              <Link
                to="/loan-plans"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 font-['Sora'] dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
              >
                <HiArrowPath className="h-4 w-4" />
                Browse plans
              </Link>
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
                      onClick={() => setForm((current) => ({ ...current, categoryId: category._id }))}
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
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Repayment Plan
                </label>
                <select
                  value={form.planId}
                  onChange={(event) => setForm((current) => ({ ...current, planId: event.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white font-['Sora'] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500"
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
                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">
                  Loan Amount
                </label>
                <div className="relative mt-3">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 font-['Sora']">
                    LKR
                  </span>
                  <input
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
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

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <HiInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 font-['Sora']">
                  This simulator is for planning. It shows the expected installment amount, number of payments, total interest, total repayment, and one example of a late penalty using the selected plan.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <HiCurrencyDollar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Calculation Result</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Sora']">
                    {selectedPlan ? "Your estimate" : "Choose a plan"}
                  </h3>
                </div>
              </div>

              {preview ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Installment Amount</p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.installmentAmount)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Number of Payments</p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{preview.numberOfPayments}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Interest</p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.totalInterest)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/90 p-4 dark:bg-slate-800/50">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Total Repayment</p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 font-['Sora']">{formatCurrency(preview.totalPayable)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Select a plan and enter an amount to see the repayment breakdown here.
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-['Sora']">Plan Snapshot</p>
              {selectedPlan ? (
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 font-['Sora']">
                  <div className="flex items-center justify-between">
                    <span>Selected Category</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCategory?.name || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duration</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDuration(selectedPlan.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Repayment Frequency</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatFrequency(selectedPlan.paymentFrequency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Interest Type</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatInterestType(selectedPlan.interestType)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Penalty Example</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-300">{preview ? formatCurrency(penaltyExample) : "-"}</span>
                  </div>
                  <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                    {preview ? getPenaltyLabel(selectedPlan, penaltyExample) : "Penalty example appears after calculation."}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
                  Log in and select a plan to compare repayment terms.
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
