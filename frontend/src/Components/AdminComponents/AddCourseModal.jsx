import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdCloudUpload, MdBook } from 'react-icons/md';

const initialForm = {
  title: '',
  description: '',
  thumbnailUrl: '',
  isPublished: false,
};

const AddCourseModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const titleRef = useRef(null);

  // Auto-focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 80);
      setForm(initialData ? {
        title: initialData.title || '',
        description: initialData.description || '',
        thumbnailUrl: initialData.thumbnailUrl || '',
        isPublished: initialData.isPublished || false,
      } : initialForm);
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Course title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (form.thumbnailUrl && !/^https?:\/\/.+/.test(form.thumbnailUrl))
      errs.thumbnailUrl = 'Must be a valid URL starting with http(s)://';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit?.({ ...form, enrollmentCount: 0, noOfLessons: 0 });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-br from-emerald-500 to-teal-600 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">
                  {initialData ? 'Edit Course' : 'Add Course'}
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
          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Course Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Advanced React Patterns"
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                  ${errors.title
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What will students learn in this course?"
                rows={3}
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none
                  ${errors.description
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                  }`}
              />
              {errors.description && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.description}</p>
              )}
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Thumbnail URL
                <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <MdCloudUpload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
                  name="thumbnailUrl"
                  value={form.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${errors.thumbnailUrl
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
              </div>
              {errors.thumbnailUrl && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.thumbnailUrl}</p>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-['Sora']">
                  Publish immediately
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-['Sora'] mt-0.5">
                  Make this course visible to students
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isPublished}
                onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                className={`relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0
                  ${form.isPublished
                    ? 'bg-linear-to-r from-emerald-500 to-teal-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                  }`}
              >
                <span
                  className={`inline-block w-4 h-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200
                    ${form.isPublished ? 'translate-x-5.5' : 'translate-x-0.5'}`}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40 transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    {initialData ? 'Save Changes' : 'Create Course'}
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

export default AddCourseModal;