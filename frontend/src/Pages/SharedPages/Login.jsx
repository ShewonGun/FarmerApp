import React, { useState, useRef, useEffect } from 'react';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await login(form);
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-200 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-200 dark:bg-teal-900/20 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          
          {/* Header */}
          <div className="bg-linear-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center">
            <h1 className="text-white font-bold text-2xl mb-2 font-['Sora']">
              Welcome Back
            </h1>
            <p className="text-emerald-50 text-sm font-['Sora']">
              Sign in to continue to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-4">
            
            {/* Submit error */}
            {errors.submit && (
              <div className="px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <p className="text-sm text-red-600 dark:text-red-400 font-['Sora']">{errors.submit}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${errors.email
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${errors.password
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.password}</p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold font-['Sora'] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-md hover:shadow-emerald-200/80 dark:hover:shadow-emerald-900/40 transition-all duration-200 cursor-pointer font-['Sora'] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-['Sora']">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign up link */}
            <Link
              to="/signup"
              className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 transition-all duration-150 cursor-pointer font-['Sora']"
            >
              Create an account
            </Link>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 font-['Sora']">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;