/**
 * PrivateApp
 * 
 * App privada (autenticada) de inamap-web.
 * La funcionalidad de mapas viene del paquete ina-maps.
 */
import React, { useMemo, useCallback, useEffect, Suspense, useState, PropsWithChildren } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';


// Import translations
// The reports module ships its own vocabulary (chart labels, granularity
// names, the filter drawer). Without merging it the whole section renders raw
// `dash_reports.*` keys — the module itself is otherwise fully functional,
// which makes this an easy omission to ship.
import { reportsEn, reportsEs } from 'dash-reports';
// ina-maps registra su propio vocabulario en tiempo de ejecución cuando carga
// su chunk (ver ina-maps/src/i18n/register.ts); aquí solo se lee el registro.
import { runtimeTranslations, onTranslationsRegistered } from 'ina-maps/i18n/runtime';
import customEnglish from './i18n/en';
import customSpanish from './i18n/es';
// Import dash-admin translations statically
import { en as dashAdminEn, es as dashAdminEs, mergeTranslations } from 'dash-admin';

// Import essential admin components
import { NotFound } from 'dash-components';
import { dashStorage } from 'dash-utils';
import { DASHAdminSystemConstants, getEnv } from 'dash-constants';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import { useDashResourceManifest, isResourceManifest, isResourceArray, ResourceManifest } from 'dash-app-common/components/DashResourceLoader';
import { DashDefaultReactAdminNotification } from 'dash-app-common/defaults/extensions/components';
import { useSelector } from 'react-redux';

// Import from local dash-extensions
import DASHDataProvider from './dash-extensions/config/DASHDataProvider';
import DASHAuthProvider from './dash-extensions/config/DASHAuthProvider';
import { createSharedRoutes as DASHPrivateSharedRoutes } from './dash-extensions/config/DASHPrivateSharedRoutes';
import DASHWSMessagesManager from './dash-extensions/managers/DASHWSMessagesManager';
import GlobalSmallLoader from './dash-extensions/components/GlobalSmallLoader';
import DASHLayoutSettings from './dash-extensions/config/DASHLayoutSettings';

// Import from kt-pages
import DASHLightWeightLogin from './components/pages/DASHLightWeightLogin';

// Lazy load heavy admin components
const DASHAdmin = React.lazy(() => import('dash-admin').then(module => ({ default: module.DASHAdmin })));
const AnimatedRoutesWrapper = React.lazy(() => import('dash-admin').then(module => ({ default: module.AnimatedRoutesWrapper })));
const RoutingWrapper = React.lazy(() => import('dash-admin').then(module => ({ default: module.RoutingWrapper })));
const DASHAppLayout = React.lazy(() => import('dash-admin').then(module => ({ default: module.DASHAppLayout })));
const DASHAppProviders = React.lazy(() => import('dash-admin').then(module => ({ default: module.DASHAppProviders })));

interface WebPrivateAppProps extends PropsWithChildren {
    appPath?: string;
    customResources?: IDashAutoAdminResourceConfig[] | ResourceManifest;
    useOwnRouter?: boolean;
    GlobalHook?: React.ComponentType<any>;
    AdminHook?: React.ComponentType<any>;
    customDataProvider?: any;
    customAuthProvider?: any;
    customPublicRoutes?: any;
    customPrivateRoutes?: any;
    customWSMessagesManager?: any;
    dashboard?: React.ComponentType<any>;
    customEchoProvider?: React.ComponentType<any>;
}

