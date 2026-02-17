import React from 'react';
import { MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdPercent, MdAccessTime, MdAttachMoney } from 'react-icons/md';

const PlanCard = ({ plan, onEdit, onDelete, onToggleActive }) => {
  const {
    _id,
    planName,
    description,
    duration,
    interestRate,
    interestType,
    paymentFrequency,
    maxLoanAmount,
    minLoanAmount,
    latePenalty,
    isActive,
  } = plan;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = () => {
    return `${duration.value} ${duration.unit}`;
  };

  const formatInterestType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatPaymentFrequency = (freq) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  return (
    <div className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border ${
      isActive 
        ? 'border-emerald-50 dark:border-emerald-800/40' 
        : 'border-slate-200 dark:border-slate-700'
    } overflow-hidden hover:shadow-md transition-all duration-300 w-full`}>
      
      {/* Header */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isActive 
          ? 'bg-linear-to-br from-emerald-500 to-teal-600' 
          : 'bg-linear-to-br from-slate-400 to-slate-500'
      }`}>
        <button
          onClick={() => onToggleActive && onToggleActive(_id, isActive)}
          title={isActive ? "Click to deactivate" : "Click to activate"}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold tracking-wider px-2 py-1 rounded-full font-['Sora'] transition-colors duration-150 cursor-pointer"
        >
          {isActive ? (
            <>
              <MdVisibility className="text-xs" />
              <span>Active</span>
            </>
          ) : (
            <>
              <MdVisibilityOff className="text-xs" />
              <span>Inactive</span>
            </>
          )}
        </button>
        
        <div className="flex gap-1.5">
          <button
            onClick={() => onEdit && onEdit(plan)}
            title="Edit Plan"
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdEdit className="text-sm text-white transition-colors duration-150 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
          </button>
          <button
            onClick={() => onDelete && onDelete(_id, planName)}
            title="Delete Plan"
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdDelete className="text-sm text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Plan Name */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 leading-tight tracking-tight font-['Sora'] truncate">
          {planName}
        </h3>
        
        {/* Description */}
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Interest Rate */}
          <div className={`rounded-lg p-2.5 ${
            isActive 
              ? 'bg-emerald-50 dark:bg-emerald-900/20' 
              : 'bg-slate-50 dark:bg-slate-700/20'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <MdPercent className={`text-sm ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-slate-500 dark:text-slate-500'
              }`} />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Interest Rate</span>
            </div>
            <p className={`text-lg font-bold font-['Sora'] ${
              isActive 
                ? 'text-emerald-700 dark:text-emerald-300' 
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {interestRate}%
            </p>
            <span className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wide">
              {formatInterestType(interestType)}
            </span>
          </div>

          {/* Duration */}
          <div className={`rounded-lg p-2.5 ${
            isActive 
              ? 'bg-emerald-50 dark:bg-emerald-900/20' 
              : 'bg-slate-50 dark:bg-slate-700/20'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <MdAccessTime className={`text-sm ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-slate-500 dark:text-slate-500'
              }`} />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Duration</span>
            </div>
            <p className={`text-lg font-bold font-['Sora'] ${
              isActive 
                ? 'text-emerald-700 dark:text-emerald-300' 
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {duration.value}
            </p>
            <span className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wide">
              {duration.unit}
            </span>
          </div>
        </div>

        {/* Loan Amount Range */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2.5 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MdAttachMoney className="text-slate-600 dark:text-slate-400 text-sm" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Loan Amount Range</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase">Min</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-['Sora']">
                {formatCurrency(minLoanAmount)}
              </p>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-slate-300 dark:bg-slate-600"></div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase">Max</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-['Sora']">
                {formatCurrency(maxLoanAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2">
          {/* Payment Frequency */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Payment Frequency</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
              {formatPaymentFrequency(paymentFrequency)}
            </span>
          </div>

          {/* Late Penalty */}
          {latePenalty && latePenalty.value > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Late Penalty</span>
              <span className={`font-semibold ${
                isActive 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {latePenalty.type === 'percentage' 
                  ? `${latePenalty.value}%` 
                  : formatCurrency(latePenalty.value)
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
