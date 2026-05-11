import React, { createContext, useContext, useEffect, useState } from "react";
import { getLocales } from "expo-localization";
import * as SecureStore from "expo-secure-store";
import en from "@/locales/en.json";
import uk from "@/locales/uk.json";

type LanguageCode = "en" | "uk";

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, defaultValue?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  en,
  uk,
};

const LANGUAGE_STORAGE_KEY = "app_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // First try to get saved language preference
        const saved = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        if (saved === "en" || saved === "uk") {
          setLanguageState(saved);
          setIsLoaded(true);
          return;
        }

        // Fall back to device language
        const deviceLanguages = getLocales();
        if (deviceLanguages.length > 0) {
          const deviceLang = deviceLanguages[0].languageCode;
          if (deviceLang === "uk") {
            setLanguageState("uk");
          } else {
            setLanguageState("en");
          }
        }
      } catch (error) {
        console.log("Error loading language preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initLanguage();
  }, []);

  const setLanguage = async (lang: LanguageCode) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.log("Error saving language preference:", error);
    }
  };

  const t = (key: string, defaultValue: string = key): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === "string" ? value : defaultValue;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
