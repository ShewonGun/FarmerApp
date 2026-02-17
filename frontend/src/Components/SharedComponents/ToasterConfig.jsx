import { Toaster } from "react-hot-toast";
import { useTheme } from "../../Context/ThemeContext";

const ToasterConfig = () => {
  const { theme } = useTheme();

  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: theme === 'dark' ? '#1e293b' : '#ffffff',
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          padding: '8px',
          borderRadius: '4px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          iconTheme: {
            primary: theme === 'dark' ? '#3b82f6' : '#2563eb',
            secondary: theme === 'dark' ? '#1e293b' : '#ffffff',
          },
        },
      }}
    />
  );
};

export default ToasterConfig;
