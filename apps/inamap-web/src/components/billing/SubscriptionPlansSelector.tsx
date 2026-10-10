import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { useDataProvider, useNotify, useRefresh, useTranslate } from 'react-admin';
import { useQueryClient } from '@tanstack/react-query';
import { useAxios } from 'dash-axios-hook';
import { useSubscriptionPlans, useCurrencies, SubscriptionPlan } from '../../hooks/useSystemConfig';
import { useDialog } from 'dash-dialog';
import { usePaymentGatewayCapabilities } from '../../hooks/usePaymentGatewayCapabilities';

interface SubscriptionPlansSelectorProps {
    currentPlanId?: number;
    subscriptionId?: string | number;
    onPlanSelect?: (plan: SubscriptionPlan) => void;
    hasPaymentMethod?: boolean;
    onSuccess?: () => void | Promise<void>;
}

// Importing centralized price formatter
import { priceFormatter } from 'dash-utils';

// Use the centralized priceFormatter as formatPrice for backward compatibility in this file
const formatPrice = (price: number | null | undefined, currencyCode: string = 'CLP'): string => {
    // Handle null, undefined, or 0 prices
    if (price === null || price === undefined || price === 0) {
        return priceFormatter(0, currencyCode);
    }
    return priceFormatter(price, currencyCode);
};

