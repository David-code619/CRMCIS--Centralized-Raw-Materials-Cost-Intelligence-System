import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-text-tertiary/20 animate-pulse" />
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-background hover:border-primary/50 transition-all duration-200 group relative"
      aria-label="Toggle theme"
    >
      {theme === 'light' && <Sun className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />}
      {theme === 'system' && <Laptop className="w-4 h-4 text-text-secondary group-hover:scale-110 transition-transform" />}
      
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-text-primary text-surface text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        Theme: {theme?.charAt(0).toUpperCase()}{theme?.slice(1)}
      </span>
    </button>
  );
}
