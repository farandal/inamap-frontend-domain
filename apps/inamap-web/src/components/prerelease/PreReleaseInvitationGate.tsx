import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslate } from '@app/components/hooks/usePolyglotTranslation';
import { getPreReleaseInvitationCode } from '@app/utils/releaseStage';

interface PreReleaseInvitationGateProps {
    onVerified: () => void;
}

/**
 * Pre-release signup guard: asks for an invitation code before revealing the
 * signup form. The expected code comes from the environment
 * (VITE_APP_PRERELEASE_INVITATION_CODE) and is compared case-insensitively.
 */
export default function PreReleaseInvitationGate({ onVerified }: PreReleaseInvitationGateProps) {
    const translate = useTranslate();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [invalid, setInvalid] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const expected = getPreReleaseInvitationCode();
        if (expected && code.trim().toUpperCase() === expected.toUpperCase()) {
            setInvalid(false);
            onVerified();
        } else {
            setInvalid(true);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                maxWidth: 440,
                mx: 'auto',
                mt: { xs: 6, sm: 10 },
                mb: 6,
                p: { xs: 3, sm: 4 },
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <LockOutlinedIcon sx={{ fontSize: 48, color: '#9bc13c', mx: 'auto' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {translate('signup.invitation.title')}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                {translate('signup.invitation.description')}
            </Typography>

            <TextField
                label={translate('signup.invitation.codeLabel')}
                value={code}
                onChange={(e) => {
                    setCode(e.target.value);
                    setInvalid(false);
                }}
                fullWidth
                autoFocus
                slotProps={{
                    htmlInput: { style: { textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' } }
                }}
            />

            {invalid && <Alert severity="error">{translate('signup.invitation.invalidCode')}</Alert>}

            <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!code.trim()}
                sx={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                    backgroundColor: '#9bc13c',
                    '&:hover': { backgroundColor: '#7faa00' },
                }}
            >
                {translate('signup.invitation.submit')}
            </Button>

            <Button variant="text" onClick={() => navigate('/')} sx={{ textTransform: 'none' }}>
                {translate('signup.invitation.back')}
            </Button>
        </Box>
    );
}
