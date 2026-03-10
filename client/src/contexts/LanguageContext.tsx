import { createContext, useContext, useState } from 'react';
import { translations, type Lang, type Translations } from '../i18n/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  T: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('mp_lang') as Lang) ?? 'en';
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('mp_lang', l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
