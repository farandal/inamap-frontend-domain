import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { IDASHAppState } from 'dash-admin-state';
import { useAxios } from 'dash-axios-hook';
import { useTranslate } from '../hooks/usePolyglotTranslation';

interface PreReleaseSignupData {
    name: string;
    email: string;
    contact_phone?: string;
    business_website?: string;
    business_instagram?: string;
}

/**
 * Full pre-release signup form, reached from the landing hero's email
 * capture (/prerelease-signup, with the email pre-filled via navigation
 * state). Posts to the public /prerelease/register endpoint together with
 * the current UI language, so the backend can send the welcome email in
 * the right locale.
 */
export default function PreReleaseSignUp() {
    const translate = useTranslate();
    const axios = useAxios();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const settings = useSelector((state: IDASHAppState<any, any, any>) => state.settings);
    const currentLocale = settings?.locale || 'es';

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors },
    } = useForm<PreReleaseSignupData>();

    // Pre-fill email from navigation state (from the landing hero's capture form)
    useEffect(() => {
        const emailFromState = (location.state as { email?: string })?.email;
        if (emailFromState) {
            setValue('email', emailFromState);
        }
    }, [location.state, setValue]);

    async function onSubmit(data: PreReleaseSignupData) {
        try {
            setLoading(true);
            setSubmitError(null);

            await axios.post('/prerelease/register', {
                name: data.name,
                email: data.email,
                contact_phone: data.contact_phone || null,
                business_website: data.business_website || null,
                business_instagram: data.business_instagram || null,
                preferred_language: currentLocale,
            });

            setSubmitted(true);
        } catch (error: any) {
            console.error('Pre-release signup error:', error);
            const responseErrors = error.response?.data?.errors;
            if (responseErrors) {
                for (const key in responseErrors) {
                    setError(key as keyof PreReleaseSignupData, {
                        type: 'custom',
                        message: Array.isArray(responseErrors[key]) ? responseErrors[key][0] : responseErrors[key],
                    });
                }
            } else {
                setSubmitError(error.response?.data?.message || translate('landing.prerelease.form.error'));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 10 } }}>
            {submitted ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        p: { xs: 3, sm: 4 },
                        borderRadius: '12px',
                        backgroundColor: 'rgba(155, 193, 60, 0.12)',
                        border: '1px solid rgba(155, 193, 60, 0.5)',
                    }}
                >
                    <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#9bc13c', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {translate('landing.prerelease.success.title')}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        {translate('landing.prerelease.success.message')}
                    </Typography>
                </Box>
            ) : (
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label={translate('landing.prerelease.form.name')}
                        required
                        fullWidth
                        autoFocus
                        size="medium"
                        {...register('name', { required: translate('landing.prerelease.form.nameRequired') })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />
                    <TextField
                        label={translate('landing.prerelease.form.email')}
                        required
                        fullWidth
                        size="medium"
                        {...register('email', {
                            required: translate('landing.prerelease.form.emailRequired'),
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: translate('landing.prerelease.form.emailInvalid'),
                            },
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        slotProps={{
                            htmlInput: { type: 'email' }
                        }} />
                    <TextField
                        label={translate('landing.prerelease.form.contactPhone')}
                        fullWidth
                        size="medium"
                        placeholder="+569 1234 5678"
                        {...register('contact_phone')}
                        error={!!errors.contact_phone}
                        helperText={errors.contact_phone?.message}
                    />
                    <TextField
                        label={translate('landing.prerelease.form.businessWebsite')}
                        fullWidth
                        size="medium"
                        placeholder="https://"
                        {...register('business_website')}
                        error={!!errors.business_website}
                        helperText={errors.business_website?.message}
                    />
                    <TextField
                        label={translate('landing.prerelease.form.businessInstagram')}
                        fullWidth
                        size="medium"
                        placeholder="@"
                        {...register('business_instagram')}
                        error={!!errors.business_instagram}
                        helperText={errors.business_instagram?.message}
                    />

                    {submitError && <Alert severity="error">{submitError}</Alert>}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                            borderRadius: '8px',
                            padding: '12px 28px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            backgroundColor: '#9bc13c',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#7faa00' },
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : translate('landing.prerelease.form.send')}
                    </Button>
                </Box>
            )}
        </Container>
    );
}
