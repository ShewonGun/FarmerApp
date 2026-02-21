import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdBook } from 'react-icons/md';

const initialForm = {
  title: '',
  content: '',
  assetUrl: '',
  youtubeUrl: '',
  thumbnailUrl: '',
};

const AddLessonModal = ({ isOpen, onClose, onSubmit, courseId, initialData = null, isPublished = true }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const titleRef = useRef(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 80);
      setForm(initialData ? {
        title: initialData.title || '',
        content: initialData.content || '',
        assetUrl: initialData.assetUrl || '',
        youtubeUrl: initialData.youtubeUrl || '',
        thumbnailUrl: initialData.thumbnailUrl || '',
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
    if (!form.title.trim()) errs.title = 'Lesson title is required.';
    if (!form.content.trim()) errs.content = 'Content is required.';
    if (form.assetUrl && !/^https?:\/\/.+/.test(form.assetUrl))
      errs.assetUrl = 'Must be a valid URL starting with http(s)://';
    if (form.youtubeUrl && !/^https?:\/\/.+/.test(form.youtubeUrl))
      errs.youtubeUrl = 'Must be a valid URL starting with http(s)://';
    if (form.thumbnailUrl && !/^https?:\/\/.+/.test(form.thumbnailUrl))
      errs.thumbnailUrl = 'Must be a valid URL starting with http(s)://';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit?.({ ...form, course: courseId });
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
        <div className={`px-3 py-2 flex items-center justify-between ${
          isPublished 
            ? 'bg-linear-to-br from-emerald-500 to-teal-600' 
            : 'bg-linear-to-br from-slate-400 to-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-[15px] leading-tight font-['Sora']">
                  {initialData ? 'Edit Lesson' : 'Add Lesson'}
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
                Lesson Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Introduction to Financial Literacy"
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                  ${errors.title
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPublished
                    ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                  }`}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Lesson content and description"
                rows={4}
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none
                  ${errors.content
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPublished
                    ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                  }`}
              />
              {errors.content && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.content}</p>
              )}
            </div>

            {/* YouTube URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                YouTube URL
                <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full px-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                  ${errors.youtubeUrl
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPublished
                    ? 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/20'
                  }`}
              />
              {errors.youtubeUrl && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.youtubeUrl}</p>
              )}
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
                  isPublished
                    ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40'
                    : 'bg-linear-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 shadow-slate-200 dark:shadow-slate-900/30 hover:shadow-md hover:shadow-slate-200/80 dark:hover:shadow-slate-900/40'
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
                    {initialData ? 'Save Changes' : 'Create Lesson'}
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

export default AddLessonModal;
