import { MdLightMode, MdDarkMode } from 'react-icons/md';
import { useTheme } from '../../Context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 bg-slate-50 dark:bg-slate-800 border-none cursor-pointer text-slate-600 dark:text-slate-300 text-lg"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <MdDarkMode className="text-xl" />
      ) : (
        <MdLightMode className="text-xl" />
      )}
    </button>
  );
}
