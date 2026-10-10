/**
 * DashBootstrapUtils
 * 
 * Utility hooks and functions for application bootstrap.
 * Handles Redux initialization, auth persistence, event listeners, etc.
 */
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AuthPersistenceService, syncDeviceStoreToLocalStorage, syncLocalStorageToDeviceStore } from 'dash-auth';
import { DASH_REDUX_ACTIONS } from 'dash-admin-state';
import { ACTION_UPDATE_AUTH } from 'dash-admin-state/redux/reducers/Auth';
import DASHAuthenticationService from 'dash-admin/contexts/auth/DASHAuthenticationService';
import { dashStorage } from 'dash-utils';

/**
 * Hook to initialize Redux auth state from persisted localStorage data
 */
export const useInitializeReduxFromPersisted = (currentAuthState: boolean) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeReduxFromPersisted = () => {
            console.log('🔍 Bootstrap: Checking for persisted auth data...');

            const storedUser = AuthPersistenceService.getUser();
            const storedToken = AuthPersistenceService.getToken();
            const isAuthenticated = JSON.parse(dashStorage.getItem('authenticated') || 'false');
            const persistedAuth = AuthPersistenceService.getAuth();

            console.log('🔍 Bootstrap: Persisted data check:', {
                hasStoredUser: !!storedUser,
                hasStoredToken: !!storedToken,
                isAuthenticated,
                hasPersistedAuth: !!persistedAuth,
                currentReduxAuth: currentAuthState
            });

            // If we have valid persisted data but Redux isn't updated, restore it
            if (isAuthenticated && storedUser && storedToken && !currentAuthState) {
                console.log('🔄 Bootstrap: Restoring auth session to Redux from localStorage');

                let userObject = storedUser;
                if (typeof storedUser === 'string') {
                    console.error('❌ Bootstrap: Stored user is string, this should not happen');
                    try {
                        userObject = JSON.parse(storedUser);
                    } catch (e) {
                        console.error('❌ Bootstrap: Cannot parse user string, clearing auth data');
                        AuthPersistenceService.clearAuth();
                        return;
                    }
                }

                dispatch(
                    DASH_REDUX_ACTIONS.updateAuth(ACTION_UPDATE_AUTH, {
                        user: userObject,
                        authenticated: true,
                        auth: persistedAuth?.auth || null,
                    })
                );

                console.log('✅ Bootstrap: Redux state restored from persisted data');
            }
        };

        initializeReduxFromPersisted();
    }, [dispatch, currentAuthState]);
};

/**
 * Hook to handle logout events
 */
export const useLogoutEventListener = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleLogoutEvent = (event: CustomEvent) => {
            console.log('🔐 Bootstrap: Received logout event', event.detail);
            
            // Clear Redux auth state
            dispatch(
                DASH_REDUX_ACTIONS.updateAuth(ACTION_UPDATE_AUTH, {
                    user: null,
                    authenticated: false,
                    auth: null,
                })
            );
            debugger;

            // Clear persisted auth
            AuthPersistenceService.clearAuth();
            localStorage.clear();
        };

        window.addEventListener('auth:logout', handleLogoutEvent as EventListener);

        return () => {
            window.removeEventListener('auth:logout', handleLogoutEvent as EventListener);
        };
    }, [dispatch]);
};

/**
 * Hook to initialize the application (auth, device sync, etc.)
 */
export const useAppInitialization = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initializationError, setInitializationError] = useState<string | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('🚀 Bootstrap: Starting app initialization...');

                await syncDeviceStoreToLocalStorage();

                const initResult = await DASHAuthenticationService.initializeApp(true);

                console.log('🔍 Bootstrap: Initialization result:', initResult);

                if (initResult.success) {
                    console.log('✅ Bootstrap: Auto-login successful');

                    dispatch(
                        DASH_REDUX_ACTIONS.updateAuth(ACTION_UPDATE_AUTH, {
                            user: initResult.user,
                            authenticated: true,
                            auth: initResult.auth || null,
                        })
                    );

                    window.DashIPCService?.speak(`${initResult.user?.name}, Bienvenido!`);

                    await syncLocalStorageToDeviceStore();
                    setInitializationError(null);

                    if (initResult.redirectAfterLogin) {
                        console.log('🔄 Bootstrap: Emitting auth:redirect event', initResult.redirectAfterLogin);
                        const event = new CustomEvent('auth:redirect', { detail: { to: initResult.redirectAfterLogin } });
                        window.dispatchEvent(event);
                    }
                } else {
                    console.log('ℹ️ Bootstrap: No valid authentication found');

                    const authData = AuthPersistenceService.getAuth();

                    if (authData && authData.auth) {
                        console.log('🔄 Bootstrap: Found persisted auth data, attempting token initialization...');

                        try {
                            const tokenInitResult = await DASHAuthenticationService.initializeFromToken();

                            if (tokenInitResult.success) {
                                console.log('✅ Bootstrap: Token initialization successful');

                                dispatch(
                                    DASH_REDUX_ACTIONS.updateAuth(ACTION_UPDATE_AUTH, {
                                        user: tokenInitResult.user,
                                        authenticated: true,
                                        auth: tokenInitResult.auth || null,
                                    })
                                );
                                await syncLocalStorageToDeviceStore();
                                setInitializationError(null);

                                if (tokenInitResult.redirectAfterLogin) {
                                    console.log('🔄 Bootstrap: Emitting auth:redirect event', tokenInitResult.redirectAfterLogin);
                                    const event = new CustomEvent('auth:redirect', { detail: { to: tokenInitResult.redirectAfterLogin } });
                                    window.dispatchEvent(event);
                                }
                            } else {
                                console.log('❌ Bootstrap: Token initialization failed:', tokenInitResult.error);
                                setInitializationError(null);
                                AuthPersistenceService.clearAuth();
                            }

                        } catch (error) {
                            console.error('❌ Bootstrap: Token initialization error:', error);
                            setInitializationError(null);
                            AuthPersistenceService.clearAuth();
                        }
                    } else {
                        console.log('ℹ️ Bootstrap: No persisted auth data found');
                        AuthPersistenceService.clearAuth();
                    }
                }

            } catch (error) {
                console.error('❌ Bootstrap: App initialization failed:', error);
                setInitializationError('Failed to initialize application');
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoading) {
            initializeApp();
        }
    }, [dispatch, isLoading]);

    return { isLoading, initializationError };
};

/**
 * Hook to handle redirect parameters
 */
export const usePendingRedirect = () => {
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get('redirect');
        if (redirectTo && redirectTo !== '/login') {
            console.log('ℹ️ RedirectTO: Setting redirect to by searchParams to:', redirectTo);
            DASHAuthenticationService.setPendingRedirect(redirectTo);
        }
    }, []);
};

/**
 * Hook to track URL pathname changes
 */
export const usePathnameTracker = () => {
    const [pathname, setPathname] = useState(window.location.pathname);

    useEffect(() => {
        const handleUrlChange = () => {
            const newPathname = window.location.pathname;
            if (newPathname !== pathname) {
                console.log('🔍 Bootstrap: URL changed from', pathname, 'to', newPathname);
                setPathname(newPathname);
            }
        };

        window.addEventListener('popstate', handleUrlChange);
        return () => window.removeEventListener('popstate', handleUrlChange);
    }, [pathname]);

    return pathname;
};
