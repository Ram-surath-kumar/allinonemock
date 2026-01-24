// i18n utility for internationalization
import { useState, useEffect, createContext, useContext } from "react";

// Import language files
import enTranslations from "../i18n/i18n_properties_en.json";
import tnTranslations from "../i18n/i18n_properties_tn.json";
import hiTranslations from "../i18n/i18n_properties_hi.json";
import teTranslations from "../i18n/i18n_properties_te.json";
import knTranslations from "../i18n/i18n_properties_kn.json";
import mlTranslations from "../i18n/i18n_properties_ml.json";

// Supported languages - add more as files are created
const SUPPORTED_LOCALES = [
  "en",
  "tn",
  "hi",
  "te",
  "kn",
  "ml",
  "bn",
  "gu",
  "mr",
  "pa",
  "or",
  "as",
  "ur",
  "sa",
  "kok",
  "mni",
  "ks",
  "ne",
  "sd",
];

const translations = {
  en: enTranslations,
  tn: tnTranslations,
  hi: hiTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
  // Add more as files are created - using English as fallback for now
  bn: enTranslations,
  gu: enTranslations,
  mr: enTranslations,
  pa: enTranslations,
  or: enTranslations,
  as: enTranslations,
  ur: enTranslations,
  sa: enTranslations,
  kok: enTranslations,
  mni: enTranslations,
  ks: enTranslations,
  ne: enTranslations,
  sd: enTranslations,
};

const I18nContext = createContext({
  locale: "en",
  setLocale: () => {},
  t: (key, params = {}) => key,
});

export function I18nProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocale] = useState(() => {
    // Try to get from localStorage (only in browser)
    if (typeof window !== "undefined" && window.localStorage) {
      const savedLocale = localStorage.getItem("app_locale");
      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        return savedLocale;
      }
    }
    return defaultLocale;
  });

  useEffect(() => {
    // Save locale to localStorage (only in browser)
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("app_locale", locale);
    }
  }, [locale]);

  const t = (key, params = {}) => {
    try {
      // Validate locale
      const currentLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";

      // Handle nested keys like "sidebar.dashboard"
      const getNestedValue = (obj, path) => {
        if (!obj || !path) return undefined;
        return path.split(".").reduce((current, prop) => {
          return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
      };

      let translation =
        getNestedValue(translations[currentLocale], key) ||
        getNestedValue(translations["en"], key) ||
        key;

      // Ensure translation is a string
      if (typeof translation !== "string") {
        translation = String(translation);
      }

      // Replace parameters in translation
      if (params && Object.keys(params).length > 0) {
        return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match;
        });
      }

      return translation;
    } catch (error) {
      console.error("Translation error:", error, "key:", key);
      return key; // Return the key itself if translation fails
    }
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

// Helper function for components that can't use hooks
export function getTranslation(key, locale = "en", params = {}) {
  // Handle nested keys like "sidebar.dashboard"
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  };

  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";
  let translation =
    getNestedValue(translations[validLocale], key) ||
    getNestedValue(translations["en"], key) ||
    key;

  // Ensure translation is a string
  if (typeof translation !== "string") {
    translation = String(translation);
  }

  if (params && Object.keys(params).length > 0) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  return translation;
}

// Export supported locales for use in components
export const SUPPORTED_LOCALES_LIST = SUPPORTED_LOCALES;

// Language display names (native script)
export const LANGUAGE_NAMES = {
  en: "English",
  tn: "தமிழ்",
  hi: "हिन्दी",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  bn: "বাংলা",
  gu: "ગુજરાતી",
  mr: "मराठी",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
  sa: "संस्कृतम्",
  kok: "कोंकणी",
  mni: "ꯃꯤꯇꯩ",
  ks: "कॉशुर",
  ne: "नेपाली",
  sd: "سنڌي",
};

// English names for all languages (for search and sub-labels)
export const LANGUAGE_NAMES_EN = {
  en: "English",
  tn: "Tamil",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  gu: "Gujarati",
  mr: "Marathi",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu",
  sa: "Sanskrit",
  kok: "Konkani",
  mni: "Manipuri",
  ks: "Kashmiri",
  ne: "Nepali",
  sd: "Sindhi",
};
