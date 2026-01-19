/**
 * =============================================================================
 * APP PROVIDERS
 * =============================================================================
 * 
 * Client-side providers wrapper
 */

"use client";

import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/contexts/TranslationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default Providers;













