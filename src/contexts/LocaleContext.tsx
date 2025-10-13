'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocaleConfig, getLocaleConfig, LOCALE_CONFIGS } from '@/lib/locale-config';

interface LocaleContextType {
  locale: LocaleConfig;
  setLocale: (code: string) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

/**
 * Detect user's preferred locale from browser settings
 */
function detectBrowserLocale(): LocaleConfig {
  if (typeof window === 'undefined') {
    return LOCALE_CONFIGS['de-DE']; // SSR fallback
  }

  // 1. Check localStorage first (user preference)
  const savedLocale = localStorage.getItem('user-locale-preference');
  if (savedLocale && LOCALE_CONFIGS[savedLocale]) {
    console.log('[LocaleProvider] Using saved locale:', savedLocale);
    return LOCALE_CONFIGS[savedLocale];
  }

  // 2. Detect from browser (navigator.language)
  const browserLang = navigator.language; // e.g., "de-DE", "en-US", "de", "it"
  console.log('[LocaleProvider] Browser language:', browserLang);

  // Try exact match first (e.g., "de-DE" → de-DE)
  if (LOCALE_CONFIGS[browserLang]) {
    console.log('[LocaleProvider] Exact locale match:', browserLang);
    return LOCALE_CONFIGS[browserLang];
  }

  // Try language code only (e.g., "de" → find first "de-*")
  const langCode = browserLang.split('-')[0].toLowerCase();
  const matchingLocale = Object.values(LOCALE_CONFIGS).find(
    config => config.language.toLowerCase() === langCode
  );

  if (matchingLocale) {
    console.log('[LocaleProvider] Language match:', matchingLocale.code);
    return matchingLocale;
  }

  // 3. Default to German (Germany)
  console.log('[LocaleProvider] No match found, defaulting to de-DE');
  return LOCALE_CONFIGS['de-DE'];
}

/**
 * LocaleProvider - Provides locale context to all child components
 *
 * Features:
 * - Auto-detects browser language on mount
 * - Persists user preference to localStorage
 * - Provides locale configuration for number formatting
 *
 * Usage:
 * ```tsx
 * <LocaleProvider>
 *   <YourApp />
 * </LocaleProvider>
 * ```
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  // CRITICAL: Always start with de-DE on both server and client to avoid hydration mismatch
  // We'll detect and update the locale AFTER hydration in useEffect
  const [locale, setLocaleState] = useState<LocaleConfig>(LOCALE_CONFIGS['de-DE']);
  const [isMounted, setIsMounted] = useState(false);

  // Detect locale only on client side AFTER hydration
  useEffect(() => {
    setIsMounted(true);
    const detectedLocale = detectBrowserLocale();
    if (detectedLocale.code !== locale.code) {
      console.log('[LocaleProvider] Updating locale after hydration:', detectedLocale.code);
      setLocaleState(detectedLocale);
    }
  }, []);

  const setLocale = (code: string) => {
    console.log('[LocaleProvider] Setting locale to:', code);
    const newLocale = getLocaleConfig(code);
    setLocaleState(newLocale);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-locale-preference', code);
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * useLocale - Hook to access locale context
 *
 * Returns:
 * - locale: Current LocaleConfig object
 * - setLocale: Function to change locale
 *
 * Usage:
 * ```tsx
 * const { locale, setLocale } = useLocale();
 * console.log(locale.numberFormat.decimalSeparator); // "," or "."
 * setLocale('en-US'); // Change to US English
 * ```
 */
export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
