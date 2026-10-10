/**
 * PublicApp (Light)
 * 
 * OPTIMIZED: Public (unauthenticated) app for INAMAP.
 * This version uses lightweight components that don't depend on react-admin,
 * reducing the initial bundle size significantly.
 */
import React, { useMemo, useCallback } from 'react';
import { Routes, BrowserRouter, HashRouter, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { DASHAdminSystemConstants, getEnv } from 'dash-constants';

// Import from shared dash-boilerplate package
import {
    GlobalSmallLoader,
    I18nBridgeProviderLight,
    useI18nBridgeLight,
    DashThemeProviderLight,
    createSimpleI18nProvider,
} from 'dash-boilerplate';

// App-specific imports
import { dashPublicRoutes } from '@app/WebPublicRoutes';
import ThemeComponent from './components/theme/ThemeComponent';

// Import translations
import customEnglish from './i18n/en';
import customSpanish from './i18n/es';

interface PublicAppProps {}

const PublicApp: React.FC<PublicAppProps> = () => {
    // Memoize environment variables
    const envVars = useMemo(() => ({
        APP_VERSION: getEnv('APP_VERSION') || '1.0.0',
        BUILD_TIME: getEnv('BUILD_TIME') || new Date().toISOString(),
        IS_ELECTRON: JSON.parse(getEnv('IS_ELECTRON') || 'false'),
        PLATFORM: getEnv('PLATFORM') || "unknown",
        PLATFORM_TYPE: getEnv('PLATFORM_TYPE') || "desktop",
        LATEST_RELEASE_VERSION: getEnv('LATEST_RELEASE_VERSION') || "1.0.0",
    }), []);

    console.log('PublicApp: Environment Variables:', envVars);

    const routePath = DASHAdminSystemConstants.system.URL_PREFIX || "/";
   
    const RouterComponent = useCallback(({ children }: { children: React.ReactNode }) => {
        return (
            envVars.IS_ELECTRON ? (
                <HashRouter basename={""}>
                    {children}
                </HashRouter>
            ) : (
                <BrowserRouter basename={routePath}>
                    {children}
                </BrowserRouter>
            )
        );
    }, [envVars.IS_ELECTRON, routePath]);

    // Memoize translations data
    const translationsData = useMemo(() => {
        return {
            en: {
                ...customEnglish
            },
            es: {
                ...customSpanish,
            },
        };
    }, []);

    // Create simple i18nProvider
    const i18nProvider = useMemo(() => {
        const initialLocale = localStorage.getItem('dash-user-locale') || 'es';
        return createSimpleI18nProvider({ 
            translations: translationsData, 
            initialLocale 
        });
    }, [translationsData]);

    // Memoize theme options
    const extendedThemeOptions = useMemo(() => ({
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s ease-in-out',
                    }
                }
            },
            MuiBox: {
                styleOverrides: {
                    root: {
                        contain: 'layout style',
                    }
                }
            }
        },
    }), []);

    // Bridge setter component - using light version
    const I18nBridgeSetter = ({ provider }: { provider: any }) => {
        const { setI18nProvider } = useI18nBridgeLight();
        React.useEffect(() => {
            if (provider) setI18nProvider(provider);
        }, [provider, setI18nProvider]);
        return null;
    };

    return (
        <RouterComponent>
            <I18nBridgeProviderLight>
                <I18nBridgeSetter provider={i18nProvider} />
                <DashThemeProviderLight extendedOptions={extendedThemeOptions}>
                    <Box className="inamap-public-app">
                        <ThemeComponent>
                            <React.Suspense fallback={<GlobalSmallLoader />}>
                                <Routes>
                                    {/* Render shared routes */}
                                    {dashPublicRoutes()}
                                </Routes>
                            </React.Suspense>
                        </ThemeComponent>
                    </Box>
                </DashThemeProviderLight>
            </I18nBridgeProviderLight>
        </RouterComponent>
    );
};

export default PublicApp;
