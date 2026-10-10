import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
} from '@mui/material';
import {
    CreditCard as CardIcon,
    ArrowForward as ArrowIcon,
    Science as TestIcon,
} from '@mui/icons-material';
import { useNotify, useTranslate } from 'react-admin';
import { useQuery } from '@tanstack/react-query';
import { useAxios } from 'dash-axios-hook';

interface Gateway {
    id: number;
    pivot_id: number;
    name: string;
    identifier: string;
    display_name: string;
    icon_url: string | null;
    region: string | null;
    registration_method: 'form' | 'sdk' | 'redirect';
    is_simulation: boolean;
    supported_currencies: string[];
}

interface GatewaySelectorProps {
    onGatewaySelected?: (gateway: Gateway) => void;
    onRegistrationInitiated?: (gateway: Gateway, data: any) => void;
    returnUrl?: string;
}

/**
 * GatewaySelector
 * 
 * Displays available payment gateways for the tenancy.
 * User selects one to initiate card registration.
 */
const GatewaySelector: React.FC<GatewaySelectorProps> = ({
    onGatewaySelected,
    onRegistrationInitiated,
    returnUrl = `${window.location.origin}/tenancy/payment-methods/callback`,
}) => {
    const axios = useAxios();
    const notify = useNotify();
    const translate = useTranslate();
    const [initiating, setInitiating] = React.useState<number | null>(null);

    // Fetch available gateways
    const { data: gatewaysResponse, isLoading, error } = useQuery<{ success: boolean; data: Gateway[] }>({
        queryKey: ['available-gateways'],
        queryFn: async () => {
            const response = await axios.get('/tenancy/gateways/available');
            return response.data;
        },
    });

    const gateways = gatewaysResponse?.data || [];

    const handleSelectGateway = async (gateway: Gateway) => {
        onGatewaySelected?.(gateway);
        
        try {
            setInitiating(gateway.id);

            // Append gateway_id to returnUrl so it's available on callback
            const urlObj = new URL(returnUrl);
            urlObj.searchParams.append('gateway_id', gateway.id.toString()); // Convert to string for URL param
            const finalReturnUrl = urlObj.toString();

            const payload = {
                gateway_id: gateway.id,
                return_url: finalReturnUrl,
            };

            const response = await axios.post('/tenancy/payment-methods/initiate', payload);

            const result = response.data;

            if (!result.success) {
                throw new Error(result.error);
            }

            // Handle based on registration method
            if (result.method === 'redirect' && result.url) {
                // Redirect to external gateway
                let redirectUrl = result.url;
                
                // Append token if present and not already in URL (common for Flow)
                if (result.token && !redirectUrl.includes('token=')) {
                    const separator = redirectUrl.includes('?') ? '&' : '?';
                    redirectUrl = `${redirectUrl}${separator}token=${result.token}`;
                }
                
                window.location.href = redirectUrl;
            } else {
                // Pass SDK or form data to parent
                onRegistrationInitiated?.(gateway, result);
            }

        } catch (err: any) {
            notify(err.response?.data?.error || err.message || 'Failed to initiate registration', { type: 'error' });
        } finally {
            setInitiating(null);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{(error as Error).message}</Alert>;
    }

    if (!gateways || gateways.length === 0) {
        return (
            <Alert severity="info">
                {translate('billing.noGatewaysAvailable', { _: 'No payment methods available' })}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {translate('billing.selectPaymentMethod', { _: 'Select a Payment Method' })}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {translate('billing.selectPaymentMethodDesc', { _: 'Choose how you want to pay for your subscription' })}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {gateways.map((gateway) => {
                    const isProcessing = initiating === gateway.id;

                    return (
                        <Card
                            key={gateway.id}
                            sx={{
                                flex: '1 1 280px',
                                maxWidth: 350,
                                cursor: isProcessing ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4,
                                },
                            }}
                            onClick={() => !isProcessing && handleSelectGateway(gateway)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    {gateway.icon_url ? (
                                        <Box
                                            component="img"
                                            src={gateway.icon_url}
                                            alt={gateway.name}
                                            sx={{ width: 40, height: 40, objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <CardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{
                                            fontWeight: "bold"
                                        }}>
                                            {gateway.display_name}
                                        </Typography>
                                        {gateway.region && (
                                            <Typography variant="caption" color="textSecondary">
                                                {gateway.region}
                                            </Typography>
                                        )}
                                    </Box>
                                    {gateway.is_simulation && (
                                        <Chip
                                            icon={<TestIcon />}
                                            label="Test"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                {gateway.supported_currencies.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="textSecondary">
                                            {translate('billing.supportedCurrencies', { _: 'Currencies' })}:{' '}
                                            {gateway.supported_currencies.join(', ')}
                                        </Typography>
                                    </Box>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={isProcessing}
                                    endIcon={isProcessing ? <CircularProgress size={16} /> : <ArrowIcon />}
                                >
                                    {isProcessing
                                        ? translate('billing.connecting', { _: 'Connecting...' })
                                        : translate('billing.addCard', { _: 'Add Card' })}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
};

export default GatewaySelector;
