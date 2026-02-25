import React, { useState, useRef, useEffect } from 'react';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameRef = useRef(null);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Auto-focus name on mount
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/landing');
      }
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }
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
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
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
      await signup({ name: form.name, email: form.email, password: form.password });
    } catch (error) {
      setErrors({ submit: error.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = form.password;
    if (!pwd) return null;
    if (pwd.length < 6) return { text: 'Weak', color: 'red' };
    if (pwd.length < 8) return { text: 'Fair', color: 'yellow' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) 
      return { text: 'Strong', color: 'emerald' };
    return { text: 'Good', color: 'teal' };
  };

  const strength = getPasswordStrength();

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
              Create Account
            </h1>
            <p className="text-emerald-50 text-sm font-['Sora']">
              Join us and start your learning journey
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

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${errors.name
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
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
                  placeholder="Create a strong password"
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
              {/* Password strength indicator */}
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.color === 'red' ? 'bg-red-500 w-1/4' :
                        strength.color === 'yellow' ? 'bg-yellow-500 w-1/2' :
                        strength.color === 'teal' ? 'bg-teal-500 w-3/4' :
                        'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold font-['Sora'] ${
                    strength.color === 'red' ? 'text-red-500' :
                    strength.color === 'yellow' ? 'text-yellow-500' :
                    strength.color === 'teal' ? 'text-teal-500' :
                    'text-emerald-500'
                  }`}>
                    {strength.text}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-['Sora']">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-md text-sm font-['Sora'] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600
                    ${errors.confirmPassword
                      ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                      : form.confirmPassword && form.password === form.confirmPassword
                        ? 'border-emerald-400 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                </button>
                {/* Check mark when passwords match */}
                {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                  <MdCheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500 text-base pointer-events-none" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] text-red-500 font-['Sora']">{errors.confirmPassword}</p>
              )}
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
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
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
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign in link */}
            <Link
              to="/login"
              className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 transition-all duration-150 cursor-pointer font-['Sora']"
            >
              Sign in instead
            </Link>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 font-['Sora']">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Signup;
