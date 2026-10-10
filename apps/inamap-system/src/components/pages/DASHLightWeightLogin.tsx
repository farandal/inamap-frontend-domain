import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { 
    Button as LoadingButton,
    Button,
    Link,
    IconButton,
    InputAdornment,
    TextField,
    Container,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';

// TODO: Sound assets need to be passed as props or from app context
const successSource = '';
const errorSource = '';

import { DASH_REDUX_ACTIONS } from 'dash-admin-state';
import {DASHAppConstants} from 'dash-constants';

import { AuthPersistenceService } from 'dash-auth';
import DASHAuthenticationService from 'dash-admin/contexts/auth/DASHAuthenticationService';
import { useTranslate } from '../hooks/usePolyglotTranslation';
import FullLayoutMarkup from 'dash-admin/src/default-theme/FullLayoutMarkup';
/* @ts-ignore */
import DefaultHorizontalLogo from '@app/assets/logo-horizontal.svg';
/* @ts-ignore */
import DefaultLoginBanner from '@app/assets/login-back.svg';

interface DASHLightWeightLoginProps {
  
    [key: string]: any;
}

const DASHLightWeightLogin: React.FC<DASHLightWeightLoginProps> = (props) => {
    const translate = useTranslate();
    
    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const validateEmail = (value) => {
        return EMAIL_REGEX.test(value);
    };

    const [loggedIn, setLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const form = useForm();
    
    // Mobile and keyboard state
    const [isMobile, setIsMobile] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    
    // Check if Capacitor Keyboard is available through window
    const isCapacitorKeyboardAvailable = (): boolean => {
        const hasCapacitor = !!(window as any)?.Capacitor?.Plugins?.Keyboard;
        const hasCapacitorKeyboard = !!(window as any)?.CapacitorKeyboard;
        console.log('Checking Capacitor keyboard availability:', { hasCapacitor, hasCapacitorKeyboard });
        return hasCapacitor || hasCapacitorKeyboard;
    };

    // Get Capacitor Keyboard instance from window
    const getCapacitorKeyboard = () => {
        return (window as any)?.Capacitor?.Plugins?.Keyboard || (window as any)?.CapacitorKeyboard;
    };
    
    const checkMobileDevice = () => {
        // Check body classes for mobile devices
        const bodyClasses = document.body.className;
        const hasMobileClass = bodyClasses.includes('webview') || 
                              bodyClasses.includes('android') || 
                              bodyClasses.includes('ios') || 
                              bodyClasses.includes('mobile');
        
        // Check screen width
        const screenWidth = window.innerWidth;
        const isSmallScreen = screenWidth < 700;
        
        // Consider mobile if either condition is true
        return hasMobileClass || isSmallScreen;
    };

    // Keyboard logging functions
    const logKeyboardShow = (height?: number, source: 'capacitor' | 'fallback' = 'capacitor') => {
        console.log(`🔼 KEYBOARD OPENED (${source}):`, {
            height: height || 'unknown',
            timestamp: new Date().toISOString(),
            isMobile,
            screenHeight: window.screen.height,
            viewportHeight: window.visualViewport?.height || window.innerHeight,
            source
        });
    };

    const logKeyboardHide = (source: 'capacitor' | 'fallback' = 'capacitor') => {
        console.log(`🔽 KEYBOARD CLOSED (${source}):`, {
            timestamp: new Date().toISOString(),
            isMobile,
            screenHeight: window.screen.height,
            viewportHeight: window.visualViewport?.height || window.innerHeight,
            source
        });
    };

    // Fallback keyboard detection for web/non-Capacitor environments
    const setupFallbackKeyboardDetection = () => {
        const handleResize = () => {
            const mobile = checkMobileDevice();
            setIsMobile(mobile);
            
            if (mobile) {
                // On mobile, detect keyboard by viewport height change
                const viewportHeight = window.visualViewport?.height || window.innerHeight;
                const screenHeight = window.screen.height;
                
                // If viewport is significantly smaller than screen, keyboard is likely open
                const keyboardThreshold = screenHeight * 0.75;
                const keyboardOpen = viewportHeight < keyboardThreshold;
                
                // Only log if keyboard state actually changed
                if (keyboardOpen !== isKeyboardOpen) {
                    if (keyboardOpen) {
                        const estimatedKeyboardHeight = screenHeight - viewportHeight;
                        logKeyboardShow(estimatedKeyboardHeight, 'fallback');
                        setKeyboardHeight(estimatedKeyboardHeight);
                    } else {
                        logKeyboardHide('fallback');
                        setKeyboardHeight(0);
                    }
                    setIsKeyboardOpen(keyboardOpen);
                }
            }
        };

        // Add resize listeners
        window.addEventListener('resize', handleResize);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
        };
    };

    // Setup keyboard detection (Capacitor or fallback)
    useEffect(() => {
        // Initial mobile check
        setIsMobile(checkMobileDevice());
        
        if (isCapacitorKeyboardAvailable()) {
            const Keyboard = getCapacitorKeyboard();
            
            if (Keyboard) {
                console.log('🎹 Using Capacitor Keyboard API for keyboard detection');
                
                // Setup Capacitor keyboard listeners
                Keyboard.addListener('keyboardWillShow', (info: any) => {
                    console.log('📱 Capacitor: keyboard will show with height:', info.keyboardHeight);
                    logKeyboardShow(info.keyboardHeight, 'capacitor');
                    setIsKeyboardOpen(true);
                    setKeyboardHeight(info.keyboardHeight);
                });

                Keyboard.addListener('keyboardDidShow', (info: any) => {
                    console.log('📱 Capacitor: keyboard did show with height:', info.keyboardHeight);
                    // Don't log again here to avoid duplicate logs, just ensure state is correct
                    setIsKeyboardOpen(true);
                    setKeyboardHeight(info.keyboardHeight);
                });

                 Keyboard.addListener('keyboardWillHide', () => {
                    console.log('📱 Capacitor: keyboard will hide');
                    logKeyboardHide('capacitor');
                    setIsKeyboardOpen(false);
                    setKeyboardHeight(0);
                });

                Keyboard.addListener('keyboardDidHide', () => {
                    console.log('📱 Capacitor: keyboard did hide');
                    // Don't log again here to avoid duplicate logs, just ensure state is correct
                    setIsKeyboardOpen(false);
                    setKeyboardHeight(0);
                });

                // Cleanup function for Capacitor listeners
                return () => {
                   Keyboard.removeAllListeners()
                };
            }
        }
        
        // If Capacitor is not available or Keyboard is not found, use fallback
        console.log('🌐 Using fallback keyboard detection (viewport-based)');
        return setupFallbackKeyboardDetection();
    }, []);

    // Configure Capacitor Keyboard on mount (if available)
    useEffect(() => {
        const configureKeyboard = async () => {
            if (isCapacitorKeyboardAvailable()) {
                const Keyboard = getCapacitorKeyboard();
                
                if (Keyboard) {
                    try {
                        console.log('⚙️ Configuring Capacitor Keyboard settings...');
                        
                        // Disable accessory bar for cleaner login UI
                        await Keyboard.setAccessoryBarVisible({ isVisible: false });
                        
                        // Set resize mode to body for better control
                        await Keyboard.setResizeMode({ mode: 'body' });
                        
                        console.log('✅ Capacitor Keyboard configured successfully');
                    } catch (error) {
                        console.log('❌ Error configuring Capacitor Keyboard:', error);
                    }
                }
            }
        };

        configureKeyboard();
    }, []);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    useEffect(() => {
        dispatch(
            DASH_REDUX_ACTIONS.updatePage({
                title: null,
            }),
        );
    }, []);

    // Use DASHAuthenticationService to check auth state
    useEffect(() => {
        const checkAuthState = async () => {
            setIsLoading(true);
            try {
                const isAuth = await DASHAuthenticationService.checkAuth();
                setAuthenticated(isAuth);
                setLoggedIn(isAuth);
            } catch (error) {
                console.error('Error checking auth state:', error);
                setAuthenticated(false);
                setLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthState();
    }, []);

    const navigate = useNavigate();
    const [loginLoading, setLoginLoading] = useState(false);

    // Custom notification function
    const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // You could dispatch a Redux action for notifications
        // dispatch(DASH_REDUX_ACTIONS.showNotification({ message, type }));
        
        // Temporary fallback
        if (type === 'error') {
            alert(message);
        }
    };

    async function onSubmit(data, _e) {
        const password = data.password;
        setLoginLoading(true);
        setFormError(null);
        try {
            console.log('Attempting login with DASHAuthenticationService...');
            
            // Use DASHAuthenticationService for login
            const loginResponse = await DASHAuthenticationService.login({
                username: data.email,
                password: password,
                redirect: window.location.pathname
            });

            console.log('Login response:', loginResponse);

            if (loginResponse.success) {
                console.log('Login successful!');
                
                if(!!DASHAppConstants.system.LOGIN_SOUNDS) {
                    const audio = new Audio(successSource);
                    audio.load();
                    audio.play();
                }

                setLoginLoading(false);
                setLoggedIn(true);
                setAuthenticated(true);

                // Hide keyboard after successful login (if Capacitor is available)
                if (isCapacitorKeyboardAvailable()) {
                    const Keyboard = getCapacitorKeyboard();
                    
                    if (Keyboard) {
                        try {
                            console.log('🔽 Manually hiding keyboard after successful login...');
                            await Keyboard.hide();
                        } catch (error) {
                            console.log('❌ Error hiding keyboard:', error);
                        }
                    }
                }

                // Handle redirect if provided by the service
                if (loginResponse.redirectAfterLogin) {
                    console.log('Redirecting to:', loginResponse.redirectAfterLogin);
                    navigate(loginResponse.redirectAfterLogin);
                } else {
                    navigate('/');
                }
            } else {
                throw new Error(loginResponse.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if(!!DASHAppConstants.system.LOGIN_SOUNDS) {
                const audio = new Audio(errorSource);
                audio.load();
                audio.play();
            }
            
            setLoginLoading(false);
            
            let eMessage = translate('landing.login.invalidCredentials');
            if (error && error.response && error.response.data && error.response.data.message) {
                eMessage = error.response.data.message;
            } else if (error && error.error) {
                eMessage = error.error;
            } else if (error && error.message) {
                eMessage = error.message;
            }
            setFormError(eMessage);
            // Optionally: showNotification(eMessage, 'error');
        } finally {
            setLoginLoading(false);
        }
    }

    const [showNewPassword, setShowNewPassword] = useState(false);
    const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // Initialize app authentication on component mount
    // NOTE: This only sets the authenticated state. It does NOT navigate.
    // Navigation only happens after actual login or via DASHAdmin's PrivateRedirectListener.
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('Initializing app authentication...');
                const initResponse = await DASHAuthenticationService.initializeApp();
                
                if (initResponse.success) {
                    console.log('App authentication initialized successfully');
                    setAuthenticated(true);
                    setLoggedIn(true);
                    // NOTE: We do NOT navigate here. Info only.
                    if (initResponse.redirectAfterLogin) {
                        console.log('Role redirect available:', initResponse.redirectAfterLogin, '(not navigating during init)');
                    }
                } else {
                    console.log('App authentication initialization failed or no valid auth found');
                    setAuthenticated(false);
                    setLoggedIn(false);
                }
            } catch (error) {
                console.error('Error initializing app authentication:', error);
                setAuthenticated(false);
                setLoggedIn(false);
            }
        };

        initializeAuth();
    }, []);

    if (isLoading) {
        return (
            <FullLayoutMarkup className={isMobile ? 'mobile' : 'desktop'}>
                <Container maxWidth="sm" sx={{ p: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: "50vh",
                            textAlign: "center"
                        }}>
                        <div>{translate('landing.login.loading')}</div>
                    </Box>
                </Container>
            </FullLayoutMarkup>
        );
    }

    const horizontal_logo = AuthPersistenceService.getTenantImages()?.horizontal_logo?.original;
    const squared_logo =  AuthPersistenceService.getTenantImages()?.squared_logo?.original;
    const banner =  AuthPersistenceService.getTenantImages()?.banner?.original;

    return (
        <FullLayoutMarkup className={isMobile ? 'mobile' : 'desktop'}>
        <Box 
            className="dash-app-login-wrapper"
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                //minHeight: 'calc(100vh - 300px)', /* Account for header and footer */
                padding: { xs: 2, sm: 3 },
            }}
        >
            <Container 
                maxWidth="sm" 
                sx={{ 
                    //p: isMobile ? 0.5 : 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isKeyboardOpen ? 'flex-start' : 'center',
                    //pt: isKeyboardOpen ? 0.5 : 'auto',
                    //pb: isKeyboardOpen && isMobile ? `${keyboardHeight / 16}rem` : 'auto'
                }}
            >
                <Box 
                    sx={{ 
                        width: '100%',
                        maxWidth: isMobile ? '100%' : 400,
                        mx: 'auto',
                        //p: isMobile ? 0.5 : 1.5
                    }}
                >
                    {!loggedIn ? (
                        <Box>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className='dash-app-login-form'
                            >
                                {/* Compact Title - hide when keyboard is open on mobile */}
                                {/*!(isMobile && isKeyboardOpen) && (
                                    <Box sx={{ mb: isMobile ? 0.5 : 1.5, textAlign: 'center' }}>
                                        <h1 
                                            className='dash-app-login-form-title'
                                            style={{ 
                                                margin: 0,
                                                fontSize: isMobile ? '1.25rem' : '1.75rem',
                                                marginBottom: isMobile ? '0.25rem' : '0.5rem',
                                                fontWeight: 500
                                            }}
                                        >
                                            {translate('landing.login.title')}
                                        </h1>
                                    </Box>
                                )*/}

                                {/* Email Field */}
                                <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                                    <TextField
                                        label={translate('landing.login.email')}
                                        placeholder={translate('landing.login.email')}
                                        required
                                        fullWidth
                                        {...register('email', { validate: validateEmail })}
                                        className='dash-app-form-item-input'
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                fontSize: isMobile ? '0.875rem' : '1rem'
                                            }
                                        }}
                                    />
                                    {errors.email && (
                                        <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.25 }}>
                                            {errors.email.message || translate('landing.login.invalidEmail')}
                                        </Box>
                                    )}
                                </Box>

                                {/* Password Field */}
                                <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                                    <TextField
                                        label={translate('landing.login.password')}
                                        placeholder={translate('landing.login.password')}
                                        fullWidth
                                        {...register('password')}
                                        className='dash-app-form-item-input'
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                fontSize: isMobile ? '0.875rem' : '1rem'
                                            }
                                        }}
                                        slotProps={{
                                            input: {
                                                autoComplete: 'password',
                                                type: showNewPassword ? 'text' : 'password',
                                                endAdornment: (
                                                    <InputAdornment position='end'>
                                                        <IconButton
                                                            aria-label='toggle password visibility'
                                                            onClick={handleClickShowNewPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge='end'
                                                            size="small"
                                                        >
                                                            {showNewPassword ? (
                                                                <VisibilityOff fontSize="small" />
                                                            ) : (
                                                                <Visibility fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                    />
                                    {errors.password && (
                                        <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.25 }}>
                                            {errors.password.message || translate('landing.login.invalidPassword')}
                                        </Box>
                                    )}
                                </Box>

                                {/* Error message */}
                                {formError && (
                                    <Box sx={{ mb: 2 }}>
                                        <Alert severity="error" variant="filled">
                                            {formError}
                                        </Alert>
                                    </Box>
                                )}

                                {/* Login Button */}
                                <Box sx={{ mb: 0.5 }}>
                                    <LoadingButton
                                        fullWidth
                                        size="medium"
                                        className='submit'
                                        type='submit'
                                        loading={loginLoading}
                                        variant='contained'
                                        sx={{ 
                                            py: isMobile ? 0.75 : 1,
                                            fontSize: isMobile ? '0.875rem' : '1rem'
                                        }}
                                    >
                                        {translate('landing.login.submit')}
                                    </LoadingButton>
                                    
                                </Box>
                            </form>
                                {!(isMobile && isKeyboardOpen) && (
                                <Box sx={{ mb: isMobile ? 1 : 1.5, textAlign: 'right' }}>
                                    <Link
                                        className='link link--secondary'
                                        component="button"
                                        onClick={() => navigate('/reset-password')}
                                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                                    >
                                        {translate('landing.login.resetPassword')}
                                    </Link>
                                </Box>
                            )}
                        
                            
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            {/* Same banner/logo the "not logged in" form implicitly loses by
                                skipping FullLayoutMarkup's old side panel - shown here so this
                                screen still reads as a branded welcome rather than a bare box. */}
                            <Box
                                sx={{
                                    mb: 3,
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    maxWidth: isMobile ? 200 : 260,
                                    mx: 'auto',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}
                            >
                                <img
                                    src={banner || squared_logo || DefaultLoginBanner}
                                    alt=''
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <img
                                    src={horizontal_logo || DefaultHorizontalLogo}
                                    alt='logo'
                                    style={{
                                        width: '100%',
                                        maxWidth: isMobile ? 180 : 220,
                                        height: 'auto',
                                        display: 'block',
                                        margin: '0 auto',
                                    }}
                                />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <div className='dash-app-form-item'>
                                    {translate('landing.login.alreadyLoggedIn')}
                                </div>
                            </Box>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => navigate('/')}
                                size={isMobile ? 'medium' : 'large'}
                            >
                                {translate('landing.login.goHome')}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Container>
        </Box>
        </FullLayoutMarkup>
    );
};

export default DASHLightWeightLogin;
