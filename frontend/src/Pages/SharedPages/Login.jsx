import React, { useState, useRef, useEffect } from 'react';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../Context/AuthContext';
import AuthSplitLayout from '../../Components/SharedComponents/AuthSplitLayout';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/landing', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

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
      await login(form, searchParams.get('next'));
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

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
          Welcome!
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
          Please enter your details to login.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {errors.submit && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm text-red-600 dark:text-red-400 font-['Sora']">{errors.submit}</p>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora'] mb-1">
              Email address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="login-email"
                ref={emailRef}
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
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-300 font-['Sora']">
                Password
              </label>
              <span
                className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-['Sora'] cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              >
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
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
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-['Sora']">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all duration-200 font-['Sora'] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              'Log In'
            )}
          </button>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-['Sora'] uppercase tracking-wider">
                    Or
                  </span>
                </div>
              </div>

              <div className="flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      setErrors({});
                      await loginWithGoogle(credentialResponse.credential, searchParams.get('next'));
                    } catch (error) {
                      setErrors({ submit: error.message || 'Google sign-in failed. Please try again.' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    setErrors({ submit: 'Google sign-in was cancelled or could not complete.' });
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="medium"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </>
          )}
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400 font-['Sora']">
          Don&apos;t have an account yet?{' '}
          <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};

export default Login;
