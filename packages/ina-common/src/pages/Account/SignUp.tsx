import React, { createRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useNotify } from 'react-admin';
import ReCAPTCHA from 'react-google-recaptcha';
import { 
    Grid, 
    IconButton, 
    TextField, 
    Card, 
    CardContent, 
    Typography, 
    Box,
    Chip,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Divider,
    Alert,
    useTheme,
    useMediaQuery
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GoogleIcon from '@mui/icons-material/Google';

import { DASH_REDUX_ACTIONS, IDASHAppState } from 'dash-admin-state';
import DictionaryContext from 'dash-admin/src/contexts/dictionary/DictionaryContext';
import { useAxios } from 'dash-axios-hook';
import { useDialog } from 'dash-dialog';
import {DASHAdminSystemConstants} from 'dash-constants';
import { RutValidator } from 'dash-admin/src/utils/validators';
import FullLayoutMarkup from 'dash-admin/src/default-theme/FullLayoutMarkup';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';

// Dictionary for translations
const signUpDict = {
    // Main titles and headers
    "createYourAccount": "Crea Tu Cuenta",
    "chooseYourPlan": "Elige Tu Plan",
    "accountInformation": "Información de la Cuenta",
    
    // Form fields
    "email": "Correo Electrónico",
    "businessName": "Nombre de la Empresa",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "password": "Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "contactPhone": "Teléfono de Contacto",
    
    // Buttons and actions
    "continueWithGoogle": "Continuar con Google",
    "connecting": "Conectando...",
    "createAccountStartTrial": "Crear Cuenta e Iniciar Prueba",
    "creatingAccount": "Creando Cuenta...",
    "cancel": "Cancelar",
    
    // Plan related
    "features": "Características",
    "loadingPlans": "Cargando planes...",
    "month": "mes",
    "year": "año",
    "freeTrialDays": "días de prueba gratis",
    "noTrialPeriod": "Sin período de prueba",
    "moreFeatures": "características más",
    
    // Messages and notifications
    "orSignUpWithEmail": "o regístrate con correo electrónico",
    "termsOfService": "Términos de Servicio",
    "privacyPolicy": "Política de Privacidad",
    "byCreatingAccount": "Al crear una cuenta, aceptas nuestros",
    "and": "y",
    
    // Validation messages
    "emailRequired": "El correo electrónico es obligatorio",
    "invalidEmail": "Dirección de correo electrónico inválida",
    "businessNameRequired": "El nombre de la empresa es obligatorio",
    "rutRequired": "El RUT es obligatorio",
    "invalidRut": "RUT inválido",
    "firstNameRequired": "El nombre es obligatorio",
    "lastNameRequired": "El apellido es obligatorio",
    "passwordRequired": "La contraseña es obligatoria",
    "passwordMinLength": "La contraseña debe tener al menos 8 caracteres",
    "confirmPasswordRequired": "Por favor confirma tu contraseña",
    "passwordsDoNotMatch": "Las contraseñas no coinciden",
    "phoneRequired": "El número de teléfono es obligatorio",
    "planRequired": "Por favor selecciona un plan de suscripción",
    
    // Success and error messages
    "accountCreatedSuccess": "¡Cuenta creada exitosamente! Por favor revisa tu correo electrónico para verificar tu cuenta.",
    "errorOccurred": "Ocurrió un error, por favor intenta de nuevo",
    "registrationError": "Ocurrió un error durante el registro",
    "plansLoadError": "Error al cargar los planes de suscripción",
    "googleSignupDisabled": "El registro con Google está actualmente deshabilitado",
    "googleAuthError": "Error con la autenticación de Google",
    
    // Dialog and error titles
    "error": "Error"
};

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    features: string[];
    is_active: boolean;
    trial_days: number;
}

interface SignUpFormData {
    email: string;
    clientname: string;
    public_id: string;
    name: string;
    lastname: string;
    password: string;
    confirm_password: string;
    phone: string;
    selected_plan_id?: number;
    'g-recaptcha-response'?: string;
}

/**
 * Componente de página de registro que maneja el registro de usuarios con selección de plan de suscripción
 * e integración con autenticación de Google
 */
