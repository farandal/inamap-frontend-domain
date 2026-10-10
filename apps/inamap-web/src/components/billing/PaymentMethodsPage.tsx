import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Paper,
    alpha,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    CreditCard as CardIcon,
    Delete as DeleteIcon,
    CheckCircle as ConnectedIcon,
    Warning as WarningIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useDataProvider, useNotify, useRefresh, useTranslate } from 'react-admin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAxios } from 'dash-axios-hook';
import { useDialog } from 'dash-dialog';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import GatewaySelector from './GatewaySelector';
import RebillCardForm from './RebillCardForm';
import GatewayCallback from './GatewayCallback';
import { Route } from 'react-router-dom';

interface PaymentMethod {
    id: number;
    type: string;
    last_four: string;
    brand: string;
    is_default: boolean;
    gateway_name?: string;
    gateway_icon_url?: string;
    provider_payment_method_id?: string;
    created_at?: string;
}

interface SdkConfig {
    publicKey: string;
    customerId: string;
    gatewayId: number;
    environment: 'sandbox' | 'production';
}

interface PaymentMethodsPageProps {
    resourceConfig: IDashAutoAdminResourceConfig;
}

/**
 * PaymentMethodsPage
 * 
 * Custom list component for managing payment methods.
 * - If no payment method: shows gateway selector
 * - If payment method exists: shows card-based display
 * - Only ONE gateway/payment method association allowed
 */
const PaymentMethodsPage: React.FC<PaymentMethodsPageProps> = ({ resourceConfig }) => {
    const axios = useAxios();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();
    const queryClient = useQueryClient();
    const dialog = useDialog();
    
    const [sdkConfig, setSdkConfig] = useState<SdkConfig | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch payment methods - always refetch on mount to handle callback redirects
    const { data: paymentMethodsData, isLoading, error, refetch } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const response = await dataProvider.getList('tenancy/payment-methods', {
                pagination: { page: 1, perPage: 10 },
                sort: { field: 'created_at', order: 'DESC' },
                filter: { no_cache: true }, // Bypass any server-side caching
            });
            return response.data as PaymentMethod[];
        },
        // Force refetch on mount to get fresh data after gateway callback
        refetchOnMount: 'always',
        staleTime: 0, // Data is always considered stale
        gcTime: 0, // Don't cache the results (previously cacheTime)
        refetchOnWindowFocus: true, // Also refetch when window regains focus
    });

    const paymentMethods = paymentMethodsData || [];
    const hasPaymentMethod = paymentMethods.length > 0;
    const primaryPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];

    const handleRegistrationInitiated = (gateway: any, data: any) => {
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
        refetch();
        queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        notify(translate('billing.paymentMethodAdded', { _: 'Payment method added successfully!' }), { type: 'success' });
    };

    const handleSdkCancel = () => {
        setSdkConfig(null);
    };

    const handleDeletePaymentMethod = (paymentMethodId: number) => {
        dialog({
            variant: 'danger',
            title: translate('billing.paymentMethods.removePaymentMethod', { _: 'Remove Payment Method' }),
            content: translate('billing.paymentMethods.confirmRemovePaymentMethod', { 
                _: 'Are you sure you want to remove this payment method? You will need to add a new one to continue using paid features.' 
            }),
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    setDeleting(true);
                    await dataProvider.delete('tenancy/payment-methods', { id: paymentMethodId });
                    notify(translate('billing.paymentMethods.paymentMethodRemoved', { _: 'Payment method removed' }), { type: 'success' });
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
                } catch (err: any) {
                    notify(err.message || translate('billing.paymentMethods.errorRemovingPaymentMethod', { _: 'Failed to remove payment method' }), { type: 'error' });
                } finally {
                    setDeleting(false);
                }
            }
        });
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{(error as Error).message}</Alert>
            </Box>
        );
    }

    // Show SDK card form when configured
    if (sdkConfig) {
        return (
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom sx={{
                    fontWeight: "bold"
                }}>
                    {translate('billing.addPaymentMethod', { _: 'Add Payment Method' })}
                </Typography>
                <Paper
                    sx={{
                        p: 4,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        mt: 3,
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
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{
                fontWeight: "bold"
            }}>
                {translate('billing.paymentMethods.title', { _: 'Payment Methods' })}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                {translate('billing.paymentMethods.description', { 
                    _: 'Manage your payment methods for subscription billing.' 
                })}
            </Typography>

            {hasPaymentMethod ? (
                // Show connected payment method card
                (<Card
                    sx={{
                        maxWidth: 500,
                        border: '1px solid',
                        borderColor: 'success.main',
                        bgcolor: (theme) => alpha(theme.palette.success.main, 0.02),
                    }}
                >
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                {primaryPaymentMethod?.gateway_icon_url ? (
                                    <Box
                                        component="img"
                                        src={primaryPaymentMethod.gateway_icon_url}
                                        alt="Gateway"
                                        sx={{ width: 40, height: 40, objectFit: 'contain' }}
                                    />
                                ) : (
                                    <CardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6" sx={{
                                        fontWeight: "bold"
                                    }}>
                                        {primaryPaymentMethod?.brand || 'Card'} •••• {primaryPaymentMethod?.last_four}
                                    </Typography>
                                    <Chip
                                        icon={<ConnectedIcon />}
                                        label={translate('billing.paymentMethods.connected', { _: 'Connected' })}
                                        size="small"
                                        color="success"
                                    />
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    {primaryPaymentMethod?.gateway_name || translate('billing.paymentMethods.paymentCard', { _: 'Payment Card' })}
                                </Typography>
                            </Box>
                            <Tooltip title={translate('billing.paymentMethods.removePaymentMethodTooltip', { _: 'Remove payment method' })}>
                                <IconButton
                                    onClick={() => handleDeletePaymentMethod(primaryPaymentMethod.id)}
                                    disabled={deleting}
                                    color="error"
                                    sx={{ ml: 'auto' }}
                                >
                                    {deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {primaryPaymentMethod?.created_at && (
                            <Typography variant="caption" color="textSecondary">
                                {translate('billing.paymentMethods.addedOn', { _: 'Added on' })}{' '}
                                {new Date(primaryPaymentMethod.created_at).toLocaleDateString()}
                            </Typography>
                        )}
                    </CardContent>
                </Card>)
            ) : (
                // Show gateway selector
                (<Paper
                    sx={{
                        p: 4,
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.02),
                        border: '1px solid',
                        borderColor: 'info.main',
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                        <WarningIcon color="info" sx={{ fontSize: 32 }} />
                        <Box>
                            <Typography variant="h6">
                                {translate('billing.paymentMethods.noPaymentMethod', { _: 'No Payment Method' })}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {translate('billing.paymentMethods.addPaymentMethodToSubscribe', { 
                                    _: 'Add a payment method to subscribe to a paid plan.' 
                                })}
                            </Typography>
                        </Box>
                    </Box>

                    <GatewaySelector
                        onRegistrationInitiated={handleRegistrationInitiated}
                        returnUrl={`${window.location.origin}/tenancy/payment-methods/callback`}
                    />
                </Paper>)
            )}
        </Box>
    );
};

export default PaymentMethodsPage;
