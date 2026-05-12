"use client";

/**
 * Theme Toggle Component
 * Switches between light and dark mode
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export function ThemeToggle() {
  const { locale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isRu = locale === "ru";

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9"
      title={
        theme === "dark"
          ? isRu
            ? "Переключить на светлую тему"
            : "Yorug' mavzuga o'tish"
          : isRu
            ? "Переключить на темную тему"
            : "Qorong'i mavzuga o'tish"
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-surface-700" />
      )}
      <span className="sr-only">{isRu ? "Переключить тему" : "Mavzuni almashtirish"}</span>
    </Button>
  );
}
