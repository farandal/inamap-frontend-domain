import React, { useState } from 'react';
import { Box, Typography, Alert, Paper, alpha } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useTranslate } from 'react-admin';
import GatewaySelector from './GatewaySelector';
import RebillCardForm from './RebillCardForm';

interface AddPaymentMethodPromptProps {
    trialEndsAt?: string;
    planName?: string;
    onRegistrationComplete?: () => void;
}

interface SdkConfig {
    publicKey: string;
    customerId: string;
    gatewayId: number;
    environment: 'sandbox' | 'production';
}

/**
 * AddPaymentMethodPrompt
 * 
 * Shown to trial users who need to add a payment method
 * before their trial expires.
 */
const AddPaymentMethodPrompt: React.FC<AddPaymentMethodPromptProps> = ({
    trialEndsAt,
    planName,
    onRegistrationComplete,
}) => {
    const translate = useTranslate();
    const [sdkConfig, setSdkConfig] = useState<SdkConfig | null>(null);

    // Calculate days remaining
    const daysRemaining = trialEndsAt
        ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const handleRegistrationInitiated = (gateway: any, data: any) => {
        // For SDK method (Rebill), show the card form
        if (data.method === 'sdk' && data.public_key) {
            setSdkConfig({
                publicKey: data.public_key,
                customerId: data.customer_id,
                gatewayId: data.gateway_id,
                environment: data.environment || 'sandbox',
            });
        }
        // Redirect method is handled in GatewaySelector
    };

    const handleSdkSuccess = () => {
        setSdkConfig(null);
        onRegistrationComplete?.();
    };

    const handleSdkCancel = () => {
        setSdkConfig(null);
    };

    // Show SDK card form when configured
    if (sdkConfig) {
        return (
            <Paper
                sx={{
                    p: 4,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                }}
            >
                <RebillCardForm
                    publicKey={sdkConfig.publicKey}
                    customerId={sdkConfig.customerId}
                    gatewayId={sdkConfig.gatewayId}
                    environment={sdkConfig.environment}
                    onSuccess={handleSdkSuccess}
                    onCancel={handleSdkCancel}
                />
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                p: 4,
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                border: '1px solid',
                borderColor: 'warning.main',
                borderRadius: 2,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                <Box>
                    <Typography variant="h6">
                        {translate('billing.addPaymentRequired', { _: 'Payment Method Required' })}
                    </Typography>
                    {daysRemaining !== null && (
                        <Typography variant="body2" color="textSecondary">
                            {daysRemaining > 0
                                ? translate('billing.trialEndsIn', {
                                      days: daysRemaining,
                                      _: `Your trial ends in ${daysRemaining} day(s)`,
                                  })
                                : translate('billing.trialEnded', { _: 'Your trial has ended' })}
                        </Typography>
                    )}
                    {planName && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {translate('billing.planContinue', {
                                plan: planName,
                                _: `Add a payment method to continue using ${planName}`,
                            })}
                        </Typography>
                    )}
                </Box>
            </Box>

            <GatewaySelector
                onRegistrationInitiated={handleRegistrationInitiated}
                returnUrl={`${window.location.origin}/tenancy/subscriptions/callback`}
            />
        </Paper>
    );
};

export default AddPaymentMethodPrompt;

