/**
 * PublicApp (Light)
 * 
 * OPTIMIZED: Public (unauthenticated) app for INAMAP.
 * This version uses lightweight components that don't depend on react-admin,
 * reducing the initial bundle size significantly.
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import { Routes, BrowserRouter, HashRouter, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { DASHAdminSystemConstants, getEnv } from 'dash-constants';
import { useDispatch } from 'react-redux';
import { setResources } from 'dash-admin-state/redux/actions/Resources';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import from shared dash-boilerplate package
import {
    GlobalSmallLoader,
    DashThemeProviderLight,
    createSimpleI18nProvider,
} from 'dash-boilerplate';

// Use dash-admin's I18nBridgeProvider as the single source of truth for i18n
// This works for both public and private apps since AppMaterialMenu uses this context
import { I18nBridgeProvider, useI18nBridge } from 'dash-admin/contexts/I18nBridgeContext';

// App-specific imports
import { dashPublicRoutes } from '@app/WebPublicRoutes';
import ThemeComponent from './components/theme/ThemeComponent';

// Import translations
import customEnglish from './i18n/en';
import customSpanish from './i18n/es';
import { defaultComponentOverrides } from 'dash-styles';

interface PublicAppProps {}

// Create QueryClient instance for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const PublicApp: React.FC<PublicAppProps> = () => {
    const dispatch = useDispatch();
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
        ...defaultComponentOverrides({})
    }), []);

 

    // Bridge setter component - sets i18n provider on the single shared context
    const I18nBridgeSetter = ({ provider }: { provider: any }) => {
        const { setI18nProvider } = useI18nBridge();
        
        React.useEffect(() => {
            if (provider) {
                console.log('🌐 I18nBridgeSetter: Setting provider on I18nBridgeContext');
                setI18nProvider(provider);
            }
        }, [provider, setI18nProvider]);
        return null;
    };

    useEffect(() => {
        let mounted = true;

        const loadPublicResources = async () => {
            try {
                const module = await import('./resources/public/homeResources');
                const resources = module.default || module.HomeResources || [];
                if (mounted) {
                    dispatch<any>(setResources(resources));
                }
            } catch (error) {
                console.error('❌ Failed to load public resources:', error);
            }
        };

        loadPublicResources();

        return () => {
            mounted = false;
        };
    }, [dispatch]);

    return (
        <QueryClientProvider client={queryClient}>
            <RouterComponent>
                {/* Single I18nBridgeProvider from dash-admin - works for all components */}
                <I18nBridgeProvider>
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
                </I18nBridgeProvider>
            </RouterComponent>
        </QueryClientProvider>
    );
};

export default PublicApp;
