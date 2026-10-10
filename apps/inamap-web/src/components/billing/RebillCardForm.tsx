import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Alert,
    Paper,
} from '@mui/material';
import { CreditCard as CardIcon } from '@mui/icons-material';
import { useTranslate, useNotify } from 'react-admin';

interface RebillCardFormProps {
    publicKey: string;
    customerId: string;
    gatewayId: number;
    environment?: 'sandbox' | 'production';
    onSuccess?: () => void;
    onCancel?: () => void;
}

declare global {
    interface Window {
        Rebill: any;
    }
}

/**
 * RebillCardForm
 * 
 * Embeds Rebill's JavaScript SDK v3 for secure payment processing.
 * Uses the checkout.create() API to render payment form.
 */
const RebillCardForm: React.FC<RebillCardFormProps> = ({
    publicKey,
    customerId,
    gatewayId,
    environment = 'sandbox',
    onSuccess,
    onCancel,
}) => {
    const translate = useTranslate();
    const notify = useNotify();
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [sdkError, setSdkError] = useState<string | null>(null);
    const [rebillInstance, setRebillInstance] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load Rebill SDK v3 script
    useEffect(() => {
        if (window.Rebill) {
            setSdkLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.rebill.com/v3/rebill.js';
        script.async = true;
        script.onload = () => {
            setSdkLoaded(true);
        };
        script.onerror = () => {
            setSdkError('Failed to load Rebill SDK');
        };
        document.head.appendChild(script);

        return () => {
            // Script stays loaded for reuse
        };
    }, []);

    // Initialize Rebill SDK when loaded
    useEffect(() => {
        if (!sdkLoaded || !window.Rebill || rebillInstance) {
            return;
        }

        try {
            const rebill = new window.Rebill(publicKey);
            setRebillInstance(rebill);
        } catch (err: any) {
            console.error('Rebill SDK init error:', err);
            setSdkError(err.message || 'Failed to initialize Rebill SDK');
        }
    }, [sdkLoaded, publicKey, rebillInstance]);

    // Create and mount checkout form
    useEffect(() => {
        if (!rebillInstance || !containerRef.current) {
            return;
        }

        try {
            // Create checkout form for card registration
            // Using minimal amount for card verification
            const checkoutForm = rebillInstance.checkout.create({
                name: translate('billing.cardRegistration', { _: 'Card Registration' }),
                amount: 0, // $0 for card registration only
                currency: 'CLP',
                // Additional options can be added here
            });

            // Mount to our container
            checkoutForm.mount('rebill-form');

            // Listen for completion events
            checkoutForm.on('success', (result: any) => {
                console.log('Rebill checkout success:', result);
                notify(translate('billing.cardAdded', { _: 'Card added successfully!' }), { type: 'success' });
                onSuccess?.();
            });

            checkoutForm.on('error', (error: any) => {
                console.error('Rebill checkout error:', error);
                notify(error.message || 'Payment failed', { type: 'error' });
            });

        } catch (err: any) {
            console.error('Rebill checkout error:', err);
            setSdkError(err.message || 'Failed to create checkout form');
        }
    }, [rebillInstance, translate, notify, onSuccess]);

    if (sdkError) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {sdkError}
                </Alert>
                <Button variant="outlined" onClick={onCancel}>
                    {translate('ra.action.cancel', { _: 'Cancel' })}
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CardIcon color="primary" />
                <Typography variant="h6">
                    {translate('billing.enterCardDetails', { _: 'Enter Card Details' })}
                </Typography>
            </Box>

            {!sdkLoaded || !rebillInstance ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>
                        {translate('billing.loadingPaymentForm', { _: 'Loading payment form...' })}
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Rebill SDK will mount its iframe here */}
                    <Box
                        id="rebill-form"
                        ref={containerRef}
                        sx={{
                            minHeight: 350,
                            width: '100%',
                            '& iframe': {
                                border: 'none',
                                width: '100%',
                                minHeight: 350,
                            },
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                        {onCancel && (
                            <Button variant="outlined" onClick={onCancel}>
                                {translate('ra.action.cancel', { _: 'Cancel' })}
                            </Button>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default RebillCardForm;
