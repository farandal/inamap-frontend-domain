import { useSelector, useDispatch } from 'react-redux';
import { useMemo, useCallback } from 'react';
import Polyglot from 'node-polyglot';
import { DASH_REDUX_ACTIONS, IDASHAppState } from 'dash-admin-state';

// Import translations
import customEnglish from '../../i18n/en';
import customSpanish from '../../i18n/es';

// Create translations map
const translations = {
    en: customEnglish,
    es: customSpanish,
};

/**
 * Hook to get available locales from Redux settings
 */
export const useLocales = ({ locales }: { locales?: { locale: string; name: string }[] } = {}) => {
    const availableLocales = useSelector((state: IDASHAppState<any,any,any>) => state.settings?.availableLocales);
    
    return useMemo(() => {
        if (locales && locales.length > 0) {
            return locales;
        }
        return availableLocales || [
            { locale: 'es', name: 'Español', languageId: 'spanish', icon: 'es' },
            { locale: 'en', name: 'English', languageId: 'english', icon: 'en' },
        ];
    }, [locales, availableLocales]);
};

/**
 * Hook to get and set current locale using Redux
 * Returns [currentLocale, setLocaleFunction]
 */
export const useLocaleState = (): [string, (locale: string) => void] => {
    const dispatch = useDispatch();
    const currentLocale = useSelector((state: IDASHAppState<any,any,any>) => state.settings?.locale || 'es');

    const setLocale = useCallback((newLocale: string) => {
        // Update Redux state (switchLanguage returns a thunk, so we need to cast dispatch)
        (dispatch as any)(DASH_REDUX_ACTIONS.switchLanguage(newLocale));
        
        // Persist to localStorage
        localStorage.setItem('dash-user-locale', newLocale);
    }, [dispatch]);

    return [currentLocale, setLocale];
};

/**
 * Hook to get a translation function (similar to useTranslate from react-admin)
 */
export const useTranslate = () => {
    const locale = useSelector((state: IDASHAppState<any,any,any>) => state.settings?.locale || 'es');

    return useMemo(() => {
        const messages = translations[locale] || translations['es'];
        const polyglot = new Polyglot({
            phrases: messages,
            locale,
            allowMissing: true,
        });

        return (key: string, options?: any) => {
            return polyglot.t(key, options);
        };
    }, [locale]);
};
