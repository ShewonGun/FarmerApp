import React, { useState, useEffect, useRef } from 'react';
import { MdClose } from 'react-icons/md';

const initialForm = {
  planName: '',
  description: '',
  duration: {
    value: 12,
    unit: 'months',
  },
  interestRate: 10,
  interestType: 'flat',
  paymentFrequency: 'monthly',
  maxLoanAmount: 10000,
  minLoanAmount: 1000,
  latePenalty: {
    type: 'percentage',
    value: 5,
  },
  isActive: true,
};

const AddPlanModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);
  
  // Use gray colors when editing an inactive plan
  const isInactiveEdit = initialData && !initialData.isActive;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 80);
      if (initialData) {
        setForm({
          planName: initialData.planName || '',
          description: initialData.description || '',
          duration: initialData.duration || { value: 12, unit: 'months' },
          interestRate: initialData.interestRate || 10,
          interestType: initialData.interestType || 'flat',
          paymentFrequency: initialData.paymentFrequency || 'monthly',
          maxLoanAmount: initialData.maxLoanAmount || 10000,
          minLoanAmount: initialData.minLoanAmount || 1000,
          latePenalty: initialData.latePenalty || { type: 'percentage', value: 5 },
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const validate = () => {
    const errs = {};
    if (!form.planName.trim()) errs.planName = 'Plan name is required.';
    if (form.duration.value < 1) errs.duration = 'Duration must be at least 1.';
    if (form.interestRate < 0 || form.interestRate > 100) errs.interestRate = 'Interest rate must be between 0 and 100.';
    if (form.minLoanAmount < 0) errs.minLoanAmount = 'Minimum loan amount must be positive.';
    if (form.maxLoanAmount < 0) errs.maxLoanAmount = 'Maximum loan amount must be positive.';
    if (form.minLoanAmount > form.maxLoanAmount) errs.minLoanAmount = 'Min cannot exceed max amount.';
    if (form.latePenalty.value < 0) errs.latePenalty = 'Late penalty must be positive.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm((f) => ({
        ...f,
        [parent]: {
          ...f[parent],
          [child]: type === 'number' ? Number(value) : value,
        },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
    }
    
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit?.(form);
      onClose();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {/* Header */}
        <div className={`px-3 py-2 flex items-center justify-between ${
          isInactiveEdit 
            ? 'bg-linear-to-br from-slate-400 to-slate-500' 
            : 'bg-linear-to-br from-emerald-500 to-teal-600'
        }`}>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">
              {initialData ? 'Edit Plan' : 'Add Repayment Plan'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="group bg-transparent border border-transparent text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150"
          >
            <MdClose className="text-sm text-white transition-colors duration-150 group-hover:text-red-500 dark:group-hover:text-red-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Plan Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Plan Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                name="planName"
                value={form.planName}
                onChange={handleChange}
                placeholder="e.g., Standard Agricultural Loan"
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                  ${errors.planName
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isInactiveEdit
                    ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
              />
              {errors.planName && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.planName}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Description
                <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the plan..."
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none
                  ${errors.description
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isInactiveEdit
                    ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
              />
            </div>

            {/* Duration & Interest Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Duration <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="duration.value"
                    value={form.duration.value}
                    onChange={handleChange}
                    min="1"
                    className={`px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none
                      ${errors.duration
                        ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                        : isInactiveEdit
                        ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                      }`}
                  />
                  <select
                    name="duration.unit"
                    value={form.duration.unit}
                    onChange={handleChange}
                    className={`px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none ${
                      isInactiveEdit
                        ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                {errors.duration && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.duration}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Interest Rate (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="interestRate"
                  value={form.interestRate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none
                    ${errors.interestRate
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
                {errors.interestRate && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.interestRate}</p>}
              </div>
            </div>

            {/* Interest Type & Payment Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Interest Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="interestType"
                  value={form.interestType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none ${
                    isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
                >
                  <option value="simple">Simple</option>
                  <option value="compound">Compound</option>
                  <option value="flat">Flat</option>
                  <option value="reducing">Reducing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Payment Frequency <span className="text-red-400">*</span>
                </label>
                <select
                  name="paymentFrequency"
                  value={form.paymentFrequency}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none ${
                    isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>

            {/* Loan Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Min Loan Amount ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="minLoanAmount"
                  value={form.minLoanAmount}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none
                    ${errors.minLoanAmount
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
                {errors.minLoanAmount && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.minLoanAmount}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                  Max Loan Amount ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="maxLoanAmount"
                  value={form.maxLoanAmount}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none
                    ${errors.maxLoanAmount
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
                {errors.maxLoanAmount && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.maxLoanAmount}</p>}
              </div>
            </div>

            {/* Late Penalty */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Late Penalty
                <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="latePenalty.type"
                  value={form.latePenalty.type}
                  onChange={handleChange}
                  className={`px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none ${
                    isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input
                  type="number"
                  name="latePenalty.value"
                  value={form.latePenalty.value}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder={form.latePenalty.type === 'percentage' ? 'e.g., 5' : 'e.g., 50'}
                  className={`col-span-2 px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                    isInactiveEdit
                      ? 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
                />
              </div>
              {errors.latePenalty && <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.latePenalty}</p>}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-['Sora']">
                  Active Status
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-['Sora'] mt-0.5">
                  Available for loan applications
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0
                  ${form.isActive
                    ? isInactiveEdit
                      ? 'bg-linear-to-r from-slate-400 to-slate-500'
                      : 'bg-linear-to-r from-emerald-500 to-teal-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                  }`}
              >
                <span
                  className={`inline-block w-4 h-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200
                    ${form.isActive ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-['Sora']">
              <span className="text-red-400">*</span> Required fields
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-[12px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-150 cursor-pointer font-['Sora'] active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isInactiveEdit
                    ? 'bg-linear-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 shadow-slate-200 dark:shadow-slate-900/30 hover:shadow-md hover:shadow-slate-200/80 dark:hover:shadow-slate-900/40'
                    : 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    {initialData ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    {initialData ? 'Save Changes' : 'Create Plan'}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlanModal;
