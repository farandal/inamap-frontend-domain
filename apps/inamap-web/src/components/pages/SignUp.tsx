import React, { createRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotify } from 'react-admin';
import { useTranslate } from '../hooks/usePolyglotTranslation';
import ReCAPTCHA from 'react-google-recaptcha';
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';
import { 
    Grid, 
    IconButton, 
    TextField, 
    Typography, 
    Box,
    Divider,
    Alert,
    useTheme,
    useMediaQuery,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    ListSubheader
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

import { DASH_REDUX_ACTIONS, IDASHAppState } from 'dash-admin-state';
import DictionaryContext from 'dash-admin/contexts/dictionary/DictionaryContext';
import { useAxios } from 'dash-axios-hook';
import { useDialog } from 'dash-dialog';
import {DASHAdminSystemConstants} from 'dash-constants';
import { RutValidator, RutValidatorWithoutDots } from 'dash-admin/utils/validators';
import { useSystemConfig, SystemConfigData } from '../../hooks/useSystemConfig';
import { isPreRelease } from '@app/utils/releaseStage';
import PreReleaseInvitationGate from '../prerelease/PreReleaseInvitationGate';

interface SignUpFormData {
    email: string;
    public_name: string; // Business name
    public_id: string;   // RUT
    name: string;
    lastname: string;
    password: string;
    password_confirmation: string;
    phone: string;
    primary_language: string;
    primary_currency: string;
    primary_timezone: string;
    'g-recaptcha-response'?: string;
}

/**
 * Componente de página de registro que maneja el registro de usuarios con selección de plan de suscripción
 * e integración con autenticación de Google
 */
const SignUpPage = (props) => {

    const {panelSettings} = props;
    const translate = useTranslate();

    const enableRecaptcha: boolean = DASHAdminSystemConstants.system.RECAPTCHA_ENABLED;
    const enableGoogleSignup: boolean = DASHAdminSystemConstants.system.GOOGLE_SIGNUP !== false;
    const recaptchaRef = createRef<ReCAPTCHA>();
    const [recpatcha, setRecaptcha] = useState(null);
    const [loading, setLoading] = useState(false);
    const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

    // Pre-release: gate the signup form behind an invitation code
    const [invitationVerified, setInvitationVerified] = useState(!isPreRelease());
    
    // Use cached system config query
    const { data: systemConfigResponse, isLoading: systemConfigLoading } = useSystemConfig();
    const systemConfig = systemConfigResponse?.data;

    // Add responsive breakpoints
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const dispatch = useDispatch();
    const dialog = useDialog();
    const dict = React.useContext(DictionaryContext);
    const navigate = useNavigate();
    const location = useLocation();
    const form = useForm<SignUpFormData>();
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
        setValue,
        watch
    } = form;
    const axios = useAxios();
    const notify = useNotify();

    const watchedEmail = watch('email');

    // Get available locales from settings
    const settings = useSelector((state: IDASHAppState<any, any, any>) => state.settings);
    const availableLocales = settings.availableLocales || [
        { locale: 'es', name: 'Español', icon: 'es' },
        { locale: 'en', name: 'English', icon: 'en' },
    ];
    const currentLocale = settings.locale || 'es';

    const onChangeRecaptcha = (value: string) => {
        clearErrors('g-recaptcha-response');
        setRecaptcha(value);
    };

    // Pre-fill email from navigation state (from hero form)
    useEffect(() => {
        const emailFromState = (location.state as { email?: string })?.email;
        if (emailFromState) {
            setValue('email', emailFromState);
        }
        // Set default language to current locale
        setValue('primary_language', currentLocale);
    }, [location.state, setValue, currentLocale]);

    useEffect(() => {
        dispatch(
            DASH_REDUX_ACTIONS.updatePage({
                title: null,
            }),
        );
    }, []);

    // Set default values from cached system config
    useEffect(() => {
        if (systemConfig?.defaults) {
            setValue('primary_currency', systemConfig.defaults.currency || 'CLP');
            setValue('primary_timezone', systemConfig.defaults.timezone || 'America/Santiago');
            // Only set language if not already set
            if (!watch('primary_language')) {
                setValue('primary_language', systemConfig.defaults.language || currentLocale);
            }
        }
    }, [systemConfig, setValue, currentLocale]);

    const googleClientId: string = DASHAdminSystemConstants.system.GOOGLE_CLIENT_ID;

    /**
     * Handle successful Google OAuth login
     * Sends credential to backend for verification and trial registration
     */
    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!enableGoogleSignup) {
            notify(translate('signup.googleSignupDisabled'), { type: 'warning' });
            return;
        }

        try {
            setGoogleAuthLoading(true);
            
            // Send credential to backend for verification
            const response = await axios.post('/auth/google/authenticate', {
                credential: credentialResponse.credential,
                signup: true,
            });

            if (response.data?.success) {
                notify(translate('signup.accountCreatedSuccess'), { type: 'success' });
                
                // If user already exists, redirect to login
                if (response.data?.existing_user) {
                    navigate('/login', {
                        state: { 
                            email: response.data.email,
                            message: 'Account exists. Please login.'
                        }
                    });
                } else {
                    // New user - redirect to success page
                    navigate('/signup-success', { 
                        state: { 
                            email: response.data.email, 
                            message: response.data.message || translate('signup.accountCreatedSuccess')
                        } 
                    });
                }
            } else {
                notify(response.data?.message || translate('signup.googleAuthError'), { type: 'error' });
            }
        } catch (error: any) {
            console.error('Google authentication error:', error);
            notify(error.response?.data?.message || translate('signup.googleAuthError'), { type: 'error' });
        } finally {
            setGoogleAuthLoading(false);
        }
    };

    /**
     * Handle Google OAuth error
     */
    const handleGoogleError = () => {
        console.error('Google OAuth failed');
        notify(translate('signup.googleAuthError'), { type: 'error' });
    };

    async function onSubmit(data: SignUpFormData) {
        try {
            setLoading(true);
            clearErrors();

            // Prepare data for trial/register endpoint
            const submitData = {
                email: data.email,
                public_id: data.public_id,
                public_name: data.public_name,
                name: data.name,
                lastname: data.lastname,
                password: data.password,
                password_confirmation: data.password_confirmation,
                phone: data.phone,
                primary_language: data.primary_language || currentLocale,
                primary_currency: data.primary_currency || systemConfig?.defaults?.currency || 'CLP',
                primary_timezone: data.primary_timezone || systemConfig?.defaults?.timezone || 'America/Santiago',
            };

            if (enableRecaptcha) {
                const recaptchaValue =
                    recaptchaRef.current && recaptchaRef.current.getValue
                        ? recaptchaRef.current.getValue()
                        : recpatcha;
                submitData['g-recaptcha-response'] = recaptchaValue;
            }

            const response = await axios.post('/trial/register', submitData);

            if (response.status >= 200 && response.status < 300) {
                notify(translate('signup.accountCreatedSuccess'), { type: 'success' });
                
                // `verification_required` comes from THIS registration's
                // response rather than from cached public config, so the screen
                // can never contradict what the backend actually did. Absent
                // (an older backend) means the email was sent, which is the
                // behaviour that existed before the flag.
                const verificationRequired =
                    response.data?.data?.verification_required !== false;

                // Redirect to verification pending page
                navigate('/signup-success', { 
                    state: { 
                        email: data.email, 
                        message: response.data?.message || translate('signup.accountCreatedSuccess'),
                        verificationRequired,
                    } 
                });
            } else {
                dialog({
                    variant: 'danger',
                    title: translate('signup.error'),
                    content: translate('signup.errorOccurred'),
                });
            }
        } catch (error: any) {
            console.error('SignUp error:', error);
            
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                for (const key in errors) {
                    // Map backend field names to frontend form fields
                    const formKey = key === 'public_name' ? 'public_name' : key;
                    setError(formKey as keyof SignUpFormData, { 
                        type: 'custom', 
                        message: Array.isArray(errors[key]) ? errors[key][0] : errors[key]
                    });
                }
            } else if (error.response?.data?.message) {
                notify(error.response.data.message, { type: 'error' });
            } else {
                notify(translate('signup.registrationError'), { type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    }

    // Wrap content conditionally with GoogleOAuthProvider
    const formContent = (
            <form onSubmit={handleSubmit(onSubmit)} className='dash-app-login-form'>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 4, 
                    mt: 2,
                    gap: 1
                }}>
                    <IconButton
                        color={'primary'}
                        size={'large'}
                        onClick={() => navigate('/')}
                    >
                        <HomeIcon />
                    </IconButton>
                    <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        component="h1" 
                        className='dash-app-login-form-title'
                        sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                            fontWeight: 'bold'
                        }}
                    >
                        {translate('signup.title')}
                    </Typography>
                </Box>

                {/* Google Sign Up Button - Only show if enabled and client ID configured */}
                {enableGoogleSignup && googleClientId && (
                    <>
                        <div className='dash-app-form-item'>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    width: '100%',
                                    minHeight: 50,
                                    position: 'relative'
                                }}
                            >
                                {googleAuthLoading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CircularProgress size={24} />
                                        <Typography>{translate('signup.connecting')}</Typography>
                                    </Box>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        size="large"
                                        width={isMobile ? "300" : "400"}
                                        text="signup_with"
                                        shape="rectangular"
                                        logo_alignment="left"
                                    />
                                )}
                            </Box>
                        </div>

                        <Divider sx={{ my: { xs: 2, sm: 3 } }}>
                            <Typography variant="body2" color="textSecondary">
                                {translate('signup.orSignUpWithEmail')}
                            </Typography>
                        </Divider>
                    </>
                )}

                {/* User Information Form */}
                <Box
                    sx={{
                        width: { xs: '100%' },
                        ml: { lg: 0 },
                        mr: { lg: 'auto' }
                    }}
                >
                    <Typography 
                        variant={isMobile ? "h6" : "h5"} 
                        gutterBottom 
                        sx={{ 
                            mt: { xs: 1, sm: 2 },
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            fontWeight: 'medium'
                        }}
                    >
                        {translate('signup.accountInformation')}
                    </Typography>

                    <div className='dash-app-form-item'>
                        <TextField
                            placeholder={translate('signup.email')}
                            label={translate('signup.email')}
                            required
                            fullWidth
                            {...register('email', {
                                required: translate('signup.email'),
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: translate('signup.invalidEmail')
                                }
                            })}
                            className='dash-app-form-item-input'
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                            slotProps={{
                                htmlInput: { type: 'email'}
                            }}
                        />
                    </div>

                    <div className='dash-app-form-item'>
                        <TextField
                            placeholder={translate('signup.businessName')}
                            label={translate('signup.businessName')}
                            required
                            fullWidth
                            className='dash-app-form-item-input'
                            {...register('public_name', {
                                required: translate('signup.businessName')
                            })}
                            error={!!errors.public_name}
                            helperText={errors.public_name?.message}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        />
                    </div>

                    <div className='dash-app-form-item'>
                        <TextField
                            placeholder='11.111.111-1'
                            label={translate('signup.publicIdLabel')}
                            required
                            fullWidth
                            className='dash-app-form-item-input'
                            {...register('public_id', { 
                                validate: RutValidatorWithoutDots,
                                required: translate('signup.rutRequired')
                            })}
                            error={!!errors.public_id}
                            helperText={errors.public_id?.message || (errors.public_id ? translate('signup.invalidRut') : '')}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        />
                    </div>

                    <Grid container spacing={{ xs: 2, sm: 2 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <div className='dash-app-form-item'>
                                <TextField
                                    placeholder={translate('signup.firstName')}
                                    label={translate('signup.firstName')}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    {...register('name', {
                                        required: translate('signup.firstName')
                                    })}
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }
                                    }}
                                />
                            </div>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <div className='dash-app-form-item'>
                                <TextField
                                    placeholder={translate('signup.lastName')}
                                    label={translate('signup.lastName')}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    {...register('lastname', {
                                        required: translate('signup.lastName')
                                    })}
                                    error={!!errors.lastname}
                                    helperText={errors.lastname?.message}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }
                                    }}
                                />
                            </div>
                        </Grid>
                    </Grid>

                    <Grid container spacing={{ xs: 2, sm: 2 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <div className='dash-app-form-item'>
                                <TextField
                                    placeholder={translate('signup.password')}
                                    label={translate('signup.password')}
                                    required
                                    fullWidth
                                    type='password'
                                    className='dash-app-form-item-input'
                                    {...register('password', {
                                        required: translate('signup.password'),
                                        minLength: {
                                            value: 8,
                                            message: translate('signup.password')
                                        }
                                    })}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }
                                    }}
                                />
                            </div>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <div className='dash-app-form-item'>
                                <TextField
                                    placeholder={translate('signup.confirmPassword')}
                                    label={translate('signup.confirmPassword')}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    type='password'
                                    {...register('password_confirmation', {
                                        required: translate('signup.confirmPassword'),
                                        validate: (value) => {
                                            const password = form.getValues('password');
                                            return value === password || translate('signup.password');
                                        }
                                    })}
                                    error={!!errors.password_confirmation}
                                    helperText={errors.password_confirmation?.message}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }
                                    }}
                                />
                            </div>
                        </Grid>
                    </Grid>

                    <div className='dash-app-form-item'>
                        <TextField
                            label={translate('signup.contactPhone')}
                            required
                            fullWidth
                            placeholder='+569 1234 5678'
                            className='dash-app-form-item-input'
                            {...register('phone', {
                                required: translate('signup.phoneRequired')
                            })}
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        />
                    </div>

                    {/* Language Preference */}
                    <div className='dash-app-form-item'>
                        <FormControl 
                            fullWidth 
                            error={!!errors.primary_language}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        >
                            <InputLabel id="primary-language-label">
                                {translate('signup.preferredLanguage')}
                            </InputLabel>
                            <Select
                                labelId="primary-language-label"
                                label={translate('signup.preferredLanguage')}
                                defaultValue={currentLocale}
                                {...register('primary_language')}
                            >
                                {availableLocales.map((locale: any) => (
                                    <MenuItem key={locale.locale} value={locale.locale}>
                                        {locale.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.primary_language && (
                                <FormHelperText>{errors.primary_language.message}</FormHelperText>
                            )}
                        </FormControl>
                    </div>

                    {/* Currency Preference */}
                    <div className='dash-app-form-item'>
                        <FormControl 
                            fullWidth 
                            error={!!errors.primary_currency}
                            disabled={systemConfigLoading}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        >
                            <InputLabel id="primary-currency-label">
                                {translate('signup.preferredCurrency')}
                            </InputLabel>
                            <Select
                                labelId="primary-currency-label"
                                label={translate('signup.preferredCurrency')}
                                defaultValue={systemConfig?.defaults?.currency || 'CLP'}
                                {...register('primary_currency')}
                            >
                                {systemConfig?.currencies && systemConfig.currencies.length > 0 ? (
                                    systemConfig.currencies.map((currency) => (
                                        <MenuItem key={currency.code} value={currency.code}>
                                            {currency.label}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="CLP">CLP - Chilean Peso ($)</MenuItem>
                                )}
                            </Select>
                            {errors.primary_currency && (
                                <FormHelperText>{errors.primary_currency.message}</FormHelperText>
                            )}
                        </FormControl>
                    </div>

                    {/* Timezone Preference */}
                    <div className='dash-app-form-item'>
                        <FormControl 
                            fullWidth 
                            error={!!errors.primary_timezone}
                            disabled={systemConfigLoading}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                        >
                            <InputLabel id="primary-timezone-label">
                                {translate('signup.preferredTimezone')}
                            </InputLabel>
                            <Select
                                labelId="primary-timezone-label"
                                label={translate('signup.preferredTimezone')}
                                defaultValue={systemConfig?.defaults?.timezone || 'America/Santiago'}
                                {...register('primary_timezone')}
                            >
                                {systemConfig?.timezones && Object.keys(systemConfig.timezones).length > 0 ? (
                                    Object.entries(systemConfig.timezones).flatMap(([region, zones]) => [
                                        <ListSubheader key={`header-${region}`}>{region.replace('_', ' ')}</ListSubheader>,
                                        ...zones.map((tz) => (
                                            <MenuItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </MenuItem>
                                        ))
                                    ])
                                ) : (
                                    <MenuItem value="America/Santiago">America/Santiago (UTC-03:00)</MenuItem>
                                )}
                            </Select>
                            {errors.primary_timezone && (
                                <FormHelperText>{errors.primary_timezone.message}</FormHelperText>
                            )}
                        </FormControl>
                    </div>

                    {/* reCAPTCHA */}
                    {enableRecaptcha && (
                        <div className='dash-app-form-item mb-0'>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: isMobile ? 'flex-start' : 'center',
                                    width: '100%',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                                                               transform: isMobile ? 'scale(0.77)' : 'scale(1)',
                                        transformOrigin: 'left center',
                                        width: isMobile ? '130%' : '100%'
                                    }}
                                >
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={DASHAdminSystemConstants.system.RECAPTCHA_TOKEN}
                                        onChange={onChangeRecaptcha}
                                        size={isMobile ? "compact" : "normal"}
                                    />
                                </Box>
                            </Box>
                            {errors['g-recaptcha-response'] && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {errors['g-recaptcha-response'].message}
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className='dash-app-form-item mb-0'>
                        <Button
                            disabled={(!recpatcha && enableRecaptcha) || loading}
                            type='submit'
                            fullWidth
                            variant={'contained'}
                            size="large"
                            onClick={() => clearErrors()}
                            sx={{ 
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? translate('signup.creatingAccount') : translate('signup.createAccountStartTrial')}
                        </Button>
                    </div>

                    <div className='dash-app-form-item mb-0'>
                        <Button 
                            className='default' 
                            fullWidth
                            onClick={() => navigate('/')}
                            disabled={loading}
                            sx={{ 
                                py: { xs: 1, sm: 1.5 },
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                        >
                            {translate('signup.cancel')}
                        </Button>
                    </div>

                    {/* Terms and Privacy */}
                    <Box
                        sx={{
                            mt: { xs: 2, sm: 3, },
                            mb:3
                        }}>
                        <Typography 
                            variant="body2" 
                            color="textSecondary" 
                            align="center"
                            sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                lineHeight: 1.4,
                                px: { xs: 1, sm: 0 }
                            }}
                        >
                            {translate('signup.byCreatingAccount')}{' '}
                            <Button 
                                variant="text" 
                                size="small" 
                                onClick={() => navigate('/privacy')}
                                sx={{ 
                                    textTransform: 'none', 
                                    p: 0, 
                                    minWidth: 'auto',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    textDecoration: 'underline'
                                }}
                            >
                                {translate('signup.termsOfService')}
                            </Button>
                            {' '}{translate('signup.and')}{' '}
                            <Button 
                                variant="text" 
                                size="small" 
                                onClick={() => navigate('/terms')}
                                sx={{ 
                                    textTransform: 'none', 
                                    p: 0, 
                                    minWidth: 'auto',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    textDecoration: 'underline'
                                }}
                            >
                                {translate('signup.privacyPolicy')}
                            </Button>
                        </Typography>
                    </Box>
                </Box>
            </form>
  
    );

    // Pre-release: ask for the invitation code before showing the signup form
    if (!invitationVerified) {
        return <PreReleaseInvitationGate onVerified={() => setInvitationVerified(true)} />;
    }

    // If Google client ID is configured, wrap with OAuth provider
    if (googleClientId) {
        return (
            <GoogleOAuthProvider clientId={googleClientId}>
                {formContent}
            </GoogleOAuthProvider>
        );
    }

    return formContent;
};

export default SignUpPage;
