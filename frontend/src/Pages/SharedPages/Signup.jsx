import React, { useState, useRef, useEffect } from 'react';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import AuthSplitLayout from '../../Components/SharedComponents/AuthSplitLayout';

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

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

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

  const inputClass = (field) =>
    `w-full pl-11 pr-3 py-2.5 rounded-xl text-sm font-['Sora'] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border transition-all duration-150 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
      errors[field]
        ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
    }`;

  return (
    <AuthSplitLayout>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-['Sora'] tracking-tight">
          Create account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
          Please enter your details to register.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
          {errors.submit && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm text-red-600 dark:text-red-400 font-['Sora']">{errors.submit}</p>
            </div>
          )}

          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora'] mb-1">
              Full name
            </label>
            <div className="relative">
              <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="signup-name"
                ref={nameRef}
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                className={inputClass('name')}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500 font-['Sora']">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora'] mb-1">
              Email address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="signup-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                autoComplete="email"
                className={inputClass('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-['Sora']">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora'] mb-1">
              Password
            </label>
            <div className="relative">
              <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                className={`${inputClass('password')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
              </button>
            </div>
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
              <p className="mt-1.5 text-xs text-red-500 font-['Sora']">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora'] mb-1">
              Confirm password
            </label>
            <div className="relative">
              <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="signup-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={`${inputClass('confirmPassword')} pr-11 ${
                  form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword
                    ? 'border-emerald-400 dark:border-emerald-500'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
              </button>
              {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                <MdCheckCircle className="absolute right-11 top-1/2 -translate-y-1/2 text-emerald-500 text-lg pointer-events-none" />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500 font-['Sora']">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all duration-200 font-['Sora'] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};

export default Signup;
