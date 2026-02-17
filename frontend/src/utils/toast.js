import toast from 'react-hot-toast';

// Get theme-aware styles
const getToastStyles = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    style: {
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: isDark ? '#3b82f6' : '#2563eb',
      secondary: isDark ? '#1e293b' : '#ffffff',
    },
  };
};

// Success toast
export const showSuccess = (message) => {
  toast.success(message, {
    ...getToastStyles(),
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  });
};

// Error toast
export const showError = (message) => {
  toast.error(message, {
    ...getToastStyles(),
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  });
};

// Loading toast (returns toast ID for dismissal)
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message, getToastStyles());
};

// Info toast (custom)
export const showInfo = (message) => {
  toast(message, {
    ...getToastStyles(),
    icon: 'ℹ️',
  });
};

// Promise toast - automatically handles loading, success, and error states
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    },
    getToastStyles()
  );
};

// Dismiss a specific toast or all toasts
export const dismissToast = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

// Custom toast with options
export const showCustom = (message, options = {}) => {
  toast(message, {
    ...getToastStyles(),
    ...options,
  });
};

export default toast;
