import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslate } from '../hooks/usePolyglotTranslation';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useAxios } from 'dash-axios-hook';


interface VerifyAccountProps {
    
}

const TrialVerify: React.FC<VerifyAccountProps> = ({
    
}) => {
    const translate = useTranslate();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const axios  = useAxios();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(translate('verify.verifying'));

    const verify = async () => {
        try {
          

            const id = searchParams.get('id');
            const token = searchParams.get('token');

            if (!id || !token) {
                setStatus('error');
                setMessage(translate('verify.invalidLink'));
                setTimeout(() => navigate('/login'), 8000);
                return;
            }

            const verificationUrl = `/trial/verify/${id}/${token}`;
            
            const res = await axios.get(verificationUrl);
            
            switch (res.status) {
                case 200:
                    setStatus('success');
                    setMessage(translate('verify.success'));
                    setTimeout(() => navigate('/login'), 3000);
                    break;
                case 204:
                    setStatus('success');
                    setMessage(translate('verify.alreadyVerified'));
                    setTimeout(() => navigate('/login'), 3000);
                    break;
                default:
                    setStatus('error');
                    setMessage(translate('verify.error'));
                    setTimeout(() => navigate('/login'), 8000);
                    break;
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(translate('verify.error'));
            setTimeout(() => navigate('/login'), 8000);
        }
    };

    useEffect(() => {
        verify();
    }, []);

    return (
        <>
            <div className="dash-app-login-form">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3,
                        borderRadius: 2,
                        p: 4,
                        minWidth: 320,
                        minHeight: 200,
                        backgroundColor: 'background.paper',
                        mx: 'auto',
                        my: 8,
                    }}
                >
                    <h1 className="dash-app-login-form-title">{translate('verify.title')}</h1>
                    {status === 'loading' && <CircularProgress size={60} thickness={4} />}
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>
                        {message}
                    </Typography>
                </Box>
                
            </div>
        </>
    );
};

export default TrialVerify;
