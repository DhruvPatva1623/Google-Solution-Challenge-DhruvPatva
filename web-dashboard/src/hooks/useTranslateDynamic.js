import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// In-memory and localStorage cache to store translated strings
const translationCache = (() => {
  try {
    return JSON.parse(localStorage.getItem('cc_dynamic_translations') || '{}');
  } catch (e) {
    return {};
  }
})();

const saveCache = () => {
  try {
    localStorage.setItem('cc_dynamic_translations', JSON.stringify(translationCache));
  } catch (e) {}
};

export function useTranslateDynamic() {
  const { t: staticT, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [, setTick] = useState(0);

  const translate = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // If target language is English, return original English text
    if (currentLang === 'en') return text;

    // Check if i18next has a static translation key matched
    const staticResult = staticT(text);
    if (staticResult !== text) {
      return staticResult;
    }

    const cacheKey = `${currentLang}:${text}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Call public Google Translate client API asynchronously
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${currentLang}&dt=t&q=${encoded}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translatedVal = data[0].map(item => item[0]).join('').trim();
          translationCache[cacheKey] = translatedVal;
          saveCache();
          setTick(t => t + 1); // trigger state update to force re-render
        }
      })
      .catch(err => {
        console.warn("Dynamic translation API failed for text:", text, err);
      });

    // Return the original text as fallback while fetching
    return text;
  };

  return { t: translate, i18n };
}
