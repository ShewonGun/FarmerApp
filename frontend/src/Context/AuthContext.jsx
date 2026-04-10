import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Safe in-app path only (e.g. /support-ticket) — blocks open redirects */
function safeRedirectPath(next) {
  if (!next || typeof next !== 'string') return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('..')) return null;
  return trimmed;
}

function getPostAuthPath(role, redirectAfter, fallback = '/landing') {
  if (role === 'admin') return '/admin';
  if (role === 'farmer') return fallback;
  const next = safeRedirectPath(redirectAfter);
  if (next && !next.startsWith('/admin')) return next;
  return fallback;
}

/** Keeps id/picture shape consistent across login, localStorage, and GET /user/:id */
function normalizeUser(raw, fallback = {}) {
  if (!raw) return null;
  const id = raw.id ?? raw._id ?? fallback.id ?? fallback._id;
  const idStr =
    id != null && typeof id === 'object' && typeof id.toString === 'function'
      ? id.toString()
      : String(id ?? '');
  let picture = '';
  if (typeof raw.picture === 'string') picture = raw.picture.trim();
  else if (typeof fallback.picture === 'string') picture = fallback.picture.trim();
  return {
    id: idStr,
    name: raw.name ?? fallback.name ?? '',
    email: raw.email ?? fallback.email ?? '',
    role: raw.role ?? fallback.role ?? 'farmer',
    picture
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session from localStorage, then refresh profile from API (picture, etc.)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = normalizeUser(parsed, {});
        if (normalized) setUser(normalized);
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    if (!storedToken || !storedUser) return undefined;

    let localUser;
    try {
      localUser = normalizeUser(JSON.parse(storedUser), {});
    } catch {
      return undefined;
    }
    const id = localUser?.id;
    if (!id) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/${id}`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const data = await response.json();
        if (cancelled || !response.ok || !data.success || !data.user) return;
        const merged = normalizeUser(data.user, localUser);
        if (merged) {
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } catch {
        // offline / server down — keep cached user
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (credentials, redirectAfter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success) {
        const userData = normalizeUser(data.user, {});
        if (!userData?.id) {
          throw new Error('Invalid user data from server');
        }

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        
        const destination = getPostAuthPath(userData.role, redirectAfter);
        navigate(destination);
        
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData, redirectAfter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      if (data.success) {
        const newUser = normalizeUser(data.user, {});
        if (!newUser?.id) {
          throw new Error('Invalid user data from server');
        }

        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', data.token);
        
        const destination = getPostAuthPath(newUser.role, redirectAfter);
        navigate(destination);
        
        return data;
      } else {
        throw new Error(data.message || 'Signup failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    const wasAdmin = user?.role === 'admin';
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/', {
      replace: true,
      state: wasAdmin ? { fromAdminLogout: true } : undefined
    });
  };

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => {
      const next = normalizeUser(updatedUser, prev || {});
      if (!next) return prev;
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const loginWithGoogle = async (credential, redirectAfter) => {
    const response = await fetch(`${API_BASE_URL}/google-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google sign-in failed');
    }

    if (data.success) {
      const userData = normalizeUser(data.user, {});
      if (!userData?.id) {
        throw new Error('Invalid user data from server');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);

      const destination = getPostAuthPath(userData.role, redirectAfter);
      navigate(destination);

      return data;
    }

    throw new Error(data.message || 'Google sign-in failed');
  };

  const value = {
    user,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