const SubscriptionPlansSelector: React.FC<SubscriptionPlansSelectorProps> = ({
    currentPlanId,
    subscriptionId,
    onPlanSelect,
    hasPaymentMethod = true, // Default to true for backwards compatibility
    onSuccess,
}) => {
    const dataProvider = useDataProvider();
    const axios = useAxios();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();
    const queryClient = useQueryClient();
    
    // Use the same hook as public pages for consistent data fetching
    const { data: plans, isLoading: loading, error: fetchError } = useSubscriptionPlans();
    const { data: currencies } = useCurrencies();
    
    // Fetch payment gateway capabilities to filter plans
    const { 
        supportedBillingCycles, 
        isLoading: capabilitiesLoading,
        gateway,
        gatewayName 
    } = usePaymentGatewayCapabilities();
    
    const [upgrading, setUpgrading] = useState<number | null>(null);
    const dialog = useDialog();
    
    // Get default currency
    const defaultCurrency = currencies?.[0]?.code || 'CLP';
    
    // Filter plans by supported billing cycles
    const filteredPlans = React.useMemo(() => {
        if (!plans) return [];
        
        return plans.filter(plan => {
            // Show all active plans
            if (plan.is_active === false) return false;
            
            // If capabilities are loading or not available, show all plans
            if (capabilitiesLoading || !supportedBillingCycles) return true;
            
            // Filter by supported billing cycle
            return supportedBillingCycles.includes(plan.billing_cycle);
        });
    }, [plans, supportedBillingCycles, capabilitiesLoading]);


    const handleSelectPlan = (plan: SubscriptionPlan) => {
        // If no subscription ID exists, check if we have a callback for new subscriptions
        if (!subscriptionId) {
            // If there's a callback, use it (for registration flows)
            if (onPlanSelect) {
                onPlanSelect(plan);
                return;
            }
            
            // Otherwise, create a new subscription via API
            dialog({
                variant: 'info',
                title: translate('subscription.confirm_subscribe_title', {
                    _: 'Subscribe to Plan',
                }),
                content: translate('subscription.confirm_subscribe', {
                    plan: plan.name,
                    _: `Are you sure you want to subscribe to ${plan.name}?`,
                }),
                showCancelButton: true,
                onConfirm: async () => {
                    try {
                        setUpgrading(plan.id);
                        
                        // Create new subscription
                        const response = await axios.post(
                            'tenancy/subscriptions/create',
                            { subscription_plan_id: plan.id }
                        );
                        
                        if (response.data?.success) {
                            notify(
                                translate('subscription.subscribe_success', {
                                    plan: plan.name,
                                    _: `Successfully subscribed to ${plan.name}`,
                                }),
                                { type: 'success' }
                            );
                            
                            // Invalidate all subscription-related queries to force refetch
                            queryClient.invalidateQueries({ queryKey: ['tenancy/subscriptions'] });
                            queryClient.invalidateQueries({ queryKey: ['getList'] });
                            queryClient.invalidateQueries({ queryKey: ['getOne'] });
                            
                            // Refresh react-admin's internal cache
                            //refresh();
                            
                            // Explicitly refetch parent data to update UI
                            if (onSuccess) {
                                await onSuccess();
                            }
                        } else {
                            throw new Error(response.data?.message || 'Subscription creation failed');
                        }
                    } catch (err: any) {
                        const errorMessage = err?.response?.data?.message || err.message || translate('subscription.subscribe_error', { _: 'Failed to create subscription' });
                        notify(errorMessage, { type: 'error' });
                    } finally {
                        setUpgrading(null);
                    }
                },
            });
            return;
        }

        // Determine action type for UI messaging using tier (higher tier = better plan)
        const currentPlan = plans.find((p) => p.id === currentPlanId);
        const currentTier = currentPlan?.tier || 1;
        const newTier = plan.tier || 1;
        const isUpgrade = newTier > currentTier;
        const isDowngrade = newTier < currentTier;
        
        // Check if downgrade is allowed
        if (isDowngrade && plan.allow_downgrade === false) {
            notify(
                translate('subscription.downgrade_not_allowed', {
                    plan: plan.name,
                    _: `Downgrade to ${plan.name} is not allowed`,
                }),
                { type: 'warning' }
            );
            return;
        }
        
        // Action label for UI display only (backend handles the actual logic)
        const actionLabel = isUpgrade 
            ? translate('subscription.upgrade', { _: 'upgrade' }) 
            : isDowngrade 
                ? translate('subscription.downgrade', { _: 'downgrade' })
                : translate('subscription.change', { _: 'change' });
        const action = isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change';

        dialog({
            variant: isUpgrade ? 'info' : isDowngrade ? 'danger' : 'info',
            title: translate(`subscription.confirm_${action}_title`, {
                _: `Confirm ${actionLabel}`,
            }),
            content: translate(`subscription.confirm_${action}`, {
                plan: plan.name,
                _: `Are you sure you want to ${actionLabel} to ${plan.name}?`,
            }),
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    setUpgrading(plan.id);
                    
                    // Use axios directly to avoid React-Admin's response format validation
                    // Backend returns: { success: true, pending?: true, message?: string, data: {...} }
                    const response = await axios.post(
                        `tenancy/subscriptions/${subscriptionId}/change-plan`,
                        { subscription_plan_id: plan.id }
                    );
                    
                    // Check if plan change was successful
                    if (response.data?.success) {
                        // If backend returns pending: true, show pending notification
                        if (response.data?.pending) {
                            // Show dialog explaining the pending status
                            dialog({
                                variant: 'info',
                                title: translate('subscription.pending_change_title', {
                                    _: 'Plan Change Pending',
                                }),
                                content: translate('subscription.pending_change_message', {
                                    plan: plan.name,
                                    _: `Your plan change to ${plan.name} is pending payment confirmation. You will receive an email once the payment is processed.`,
                                }),
                            });
                        } else {
                            // Immediate plan change (no payment needed)
                            notify(
                                translate(`subscription.${action}_success`, {
                                    plan: plan.name,
                                    _: `Successfully changed to ${plan.name}`,
                                }),
                                { type: 'success' }
                            );
                        }
                        
                        // Invalidate all subscription-related queries to force refetch
                        queryClient.invalidateQueries({ queryKey: ['tenancy/subscriptions'] });
                        queryClient.invalidateQueries({ queryKey: ['getList'] });
                        queryClient.invalidateQueries({ queryKey: ['getOne'] });
                        
                        // Refresh react-admin's internal cache
                        //refresh();
                        
                        // Explicitly refetch parent data to update currentPlanId
                        if (onSuccess) {
                            await onSuccess();
                        }
                    } else {
                        throw new Error(response.data?.message || 'Plan change failed');
                    }
                } catch (err: any) {
                    const errorMessage = err?.response?.data?.message || err.message || translate(`subscription.${action}_error`, { _: `Failed to change plan` });
                    notify(errorMessage, { type: 'error' });
                } finally {
                    setUpgrading(null);
                }
            },
        });
    };

    if (loading || capabilitiesLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (fetchError) {
        return <Alert severity="error">{translate('subscription.fetch_error', {message: fetchError.message, _: fetchError.message})}</Alert>;
    }
    
    // Show warning if no plans match the gateway's supported billing cycles
    const hasCompatiblePlans = filteredPlans.length > 0;
    const unsupportedPlans = plans?.filter(p => p.is_active !== false && !filteredPlans.includes(p)) || [];

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                {translate('subscription.available_plans.title')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {translate('subscription.available_plans.subtitle')}
            </Typography>

            {/*gateway && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Método de pago actual: <strong>{gatewayName || gateway}</strong>
                    {' - Ciclos soportados: '}
                    <strong>{supportedBillingCycles.join(', ')}</strong>
                </Alert>
            )*/}

            {unsupportedPlans.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {translate('subscription.unsupported_plans', {count: unsupportedPlans.length, gateway: gatewayName || gateway, _: `${unsupportedPlans.length} plan(s) not available with your current payment method. To access all plans, consider changing your payment method.`})}
                </Alert>
            )}

            {!hasCompatiblePlans && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {translate('subscription.no_compatible_plans', {gateway: gatewayName || gateway, _: `No compatible plans available with your current payment method (${gatewayName || gateway}). Please contact your system administrator.`})}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {filteredPlans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const isProcessing = upgrading === plan.id;
                    
                    // Check if this would be a downgrade
                    const currentPlan = plans.find((p) => p.id === currentPlanId);
                    const currentTier = currentPlan?.tier || 1;
                    const newTier = plan.tier || 1;
                    const wouldBeDowngrade = subscriptionId && newTier < currentTier;
                    const isDowngradeBlocked = wouldBeDowngrade && plan.allow_downgrade === false;
                    
                    const isDisabled = isCurrent || isProcessing || !hasPaymentMethod || isDowngradeBlocked;

                    return (
                        <Box key={plan.id} sx={{ flex: '1 1 300px', maxWidth: 400, minWidth: 280 }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: isCurrent ? '2px solid' : '1px solid',
                                    borderColor: isCurrent ? 'primary.main' : 'divider',
                                    position: 'relative',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-2px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                {isCurrent && (
                                    <Chip
                                        icon={<StarIcon />}
                                        label={translate('subscription.current_plan')}
                                        color="primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -10,
                                            right: 16,
                                        }}
                                    />
                                )}

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" gutterBottom>
                                        {plan.name}
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h4" component="span" sx={{
                                            fontWeight: "bold"
                                        }}>
                                            {plan.prices?.[defaultCurrency] 
                                                ? formatPrice(plan.prices[defaultCurrency], defaultCurrency)
                                                : formatPrice(plan.price, defaultCurrency)}
                                        </Typography>
                                        <Typography variant="body2" component="span" color="textSecondary">
                                            /{translate(`plans.billingCycle.${plan.billing_cycle}_short`, { _: `per ${plan.billing_cycle}` })}
                                        </Typography>
                                    </Box>

                                    {plan.description && (
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                            {plan.description}
                                        </Typography>
                                    )}

                                    {plan.trial_days > 0 && (
                                        <Chip
                                            label={translate('subscription.trial_days', { days: plan.trial_days })}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                            sx={{ mb: 2, alignSelf: 'flex-start' }}
                                        />
                                    )}

                                    {/* Features list placeholder */}
                                    {plan.features && plan.features.length > 0 && (
                                        <Box sx={{ mb: 2, flexGrow: 1 }}>
                                            {plan.features.map((feature, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    <CheckIcon fontSize="small" color="success" />
                                                    <Typography variant="body2">
                                                        {translate(`subscription.features.${feature}`, { _: feature })}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Tooltip 
                                            title={
                                                !hasPaymentMethod 
                                                    ? translate('subscription.addPaymentMethodFirst', { _: 'Add a payment method first' })
                                                    : isDowngradeBlocked
                                                    ? translate('subscription.downgrade_not_allowed', { plan: plan.name, _: `Downgrade to ${plan.name} is not allowed` })
                                                    : ''
                                            }
                                            arrow
                                        >
                                            <span>
                                                <Button
                                                    fullWidth
                                                    variant={isCurrent ? 'outlined' : 'contained'}
                                                    disabled={isDisabled}
                                                    onClick={() => handleSelectPlan(plan)}
                                                >
                                                    {isProcessing ? (
                                                        <CircularProgress size={24} />
                                                    ) : isCurrent ? (
                                                        translate('subscription.current_plan')
                                                    ) : !hasPaymentMethod ? (
                                                        translate('subscription.no_payment_method', { _: 'Add Payment Method' })
                                                    ) : (
                                                        translate('subscription.select_plan')
                                                    )}
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default SubscriptionPlansSelector;
