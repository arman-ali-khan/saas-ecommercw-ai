'use client';

import { createContext, ReactNode } from 'react';
import type en from '@/locales/en.json';

type Translation = typeof en;

export const TranslationContext = createContext<Translation | null>(null);

interface LanguageProviderProps {
  translations: Translation;
  children: ReactNode;
}

export default function LanguageProvider({ translations, children }: LanguageProviderProps) {
  return (
    <TranslationContext.Provider value={translations}>
      {children}
    </TranslationContext.Provider>
  );
}
