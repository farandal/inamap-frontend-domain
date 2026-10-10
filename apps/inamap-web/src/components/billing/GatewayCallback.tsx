import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Paper } from '@mui/material';
import { CheckCircle as SuccessIcon, Error as ErrorIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslate } from 'react-admin';
import { useAxios } from 'dash-axios-hook';
import { useQueryClient } from '@tanstack/react-query';

/**
 * GatewayCallback
 * 
 * Handles callback from external payment gateways (e.g., Flow.cl redirect).
 * Completes the card registration process and redirects to subscription page.
 * 
 * Route: /tenancy/billing/callback
 * Query params: token, gateway_id
 */
const GatewayCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const translate = useTranslate();
    const axios = useAxios();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const completeRegistration = async () => {
            const token = searchParams.get('token');
            const gatewayId = searchParams.get('gateway_id');

            if (!token) {
                setStatus('error');
                setMessage(translate('billing.callback.noToken', { _: 'No registration token received' }));
                return;
            }

            try {
                const response = await axios.post('/tenancy/payment-methods/complete', {
                    gateway_id: gatewayId ? parseInt(gatewayId) : undefined,
                    token,
                });

                const result = response.data;

                if (result.success) {
                    setStatus('success');
                    setMessage(translate('billing.callback.success', { _: 'Payment method added successfully!' }));
                    
                    // Invalidate payment-methods cache to ensure fresh data on redirect
                    await queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
                    
                    // Redirect to payment-methods page after 2 seconds
                    setTimeout(() => {
                        navigate('/tenancy/payment-methods', { replace: true });
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Failed to complete registration');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.error || err.message || translate('billing.callback.error', { _: 'Failed to complete registration' }));
            }
        };

        completeRegistration();
    }, []);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', p: 3 }}>
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
                {status === 'loading' && (
                    <>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="h6">
                            {translate('billing.callback.processing', { _: 'Processing your card...' })}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {translate('billing.callback.pleaseWait', { _: 'Please wait while we complete your registration.' })}
                        </Typography>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            {translate('billing.callback.successTitle', { _: 'Success!' })}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {translate('billing.callback.redirecting', { _: 'Redirecting you back...' })}
                        </Typography>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            {translate('billing.callback.errorTitle', { _: 'Something went wrong' })}
                        </Typography>
                        <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                            {message}
                        </Alert>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/tenancy/payment-methods')}
                        >
                            {translate('billing.callback.tryAgain', { _: 'Try Again' })}
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default GatewayCallback;