// Custom notification component
// This used to be a no-op `<div {...props} />` stub. React-admin's default
// mutationMode is 'undoable' for the list's bulk-delete button (and for any
// single delete/update that doesn't explicitly set mutationMode:
// 'pessimistic'): the row disappears from the UI OPTIMISTICALLY the moment
// you click, but the real dataProvider call is only fired when THIS
// component's snackbar is dismissed — auto-hide timeout, or the user
// clicking "Undo" cancels it instead. See ra-core's
// UndoableMutationsContextProvider: the mutation sits in a queue that only
// react-admin's own <Notification/> ever drains. With the stub in place,
// nothing was ever mounted to drain that queue, so the backend call never
// fired and a refresh reverted every "deleted" row. This wraps the real
// <Notification/> (dash-app-common's ready-made default) instead.
const CustomReactAdminNotification = DashDefaultReactAdminNotification;

// Create persister for localStorage
export const localStoragePersister = createAsyncStoragePersister({
    storage: window.localStorage,
    key: 'INAMAP_WEB_QUERY_CACHE', // Unique key for your app
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data),
});


const WebPrivateApp: React.FC<WebPrivateAppProps> = ({
    appPath = null,
    customResources = null,
    useOwnRouter = true,
    GlobalHook = () => <></>,
    AdminHook = (props?: any) => props?.children,
    customDataProvider,
    customAuthProvider,
    customPublicRoutes = null,
    customPrivateRoutes = null,
    customWSMessagesManager = null,
    dashboard = null,
    customEchoProvider,
    children
}) => {

    const DEBUG = false;
    
    // Debug WS Manager injection
    if (customWSMessagesManager) {
        console.log('🔍 PrivateApp: Using CUSTOM WS Messages Manager');
    } else {
        console.log('🔍 PrivateApp: Using DEFAULT DASHWSMessagesManager');
    }

    const envVars = useMemo(() => ({
        APP_VERSION: getEnv('APP_VERSION') || '1.0.0',
        BUILD_TIME: getEnv('BUILD_TIME') || new Date().toISOString(),
        IS_ELECTRON: JSON.parse(getEnv('IS_ELECTRON') || 'false'),
        PLATFORM: getEnv('PLATFORM') || "unknown",
        PLATFORM_TYPE: getEnv('PLATFORM_TYPE') || "desktop",
        IS_ANDROID: JSON.parse(getEnv('IS_ANDROID') || 'false'),
        IS_IOS: JSON.parse(getEnv('IS_IOS') || 'false'),
        IS_CAPACITOR: JSON.parse(getEnv('IS_CAPACITOR') || 'false'),
        IS_MOBILE: JSON.parse(getEnv('IS_MOBILE') || 'false'),
    }), []);

    console.log('PrivateApp: Environment Variables:', envVars);

    // Create React Query client
    const customQueryClient = useMemo<any>(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 5, // 2 hours - data is fresh for 2 hours
                gcTime: 1000 * 5, // 2 hours - keep in cache for 2 hours
                retry: 1,
                refetchOnWindowFocus: false,
                refetchOnMount: false, // Don't refetch immediately if we have cached data
            },
        },
    }), []);

    // Add custom defaults for specific endpoints (query keys)
    useEffect(() => {
        // Cache "products" for 24 hours (longer cache for less-changing data)
        /*customQueryClient.setQueryDefaults(['products'], {
            staleTime: 1000 * 60 * 60 * 24, // 24 hours
            gcTime: 1000 * 60 * 60 * 24,    // Keep in cache for 24 hours
        });

        // Cache "users" for 1 hour (shorter for frequently-changing data)
        customQueryClient.setQueryDefaults(['users'], {
            staleTime: 1000 * 60 * 60 * 1, // 1 hour
            gcTime: 1000 * 60 * 60 * 1,    // Keep in cache for 1 hour
        });*/

        // Cache "ecommerce/category" for 24 hours
        customQueryClient.setQueryDefaults(['ecommerce/category'], {
            staleTime: 1000 * 60 * 60 * 24, // 24 hours
            gcTime: 1000 * 60 * 60 * 24,    // Keep in cache for 24 hours
        });

        // Add more as needed for other endpoints/resources
    }, [customQueryClient]);

    // Unlock audio context on first user interaction
    useEffect(() => {
        const handleInteraction = () => {
            import('./components/Notifications/CustomNotificationsProcessing').then(({ unlockAudio }) => {
                unlockAudio();
            });
            
            // Remove listeners after first successful interaction
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

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

    // Create i18n provider with lazy loaded translations
    const [i18nProvider, setI18nProvider] = React.useState<any>(null);

    const common = useSelector((state: any) => state.common);
    const settings = useSelector((state: any) => state.settings);
    const auth = useSelector((state: any) => state.auth);

    const [routePath, setRoutePath] = useState<string>('');

    // Determine which providers to use
    const dataProvider = useMemo(() => {
        return customDataProvider || DASHDataProvider;
    }, [customDataProvider]);

    const authProvider = useMemo(() => {
        return customAuthProvider || DASHAuthProvider;
    }, [customAuthProvider]);

    // Calculate route path
    useEffect(() => {
        const calculateRoutePath = () => {
            const path = appPath || (common?.appPath || DASHAdminSystemConstants.system.URL_PREFIX);
            const cleanPath = path.replace(/\/\*$/, '');
            // @deprecated - removed currentAppPath storage that caused path duplication
            // dashStorage.setItem('currentAppPath', cleanPath);
            DEBUG && console.log('ROUTE-BASE-PATH:', cleanPath);
            return path;
        };

        const calculatedPath = calculateRoutePath();
        setRoutePath(calculatedPath);
    }, [useOwnRouter, appPath, common?.appPath]);

    // Memoize translations data to avoid unnecessary provider recreations
    const translationsData = useMemo(() => {
        console.log('🌍 Memoizing translationsData...');
        // Deep merge: a shallow spread would let any subtree the app defines
        // replace the core's version of that subtree wholesale, silently
        // dropping every core key underneath it. App values still win on leaf
        // collisions.
        return {
            en: mergeTranslations(dashAdminEn, reportsEn, customEnglish),
            es: mergeTranslations(dashAdminEs, reportsEs, customSpanish),
        };
    }, []);

    useEffect(() => {
        const loadTranslations = () => {
            try {
                console.log('🌍 Initializing i18nProvider...');

                const availableLocales = settings?.availableLocales?.map(({ locale, name }) => ({ locale, name })) || [
                    { locale: 'es', name: 'Español' },
                    { locale: 'en', name: 'English' }
                ];

                // Get user preference from profile
                const userPreferenceLocale = auth?.user?.preferences?.locale || settings?.preferences?.locale;
                const persistedLocale = localStorage.getItem('dash-user-locale');

                // Get tenant's language code
                const tenantLanguageCode = typeof settings?.primary_language_code === 'string'
                    ? settings.primary_language_code
                    : (typeof settings?.primary_language === 'string'
                        ? settings.primary_language
                        : (typeof settings?.primary_language === 'object' && settings?.primary_language?.code
                            ? settings.primary_language.code
                            : null));

                // Priority for INITIAL locale only
                const initialLocale = persistedLocale || userPreferenceLocale || tenantLanguageCode || settings?.locale || 'es';

                // Filter availableLocales to only include locales that have translations
                const localesWithTranslations = availableLocales.filter(
                    ({ locale }) => translationsData[locale] && Object.keys(translationsData[locale]).length > 0
                );

                // ra-i18n-polyglot signature: (getMessages, initialLocale, availableLocales, polyglotOptions)
                // Read the runtime registry HERE, not above: a package that
                // loads later contributes its bundles after this provider was
                // built, and polyglot re-runs this function on changeLocale —
                // which is what the nudge below exploits.
                // Cast: mergeTranslations is variadic over plain objects and
                // returns a wider record than ra-i18n-polyglot's GetMessages
                // declares. The shape is identical — it is the same object the
                // previous, un-merged version passed straight through.
                const messagesFor = ((locale: string) => mergeTranslations(
                    translationsData[locale] || translationsData.en,
                    ...runtimeTranslations(locale),
                )) as Parameters<typeof polyglotI18nProvider>[0];

                const provider = polyglotI18nProvider(
                    messagesFor,
                    initialLocale,
                    localesWithTranslations,
                    { allowMissing: true }
                );

                setI18nProvider(provider);
            } catch (error) {
                DEBUG && console.error('Failed to initialize i18nProvider:', error);
            }
        };

        loadTranslations();
        // Only recreate if available locales or preferences change significantly.
        // We exclude settings.locale from dependencies to let I18nReduxSync handle switches.
    }, [translationsData, settings?.availableLocales, settings?.preferences]);

    /**
     * Re-read translations when a lazily-loaded package registers its own.
     *
     * polyglotI18nProvider builds one Polyglot instance per locale and only
     * re-runs getMessages on changeLocale, so a chunk that arrives after boot
     * cannot contribute keys on its own — the strings would sit in the
     * registry, unread, until the user happened to switch language.
     * changeLocale to the CURRENT locale is the documented nudge: it forces
     * getMessages to run again, which now merges the registry.
     */
    useEffect(() => {
        if (!i18nProvider) return;

        return onTranslationsRegistered(() => {
            const locale = i18nProvider.getLocale?.();
            if (locale) void i18nProvider.changeLocale(locale);
        });
    }, [i18nProvider]);

    // Load auto admin components
    
    const [dashAutoAdminComponents, setDashAutoAdminComponents] = React.useState<any>(null);

    useEffect(() => {
       
        const loadAutoAdminComponents = async () => {
            try {

                const [
                    JsonComp,
                    JsonColorSelectorComp,
                    JsonCssVarValuesComp,
                    NotificationPreferencesComp
                ] = await Promise.all([
                    import('dash-components/components/Json/Json'),
                    import('dash-components/components/JsonColorSelector/JsonColorSelectorEnhanced'),
                    import('dash-components/components/JsonColorSelector/JsonCssVarValues'),
                    import('dash-components/components/NotificationPreferences/NotificationPreferences')
                ]);

                setDashAutoAdminComponents({
                    "Json": JsonComp.default,
                    "JsonColorSelector": JsonColorSelectorComp.default,
                    "JsonCssVarValues": JsonCssVarValuesComp.default,
                    "NotificationPreferences": NotificationPreferencesComp.default
                });

            } catch (error) {
                console.error('Failed to load auto admin components:', error);
                setDashAutoAdminComponents({});
            }

        };

        loadAutoAdminComponents();
    }, []);
    


    // Domain App Layout wrapper
    const DomainAppLayout = useCallback((props: any) => {
        const { ThemeComponent, children: c } = props;

        return (
            <Suspense fallback={<GlobalSmallLoader message="Loading layout..." />}>
                <DASHAppLayout ThemeComponent={ThemeComponent}>
                    <Suspense fallback={<GlobalSmallLoader message="Loading content..." />}>
                        {c}
                    </Suspense>
                </DASHAppLayout>
            </Suspense>
        );
    }, []);

    // Minimal layout for react-admin
    const MinimalLayout: React.FC<any> = ({ children: cm }) => cm;

    // Router component
    const RouterComponent = useCallback(({ children: cr }: { children: React.ReactNode }) => {
        return (
            envVars.PLATFORM_TYPE === "desktop" || envVars.IS_ELECTRON ? (
                <HashRouter basename={""}>
                    {cr}
                </HashRouter>
            ) : (
                <BrowserRouter basename={routePath}>
                    {cr}
                </BrowserRouter>
            )
        );
    }, [envVars.PLATFORM_TYPE, envVars.IS_ELECTRON, routePath]);


    // Create shared routes
    const customRoutes = customPublicRoutes ? customPublicRoutes() : DASHPrivateSharedRoutes();
    const customAuthRoutes = customPrivateRoutes ? customPrivateRoutes() : DASHPrivateSharedRoutes();

    // Resolve resources
    const manifestToLoad = isResourceManifest(customResources) ? customResources : null;
    const { resources: manifestResources, loading: resourcesLoading } = useDashResourceManifest(manifestToLoad as ResourceManifest);

    const resolvedResources: IDashAutoAdminResourceConfig[] = isResourceArray(customResources)
        ? customResources
        : (manifestResources || []);

    // Show loading while essential components are loading
    if (!i18nProvider || !routePath) {
        return <GlobalSmallLoader message="Loading admin application..." />;
    }

    if (isResourceManifest(customResources) && resourcesLoading) {
        return <GlobalSmallLoader message="Loading resources..." />;
    }

    DEBUG && console.log('PrivateApp Debug:', {
        useOwnRouter,
        routePath,
        appPath,
        windowPathname: window.location.pathname,
        resourceCount: resolvedResources.length,
    });

    return (
        <Suspense fallback={<GlobalSmallLoader message="Loading admin providers..." />}>
            <DASHAppProviders
                wsMessagesManager={customWSMessagesManager || DASHWSMessagesManager}
                extendedThemeOptions={extendedThemeOptions}
                //dashAutoAdminComponents={null}
                dashAutoAdminComponents={dashAutoAdminComponents}
                queryClient={customQueryClient}
                queryPersister={localStoragePersister}
                CustomEchoProvider={customEchoProvider}
            >
            
                <GlobalHook />

                {useOwnRouter ? (
                    <Suspense fallback={<GlobalSmallLoader message="Loading routing..." />}>
                        <RoutingWrapper
                            BrowserRouterComponent={RouterComponent}
                            Wrapper={AnimatedRoutesWrapper}
                            LayoutComponent={DomainAppLayout}
                        >
                            <Route
                                path={"/*"}
                                element={
                                    <Suspense fallback={<GlobalSmallLoader message="Loading admin interface..." />}>
                                        {children}
                                        <DASHAdmin
                                            basePath={"/"}
                                            dashboard={dashboard} // Pass dashboard
                                            customDataProvider={dataProvider}
                                            customAuthProvider={authProvider}
                                            customQueryClient={customQueryClient}
                                            customResources={resolvedResources}
                                            useCoreResources={false}
                                            customLayout={MinimalLayout}
                                            customErrorPage={NotFound}
                                            customI18nProvider={i18nProvider}
                                            customNotification={CustomReactAdminNotification}
                                            customAuthRoutes={customAuthRoutes}
                                            customRoutes={customRoutes}
                                            customLoginPage={DASHLightWeightLogin}
                                            AdminHook={AdminHook}
                                        />
                                    </Suspense>
                                }
                            />
                        </RoutingWrapper>
                    </Suspense>
                ) : (
                    <Suspense fallback={<GlobalSmallLoader message="Loading layout..." />}>
                        <DomainAppLayout>
                            <Suspense fallback={<GlobalSmallLoader message="Loading admin interface..." />}>
                                {children}
                                <DASHAdmin
                                    basePath={routePath}
                                    dashboard={dashboard} // Pass dashboard
                                    customDataProvider={dataProvider}
                                    customAuthProvider={authProvider}
                                    customQueryClient={customQueryClient}
                                    customResources={resolvedResources}
                                    useCoreResources={false}
                                    customLayout={MinimalLayout}
                                    customErrorPage={NotFound}
                                    customI18nProvider={i18nProvider}
                                    customNotification={CustomReactAdminNotification}
                                    customAuthRoutes={customAuthRoutes}
                                    customRoutes={customRoutes}
                                    customLoginPage={DASHLightWeightLogin}
                                />
                            </Suspense>
                        </DomainAppLayout>
                    </Suspense>
                )}
            </DASHAppProviders>
        </Suspense>
    );
};

export default WebPrivateApp;