const SignUpPage = (props) => {

    const {panelSettings} = props;

    const enableRecaptcha: boolean = DASHAdminSystemConstants.system.RECAPTCHA_ENABLED;
    const enableGoogleSignup: boolean = DASHAdminSystemConstants.system.GOOGLE_SIGNUP !== false;
    const recaptchaRef = createRef<ReCAPTCHA>();
    const [recpatcha, setRecaptcha] = useState(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [plansLoading, setPlansLoading] = useState(true);
    const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

    // Add responsive breakpoints
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const dispatch = useDispatch();
    const dialog = useDialog();
    const dict = React.useContext(DictionaryContext);
    const navigate = useNavigate();
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

    const onChangeRecaptcha = (value: string) => {
        clearErrors('g-recaptcha-response');
        setRecaptcha(value);
    };

    // Load subscription plans
    useEffect(() => {
        const loadPlans = async () => {
            try {
                setPlansLoading(true);
                const response = await axios.get('/subscription-plans');
                if (response.data?.data) {
                    setPlans(response.data.data);
                    // Auto-select first plan if available
                    if (response.data.data.length > 0) {
                        setSelectedPlan(response.data.data[0].id);
                        setValue('selected_plan_id', response.data.data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading subscription plans:', error);
                notify(signUpDict.plansLoadError, { type: 'warning' });
            } finally {
                setPlansLoading(false);
            }
        };

        loadPlans();
    }, []);

    useEffect(() => {
        dispatch(
            DASH_REDUX_ACTIONS.updatePage({
                title: null,
            }),
        );
    }, []);

    const handlePlanSelection = (planId: number) => {
        setSelectedPlan(planId);
        setValue('selected_plan_id', planId);
        clearErrors('selected_plan_id');
    };

    const handleGoogleSignUp = async () => {
        if (!enableGoogleSignup) {
            notify(signUpDict.googleSignupDisabled, { type: 'warning' });
            return;
        }

        try {
            setGoogleAuthLoading(true);
            
            // Initialize Google OAuth flow
            // This would typically redirect to Google's OAuth endpoint
            const googleAuthUrl = DASHAdminSystemConstants.system.API_URL+`/api/auth/google/redirect?signup=true&plan_id=${selectedPlan || ''}`;
            window.location.href = googleAuthUrl;
            
        } catch (error) {
            console.error('Google authentication error:', error);
            notify(signUpDict.googleAuthError, { type: 'error' });
        } finally {
            setGoogleAuthLoading(false);
        }
    };

    async function onSubmit(data: SignUpFormData) {
        try {
            setLoading(true);
            clearErrors();

            // Validate plan selection
            if (!selectedPlan) {
                setError('selected_plan_id', {
                    type: 'required',
                    message: signUpDict.planRequired
                });
                return;
            }

            if (data.clientname) {
                const bracketed_name = 'client[name]';
                data[bracketed_name] = data.clientname;
                delete data.clientname;
            }

            // Add selected plan
            data.selected_plan_id = selectedPlan;

            if (enableRecaptcha) {
                const recaptchaValue =
                    recaptchaRef.current && recaptchaRef.current.getValue
                        ? recaptchaRef.current.getValue()
                        : recpatcha;
                data['g-recaptcha-response'] = recaptchaValue;
            }

            const response = await axios.post('/auth/user/signup', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.status >= 200) {
                notify(signUpDict.accountCreatedSuccess, { type: 'success' });
                
                // Redirect to a success page or login
                navigate('/signup-success', { 
                    state: { 
                        email: data.email, 
                        planName: plans.find(p => p.id === selectedPlan)?.name 
                    } 
                });
            } else {
                dialog({
                    variant: 'danger',
                    title: signUpDict.error,
                    content: signUpDict.errorOccurred,
                });
            }
        } catch (error: any) {
            console.error('SignUp error:', error);
            
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                for (const key in errors) {
                    if (key === 'client.name') {
                        setError('clientname', {
                            type: 'custom',
                            message: dict.get(errors[key], true),
                        });
                    } else {
                        setError(key as keyof SignUpFormData, { 
                            type: 'custom', 
                            message: dict.get(errors[key], true) 
                        });
                    }
                }
            } else {
                notify(signUpDict.registrationError, { type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    }

    const formatPrice = (price: number, billingCycle: string) => {
        return `${price.toFixed(2)}/${billingCycle === 'monthly' ? signUpDict.month : signUpDict.year}`;
    };

    const getTrialText = (trialDays: number) => {
        return trialDays > 0 ? `${trialDays} ${signUpDict.freeTrialDays}` : signUpDict.noTrialPeriod;
    };

    return (
        <FullLayoutMarkup className='dash-signup' logo={panelSettings?.horizontalLogo} loginBackground={panelSettings?.loginBackground}>
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
                        {signUpDict.createYourAccount}
                    </Typography>
                </Box>

                {/* Google Sign Up Button - Only show if enabled */}
                {enableGoogleSignup && (
                    <>
                        <div className='dash-app-form-item'>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GoogleIcon />}
                                onClick={handleGoogleSignUp}
                                disabled={googleAuthLoading || !selectedPlan}
                                size="large"
                                sx={{ 
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}
                            >
                                {googleAuthLoading ? signUpDict.connecting : signUpDict.continueWithGoogle}
                            </Button>
                        </div>

                        <Divider sx={{ my: { xs: 2, sm: 3 } }}>
                            <Typography variant="body2" color="textSecondary">
                                {signUpDict.orSignUpWithEmail}
                            </Typography>
                        </Divider>
                    </>
                )}

                {/* Subscription Plans Selection */}
                <div className='dash-app-form-item'>
                    <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend">
                            <Typography 
                                variant={isMobile ? "h6" : "h5"} 
                                gutterBottom
                                sx={{ 
                                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                    fontWeight: 'medium',
                                    mb: { xs: 2, sm: 3 }
                                }}
                            >
                                {signUpDict.chooseYourPlan}
                            </Typography>
                        </FormLabel>
                        
                        {plansLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 2
                                }}>
                                <Typography>{signUpDict.loadingPlans}</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                                {plans.map((plan) => (
                                    <Grid 
                                        key={plan.id}
                                        size={{ 
                                            xs: 12, 
                                            sm: plans.length === 1 ? 12 : 6, 
                                            md: plans.length <= 2 ? 6 : 4 
                                        }}
                                    >
                                        <Card 
                                            variant={selectedPlan === plan.id ? "outlined" : "elevation"}
                                            sx={{ 
                                                cursor: 'pointer',
                                                border: selectedPlan === plan.id ? 2 : 1,
                                                borderColor: selectedPlan === plan.id ? 'primary.main' : 'divider',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.2s ease-in-out'
                                                },
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                width: '100%'
                                            }}
                                            onClick={() => handlePlanSelection(plan.id)}
                                        >
                                            <CardContent sx={{ 
                                                flexGrow: 1, 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                p: { xs: 2, sm: 3 }
                                            }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        mb: 2
                                                    }}>
                                                    <Typography 
                                                        variant={isMobile ? "h6" : "h5"} 
                                                        component="div"
                                                        sx={{ 
                                                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {plan.name}
                                                    </Typography>
                                                    {selectedPlan === plan.id && (
                                                        <CheckCircleIcon 
                                                            color="primary" 
                                                            sx={{ ml: 'auto', fontSize: { xs: 20, sm: 24 } }} 
                                                        />
                                                    )}
                                                </Box>
                                                
                                                <Typography 
                                                    variant={isMobile ? "h5" : "h4"} 
                                                    color="primary" 
                                                    gutterBottom
                                                    sx={{ 
                                                        fontSize: { xs: '1.5rem', sm: '2rem' },
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ${formatPrice(plan.price, plan.billing_cycle)}
                                                </Typography>
                                                
                                                <Chip 
                                                    label={getTrialText(plan.trial_days)}
                                                    color="secondary"
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        mb: 2,
                                                        alignSelf: 'flex-start',
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                    }}
                                                />
                                                
                                                <Typography
                                                    variant="body2"
                                                    color="textSecondary"
                                                    sx={{ 
                                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                                        lineHeight: 1.5,
                                                        mb: 2
                                                    }}>
                                                    {plan.description}
                                                </Typography>
                                                
                                                {plan.features && plan.features.length > 0 && (
                                                    <Box sx={{ mt: 'auto' }}>
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            gutterBottom
                                                            sx={{ 
                                                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                                                fontWeight: 'medium'
                                                            }}
                                                        >
                                                            {signUpDict.features}:
                                                        </Typography>
                                                        {plan.features.slice(0, isMobile ? 2 : 3).map((feature, index) => (
                                                            <Typography 
                                                                key={index} 
                                                                variant="body2" 
                                                                color="textSecondary"
                                                                sx={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'flex-start', 
                                                                    mb: 0.5,
                                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                                                }}
                                                            >
                                                                <CheckCircleIcon 
                                                                    sx={{ 
                                                                        fontSize: { xs: 14, sm: 16 }, 
                                                                        mr: 1, 
                                                                        color: 'success.main',
                                                                        mt: 0.1,
                                                                        flexShrink: 0
                                                                    }} 
                                                                />
                                                                {feature}
                                                            </Typography>
                                                        ))}
                                                        {plan.features.length > (isMobile ? 2 : 3) && (
                                                            <Typography 
                                                                variant="body2" 
                                                                color="primary"
                                                                sx={{ 
                                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                                    fontWeight: 'medium'
                                                                }}
                                                            >
                                                                +{plan.features.length - (isMobile ? 2 : 3)} {signUpDict.moreFeatures}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                        
                        {errors.selected_plan_id && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {errors.selected_plan_id.message}
                            </Alert>
                        )}
                    </FormControl>
                </div>

                {/* User Information Form - Constrained to 50% width on large screens */}
                <Box
                    sx={{
                        width: { xs: '100%', lg: '50%' },
                        ml: { lg: 0 },
                        mr: { lg: 'auto' }
                    }}
                >
                    <Typography 
                        variant={isMobile ? "h6" : "h5"} 
                        gutterBottom 
                        sx={{ 
                            mt: { xs: 3, sm: 4 },
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            fontWeight: 'medium'
                        }}
                    >
                        {signUpDict.accountInformation}
                    </Typography>

                    <div className='dash-app-form-item'>
                        <TextField
                            placeholder={signUpDict.email}
                            label={signUpDict.email}
                            required
                            fullWidth
                            {...register('email', {
                                required: signUpDict.emailRequired,
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: signUpDict.invalidEmail
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
                            placeholder={signUpDict.businessName}
                            label={signUpDict.businessName}
                            required
                            fullWidth
                            className='dash-app-form-item-input'
                            {...register('clientname', {
                                required: signUpDict.businessNameRequired
                            })}
                            error={!!errors.clientname}
                            helperText={errors.clientname?.message}
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
                            label='RUT'
                            required
                            fullWidth
                            className='dash-app-form-item-input'
                            {...register('public_id', { 
                                validate: RutValidator,
                                required: signUpDict.rutRequired
                            })}
                            error={!!errors.public_id}
                            helperText={errors.public_id?.message || (errors.public_id ? signUpDict.invalidRut : '')}
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
                                    placeholder={signUpDict.firstName}
                                    label={signUpDict.firstName}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    {...register('name', {
                                        required: signUpDict.firstNameRequired
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
                                    placeholder={signUpDict.lastName}
                                    label={signUpDict.lastName}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    {...register('lastname', {
                                        required: signUpDict.lastNameRequired
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
                                    placeholder={signUpDict.password}
                                    label={signUpDict.password}
                                    required
                                    fullWidth
                                    type='password'
                                    className='dash-app-form-item-input'
                                    {...register('password', {
                                        required: signUpDict.passwordRequired,
                                        minLength: {
                                            value: 8,
                                            message: signUpDict.passwordMinLength
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
                                    placeholder={signUpDict.confirmPassword}
                                    label={signUpDict.confirmPassword}
                                    required
                                    fullWidth
                                    className='dash-app-form-item-input'
                                    type='password'
                                    {...register('confirm_password', {
                                        required: signUpDict.confirmPasswordRequired,
                                        validate: (value) => {
                                            const password = form.getValues('password');
                                            return value === password || signUpDict.passwordsDoNotMatch;
                                        }
                                    })}
                                    error={!!errors.confirm_password}
                                    helperText={errors.confirm_password?.message}
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
                            label={signUpDict.contactPhone}
                            required
                            fullWidth
                            placeholder='+569 1234 5678'
                            className='dash-app-form-item-input'
                            {...register('phone', {
                                required: signUpDict.phoneRequired
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
                            disabled={(!recpatcha && enableRecaptcha) || loading || !selectedPlan}
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
                            {loading ? signUpDict.creatingAccount : signUpDict.createAccountStartTrial}
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
                            {signUpDict.cancel}
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
                            {signUpDict.byCreatingAccount}{' '}
                            <Button 
                                variant="text" 
                                size="small" 
                                onClick={() => navigate('/legal')}
                                sx={{ 
                                    textTransform: 'none', 
                                    p: 0, 
                                    minWidth: 'auto',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    textDecoration: 'underline'
                                }}
                            >
                                {signUpDict.termsOfService}
                            </Button>
                            {' '}{signUpDict.and}{' '}
                            <Button 
                                variant="text" 
                                size="small" 
                                onClick={() => navigate('/legal')}
                                sx={{ 
                                    textTransform: 'none', 
                                    p: 0, 
                                    minWidth: 'auto',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    textDecoration: 'underline'
                                }}
                            >
                                {signUpDict.privacyPolicy}
                            </Button>
                        </Typography>
                    </Box>
                </Box>
            </form>
        </FullLayoutMarkup>
    );
};

export default SignUpPage;

