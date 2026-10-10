import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField } from '@mui/material';
import { useTranslate } from '@app/components/hooks/usePolyglotTranslation';

interface PreReleaseEmailFormData {
    email: string;
}

/**
 * Pre-release email capture on the landing hero: just the email input.
 * Submitting navigates to /prerelease-signup with the email prefilled, where
 * the full form (name, phone, website, instagram) is completed on its own page.
 */
export default function PreReleaseSignupForm() {
    const translate = useTranslate();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PreReleaseEmailFormData>();

    function onSubmit(data: PreReleaseEmailFormData) {
        navigate('/prerelease-signup', { state: { email: data.email } });
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: 'stretch',
            }}
        >
            <TextField
                label={translate('landing.prerelease.form.email')}
                required
                fullWidth
                size="medium"
                autoFocus
                {...register('email', {
                    required: translate('landing.prerelease.form.emailRequired'),
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: translate('landing.prerelease.form.emailInvalid'),
                    },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ flex: 1, minWidth: '250px' }}
                slotProps={{
                    htmlInput: { type: 'email' }
                }} />
            <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    backgroundColor: '#E1251B',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#B91C1C' },
                }}
            >
                {translate('landing.prerelease.form.continue')}
            </Button>
        </Box>
    );
}
