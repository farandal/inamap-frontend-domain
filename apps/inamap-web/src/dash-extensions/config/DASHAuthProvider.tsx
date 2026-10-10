import { getCookie, removeCookie, setCookie } from 'dash-admin/utils/cookies';
import  { DASHAdminSystemConstants,getEnv } from 'dash-constants';

import { setAuthEvent } from 'dash-admin/contexts/auth';
import { AuthPersistenceService, syncDeviceStoreToLocalStorage, syncLocalStorageToDeviceStore } from 'dash-auth';
import {DASHAppConstants} from 'dash-constants';
import { useAxios } from 'dash-axios-hook';
import { logoutFromStorage } from 'ina-common/auth/authProviderUtils';
import { dashStorage } from 'dash-utils';

const authProvider = {
   login: async ({ username, password }) => {

       await syncDeviceStoreToLocalStorage();

    const axios = useAxios();
    
    if (!(username && password)) {
        return Promise.reject();
    }

    try {
        const loginResponse = await axios.post('/login', {
            email: username,
            password,
        });

        if (loginResponse.status >= 200 && loginResponse.status <= 299) {
            // Extract redirectTo from login response early
            const redirectTo = loginResponse.data.redirectTo;
            
            console.log('🔍 Full login response:', loginResponse.data);
            console.log('🔍 RedirectTo value:', redirectTo);
            console.log('🔍 RedirectTo type:', typeof redirectTo);

            /*const today = new Date();
            const expires = new Date();
            expires.setDate(today.getDate() + 2);

            if (loginResponse.data !== "") {
               //setCookie('token', loginResponse.data.token, { expires });
                dashStorage.setItem('token', loginResponse.data.token);
            }
            */

            if (loginResponse.data !== "") {
                //setCookie('token', loginResponse.data.token);
            
                dashStorage.setItem('token', loginResponse.data.token);
                
                // Store refresh token if provided (backend uses snake_case: refresh_token)
                const refreshToken = loginResponse.data.refresh_token || loginResponse.data.refreshToken;
                if (refreshToken) {
                    console.log('🔑 Storing refresh token');
                    dashStorage.setItem('refreshToken', refreshToken);
                }
            }

            try {
                // Get complete auth data
                const { data: auth } = await axios.get(getEnv('APP_GETAUTH_ENDPOINT'));
                
                // Use AuthPersistenceService to save auth data
                AuthPersistenceService.saveAuth(auth);
                
                // Persist tenancy_id for tenancy admin users
                if (auth.systemValues?.tenancy?.id) {
                    dashStorage.setItem('tenancy_id', String(auth.systemValues.tenancy.id));
                }

                // Set basic localStorage for react-admin compatibility
                dashStorage.setItem('authenticated', 'true');
                dashStorage.setItem('user', JSON.stringify(auth.user));
                dashStorage.setItem(
                    'roles',
                    auth.user?.roles
                        ? JSON.stringify(auth.user.roles)
                        : JSON.stringify(DASHAppConstants.system.GUEST_ROLE),
                );

                // Trigger auth context update
                setAuthEvent({
                    authenticated: true,
                    user: auth.user,
                    auth: auth.auth,
                    token: loginResponse.data.token,
                    roles: auth.user?.roles
                });

                await syncLocalStorageToDeviceStore();

                // ✅ Handle redirect - check backend response first, then role redirects
                let finalRedirectTo = redirectTo;
                
                // If no redirectTo from login response, check role redirects
                if (!finalRedirectTo) {
                    const roles = auth.user?.roles;
                    if (Array.isArray(roles) && roles.length > 0) {
                        for (const role of roles) {
                            if (role.redirect) {
                                finalRedirectTo = role.redirect;
                                console.log('🎯 Using role redirect:', role.name, '->', role.redirect);
                                break;
                            }
                        }
                    }
                }

                if (finalRedirectTo) {
                    console.log('✅ Returning redirectTo to React Admin:', finalRedirectTo);
                    return Promise.resolve({ redirectTo: finalRedirectTo });
                } else {
                    console.log('ℹ️ No redirectTo from backend or roles, returning auth data');
                    return Promise.resolve(auth);
                }

            } catch (error) {
                console.error('Error al obtener al usuario');
                logoutFromStorage("login get auth error");
                return Promise.reject(error);
            }
        }
    } catch (error) {
        console.error(error);
        logoutFromStorage("login error logout");
        return Promise.reject(error);
    }

    logoutFromStorage("login default error logout");
    return Promise.reject();
},

    logout: async (params?: any, redirectTo?: string | false, redirectToCurrentLocationAfterLogin?: boolean) => {        
       // try {
            // Clear all auth data
            await logoutFromStorage("logout");
            //dashStorage.clear();
            
   
            
           
            // Return a specific URL to force React Admin to use window.location.href
            // This is crucial to break the React rendering cycle
            
            return Promise.resolve(redirectTo || "/");
        //} catch (error) {
        //    console.error("error logging out")
        //    return Promise.reject(error);
        //}

       
    },

    /*
    Deprecated, using permissions from Dash Auth Context.
    getPermissions: () => {
        try {
            if (dashStorage.getItem('roles') === 'guest')
                return Promise.resolve('guest');

            const roles = dashStorage.getItem('roles');
            if (!roles) return Promise.resolve('null');

            const processedPermissions = {
                roles: JSON.parse(roles).map((item) => item.name)
            };

            return processedPermissions
                ? Promise.resolve(processedPermissions)
                : Promise.resolve('null');
        } catch (error) {
            return Promise.resolve('null');
        }
    },
    */
    getIdentity: async () => {
       
        const axios = useAxios();

        //const currentUser = JSON.parse(dashStorage.getItem('user'));
        const token = dashStorage.getItem('token');
        if (!token) {
            //logoutFromStorage();
            // return Promise.reject();
            //logoutFromStorage("no-token logout");
            return Promise.reject('No token present');
        }

        try {
            // Always use the primary auth endpoint (tenancyAuth for tenancy apps).
            // The X-Tenant-Id header (injected by useAxios interceptor) tells the backend
            // which tenant's settings to return, while always preserving tenancy/tenants data.
            const authEndpoint = getEnv('APP_GETAUTH_ENDPOINT');

            const { data: auth } = await axios.get(authEndpoint);

            dashStorage.setItem(
                'roles',
                auth.user?.roles
                    ? JSON.stringify(auth.user.roles)
                    : JSON.stringify(DASHAppConstants.system.GUEST_ROLE),
            );
            dashStorage.setItem('authenticated', 'true');
            dashStorage.setItem('user', JSON.stringify(auth.user));

            // Persist tenancy_id for the flow (always available for tenancy admin users)
            if (auth.systemValues?.tenancy?.id) {
                dashStorage.setItem('tenancy_id', String(auth.systemValues.tenancy.id));
            }

            // Persist user_id always
            if (auth.user?.id) {
                dashStorage.setItem('user_id', auth.user.id);
            }

            // Only set tenant_id if user has explicitly selected one via TenantSwitcher
            // Do NOT auto-set from user.tenant_id — the tenancy should start without a default tenant
            const activeTenantId = dashStorage.getItem('active_tenant_id');
            if (activeTenantId) {
                dashStorage.setItem('tenant_id', activeTenantId);
            }

            //setAuthEvent(auth);
            
         
            // TODO: this should return the entire oauth object; nevertheless, only user data is being used.
            return await Promise.resolve(auth);
        } catch (error) {
            //console.error('Error al auténicar al usuario');
            logoutFromStorage("get identity error logout");

            return Promise.reject(error);
        } finally {
            // Ensure we sync localStorage to Electron store after getting identity
            await syncLocalStorageToDeviceStore();
        }
    },


    checkAuth: async () => {
        // First check localStorage for basic auth state
        const isAuthenticated = JSON.parse(dashStorage.getItem('authenticated') || 'false');
        const user = JSON.parse(dashStorage.getItem('user') || 'null');
        
        if (isAuthenticated && user?.id) {
            // Also check if we have valid persisted auth data
            const persistedAuth = AuthPersistenceService.getAuth();
            if (persistedAuth) {
                return Promise.resolve();
            }
        }
        
        return Promise.reject();
    },

    checkError: (error) => {

        const errorStatus = error?.response?.status;

        window.dispatchEvent(
            new MessageEvent('dash-global-loader', { data: false }),
        );
        if (errorStatus) {
            const errors: any = {};
            switch (errorStatus) {
                case 400:

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', {
                            data: { error: error.response.data || error }
                        }),
                    );
                    return Promise.resolve();
                case 401:

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', {
                            data: { error: error.response.data || error }
                        }),
                    );
                    //return Promise.reject(error); //Promise.reject logs off the user
                    return Promise.resolve();
                case 403:

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', {
                            data: { error: error.response.data || error }
                        }),
                    );
                    //return Promise.reject(error); //Promise.reject logs off the user
                    return Promise.resolve();
                case 500:

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', {
                            data: { error: error.response.data || error }
                        }),
                    );
                    return Promise.resolve();
                case 422:
                case 409:

                    errors.error =
                        'Ha ocurrido un error indefinido, vuelva a intentarlo más tarde';
                    if (error.response.data?.errors) {
                        Object.keys(error.response.data?.errors).forEach((key) => {
                            errors[key] = error.response.data?.errors[key].join(' , ');
                        });
                    } else if (error.response.data?.message) {
                        errors.error = error.response.data?.message;
                    }

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', { data: { error: errors } }),
                    );

                    return Promise.resolve();
                default:

                    window.dispatchEvent(
                        new MessageEvent('GlobalError', {
                            data: { error: error.response.data || error }
                        }),
                    );

                    return Promise.resolve();
            }
        } else {
            const _errors: any = {};
            Object.keys(error).forEach((key) => {
                _errors[key] = Array.isArray(error[key])
                    ? error[key].join(' , ')
                    : error[key];
            });
            //dashStorage.setItem('axiosError', JSON.stringify(_errors));
            return Promise.resolve();
        }
    },

};


export default authProvider;