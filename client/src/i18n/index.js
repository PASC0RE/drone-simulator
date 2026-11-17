import { create } from 'zustand';
import { MESSAGES } from './messages.js';

const STORAGE_KEY = 'skydeck.lang';
export const LANGS = ['mn', 'en'];

function readSaved() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : null;
  } catch {
    return null; // private window or blocked storage
  }
}

export const useLang = create((set) => ({
  lang: 'mn', // Mongolian is the default; the saved choice is applied once in the browser (see initLang)
  setLang: (lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    set({ lang });
  },
}));

export function initLang() {
  const saved = readSaved();
  if (saved) useLang.getState().setLang(saved);
  else if (typeof document !== 'undefined') document.documentElement.lang = 'mn';
}

function translate(lang, key, vars) {
  let text = MESSAGES[lang]?.[key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** Non-reactive: for plain helpers. Components should use useT() so they update on language change. */
export function t(key, vars) {
  return translate(useLang.getState().lang, key, vars);
}

/** Hook: re-renders the component when the language changes. */
export function useT() {
  const lang = useLang((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}
