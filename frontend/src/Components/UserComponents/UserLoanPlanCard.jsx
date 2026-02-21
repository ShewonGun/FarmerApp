import { useState } from "react";
import { HiCurrencyDollar, HiClock, HiCalendar, HiTrendingUp, HiArrowRight, HiCheckCircle } from "react-icons/hi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(duration) {
  const unit = duration.unit === "months" 
    ? duration.value === 1 ? "Month" : "Months"
    : duration.unit === "years"
    ? duration.value === 1 ? "Year" : "Years"
    : duration.unit === "weeks"
    ? duration.value === 1 ? "Week" : "Weeks"
    : duration.value === 1 ? "Day" : "Days";
  
  return `${duration.value} ${unit}`;
}

function formatPaymentFrequency(frequency) {
  const map = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
  };
  return map[frequency] || frequency;
}

function formatInterestType(type) {
  const map = {
    simple: "Simple",
    compound: "Compound",
    flat: "Flat",
    reducing: "Reducing",
  };
  return map[type] || type;
}

// ─── UserLoanPlanCard ─────────────────────────────────────────────────────────
export default function UserLoanPlanCard({ plan, onApply }) {
  const [hovered, setHovered] = useState(false);

  const handleApplyClick = () => {
    if (onApply) {
      onApply(plan);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden
        border transition-all duration-200
        ${
          hovered
            ? "border-emerald-300 dark:border-emerald-700 shadow-lgd dark:shadow-xld -translate-y-0.5"
            : "border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-mdm"
        }
      `}
    >
      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-3">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight font-['Sora']">
              {plan.planName}
            </h3>
            <span className="flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-semibold px-1.5 py-0.5 rounded-full font-['Sora']">
              <HiCheckCircle className="w-2.5 h-2.5" />
              <span>ACTIVE</span>
            </span>
          </div>
          {plan.description && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-1 font-['Sora']">
              {plan.description}
            </p>
          )}
        </div>

        {/* Interest Rate - Prominent */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2.5 py-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <HiTrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium font-['Sora']">
                  Interest Rate
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none font-['Sora']">
                  {plan.interestRate}%
                </p>
              </div>
            </div>
            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-semibold font-['Sora']">
              {formatInterestType(plan.interestType)}
            </span>
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Loan Amount */}
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <HiCurrencyDollar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium font-['Sora']">
                Loan Amount
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight font-['Sora']">
              {formatCurrency(plan.minLoanAmount)}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-['Sora']">
              to {formatCurrency(plan.maxLoanAmount)}
            </p>
          </div>

          {/* Duration */}
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <HiClock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium font-['Sora']">
                Duration
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight font-['Sora']">
              {formatDuration(plan.duration)}
            </p>
          </div>
        </div>

        {/* Payment Frequency */}
        <div className="flex items-center gap-1.5 py-2 border-t border-slate-200 dark:border-slate-700 mb-3">
          <HiCalendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <div>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wide font-['Sora']">
              Payment Frequency
            </p>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-['Sora']">
              {formatPaymentFrequency(plan.paymentFrequency)}
            </p>
          </div>
        </div>

        {/* Late Penalty (if applicable) */}
        {plan.latePenalty && plan.latePenalty.value > 0 && (
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800/30 font-['Sora']">
            <span className="font-medium">Late Penalty:</span>{" "}
            {plan.latePenalty.type === "percentage" 
              ? `${plan.latePenalty.value}%`
              : formatCurrency(plan.latePenalty.value)
            }
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleApplyClick}
          className={`
            w-full flex items-center justify-center gap-1.5 mt-auto
            py-2 px-3 rounded-md text-[12px] font-semibold font-['Sora']
            transition-all duration-150
            ${
              hovered
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }
          `}
        >
          <span>Apply for Loan</span>
          {hovered && <HiArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}