import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, alpha, Button, Divider } from '@mui/material';
import { useDataProvider, useGetIdentity, useTranslate, Link, useNotify } from 'react-admin';
import { useQueryClient } from '@tanstack/react-query';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import CurrentSubscription from './CurrentSubscription';
import SubscriptionPlansSelector from './SubscriptionPlansSelector';
import { Warning as WarningIcon, ArrowForward as ArrowIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useTenancySubscriptionState } from '../tenancy/TenancySubscriptionContext';
import { useDialog } from 'dash-dialog';
import { useAxios } from 'dash-axios-hook';

interface TenancySubscription {
    id: string | number;
    tenancy_id: string;
    subscription_plan_id: number;
    status: string;
    subscription_plan?: {
        id: number;
        name: string;
        price: number;
        billing_cycle: string;
    };
    current_period_start?: string;
    current_period_end?: string;
    trial_ends_at?: string;
}

interface PaymentMethod {
    id: number;
    type: string;
    last_four: string;
    brand: string;
    is_default: boolean;
}

interface TenancySubscriptionListProps {
    resourceConfig: IDashAutoAdminResourceConfig;
}

/**
 * Custom list component for subscription management.
 * Displays:
 * - Payment method prompt (if trial and no payment method)
 * - Current subscription at the top
 * - Available plans for upgrade/downgrade below
 */
const TenancySubscriptionList: React.FC<TenancySubscriptionListProps> = ({ resourceConfig }) => {
    const dataProvider = useDataProvider();
    const { identity } = useGetIdentity();
    const translate = useTranslate();
    const queryClient = useQueryClient();
    const notify = useNotify();
    const dialog = useDialog();
    const axios = useAxios();
    const [subscription, setSubscription] = useState<TenancySubscription | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unsubscribing, setUnsubscribing] = useState(false);
    
    // Get plan change events from WebSocket context
    const { lastPlanChangeEvent } = useTenancySubscriptionState();

    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            
            // Generate unique timestamp to force cache bypass
            const cacheBuster = Date.now();
            
            // Invalidate React Query cache before fetching
            queryClient.invalidateQueries({ queryKey: ['tenancy/subscriptions'] });
            
            // Fetch subscription and payment methods in parallel
            // Include relationships and force fresh data
            const [subResult, pmResult] = await Promise.all([
                dataProvider.getList('tenancy/subscriptions', {
                    pagination: { page: 1, perPage: 1 },
                    sort: { field: 'created_at', order: 'DESC' },
                    filter: { 
                        // Include 'cancelled' so a freshly-cancelled subscription
                        // is still shown in the UI with a CANCELLED badge.
                        status: ['active', 'trial', 'cancelled'],
                        _cacheBuster: cacheBuster,
                    },
                    meta: { 
                        forceRefresh: true,
                        include: 'subscriptionPlan,effectivePlan,pendingPlan',
                    },
                }),
                dataProvider.getList('tenancy/payment-methods', {
                    pagination: { page: 1, perPage: 10 },
                    sort: { field: 'created_at', order: 'DESC' },
                    filter: { _cacheBuster: cacheBuster },
                }),
            ]);

            if (subResult.data && subResult.data.length > 0) {
                setSubscription(subResult.data[0] as TenancySubscription);
            } else {
                setSubscription(null);
            }
            
            setPaymentMethods(pmResult.data as PaymentMethod[]);
            
        } catch (err: any) {
            setError(err.message || 'Failed to load subscription');
        } finally {
            setLoading(false);
        }
    }, [dataProvider, queryClient]);

    // Initial data fetch on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Re-fetch data when a plan change event is received via WebSocket
    useEffect(() => {
        if (lastPlanChangeEvent) {
            console.log('[TenancySubscriptionList] Plan change event received, refreshing data...', lastPlanChangeEvent);
            fetchData(false); // Don't show loading spinner for background refresh
        }
    }, [lastPlanChangeEvent, fetchData]);

    /**
     * Handle unsubscribe action
     * Shows confirmation dialog with preview info, then cancels subscription
     */
    const handleUnsubscribe = async () => {
        if (!subscription?.id) return;

        try {
            // First, get preview info
            const previewResponse = await axios.get(`tenancy/subscriptions/${subscription.id}/unsubscribe-preview`);
            const preview = previewResponse.data;

            dialog({
                variant: 'danger',
                title: translate('subscription.unsubscribe.confirm_title', { _: 'Cancel Subscription' }),
                content: (
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {translate('subscription.unsubscribe.confirm_message', { 
                                _: 'Are you sure you want to cancel your subscription?' 
                            })}
                        </Typography>
                        
                        <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                <strong>{translate('subscription.unsubscribe.access_until', { _: 'Access until:' })}</strong>{' '}
                                {preview.billing_cycle_end ? new Date(preview.billing_cycle_end).toLocaleString() : '-'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                <strong>{translate('subscription.unsubscribe.time_remaining', { _: 'Time remaining:' })}</strong>{' '}
                                {preview.time_remaining_display || (preview.days_remaining !== undefined 
                                    ? (preview.days_remaining >= 1 
                                        ? `${Math.ceil(preview.days_remaining)} ${translate('common.days', { _: 'days' })}`
                                        : `${preview.hours_remaining || 0} ${translate('common.hours', { _: 'hours' })}`)
                                    : '-')}
                            </Typography>
                        </Paper>

                        <Typography variant="body2" color="textSecondary">
                            {translate('subscription.unsubscribe.what_happens_title', { _: 'What happens when you unsubscribe:' })}
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                            {preview.what_happens?.access_until && (
                                <li><Typography variant="body2">{preview.what_happens.access_until}</Typography></li>
                            )}
                            {preview.what_happens?.no_new_charges && (
                                <li><Typography variant="body2">{preview.what_happens.no_new_charges}</Typography></li>
                            )}
                            {preview.what_happens?.can_resubscribe && (
                                <li><Typography variant="body2">{preview.what_happens.can_resubscribe}</Typography></li>
                            )}
                            {preview.what_happens?.data_retention && (
                                <li><Typography variant="body2">{preview.what_happens.data_retention}</Typography></li>
                            )}
                        </Box>
                    </Box>
                ),
                confirmText: translate('subscription.unsubscribe.confirm_button', { _: 'Cancel Subscription' }),
                showCancelButton: true,
                cancelText: translate('common.keep', { _: 'Keep Subscription' }),
                onConfirm: async () => {
                    try {
                        setUnsubscribing(true);
                        const response = await axios.post(`tenancy/subscriptions/${subscription.id}/unsubscribe`);
                        
                        if (response.data?.success) {
                            notify(
                                translate('subscription.unsubscribe.success', { 
                                    date: response.data.effective_date,
                                    _: `Subscription cancelled. Access until ${response.data.effective_date}.`
                                }),
                                { type: 'success' }
                            );
                            
                            // Refresh data
                            queryClient.invalidateQueries({ queryKey: ['tenancy/subscriptions'] });
                            fetchData(true);
                        } else {
                            throw new Error(response.data?.message || 'Unsubscribe failed');
                        }
                    } catch (err: any) {
                        const errorMessage = err?.response?.data?.message || err.message || 
                            translate('subscription.unsubscribe.error', { _: 'Failed to cancel subscription' });
                        notify(errorMessage, { type: 'error' });
                    } finally {
                        setUnsubscribing(false);
                    }
                },
            });
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err.message || 
                translate('subscription.unsubscribe.preview_error', { _: 'Failed to load cancellation details' });
            notify(errorMessage, { type: 'error' });
        }
    };

    // True only when subscription is fully cancelled (status field confirmed it)
    const isCancelled = subscription?.status === 'cancelled' ||
        (subscription as any)?.subscription_state === 'canceled';

    // True when cancellation is *scheduled* but has not yet completed
    // (cancelled_at/cancels_at is set, but status is still active/trial)
    const isCancellationScheduled = !isCancelled && subscription && (
        (subscription as any).cancels_at || (subscription as any).cancelled_at
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Check if trial user needs to add payment method
    const isTrialWithoutPayment = subscription?.status === 'trial' && paymentMethods.length === 0;

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{
                fontWeight: "bold"
            }}>
                {translate('subscription.management.title')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                {translate('subscription.management.subtitle')}
            </Typography>

            {/* Payment Method Warning for Trial Users */}
            {isTrialWithoutPayment && (
                <Paper
                    sx={{
                        p: 3,
                        mb: 4,
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                        border: '1px solid',
                        borderColor: 'warning.main',
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                                {translate('billing.paymentMethodRequired', { _: 'Payment Method Required' })}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {translate('billing.addPaymentMethodToChangePlan', { 
                                    _: 'Add a payment method to select or change your subscription plan.' 
                                })}
                            </Typography>
                            <Button
                                component={Link}
                                to="/tenancy/payment-methods"
                                variant="contained"
                                color="warning"
                                endIcon={<ArrowIcon />}
                            >
                                {translate('billing.goToPaymentMethods', { _: 'Manage Payment Methods' })}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Current Subscription Section */}
            {subscription ? (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="h6">{translate('subscription.current.title')}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {translate('subscription.current.subtitle')}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 3, bgcolor: 'grey.900', borderRadius: 2, color: 'common.white' }}>
                            {(() => {
                                // Use effective_plan (new) or subscription_plan (legacy) for display
                                const displayPlan = (subscription as any).effective_plan || subscription.subscription_plan;
                                const effectivePlanId = (subscription as any).effective_plan_id || subscription.subscription_plan_id;
                                const subscriptionState = (subscription as any).subscription_state || subscription.status;
                                const pendingPlan = (subscription as any).pending_plan;
                                
                                return (
                                    <>
                                        {/* Plan Name and Price */}
                                        {/*
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                                                {displayPlan?.name || translate('subscription.active', { _: 'Subscription Active' })}
                                            </Typography>
                                            {displayPlan && (
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                    ${(displayPlan.price / 100).toFixed(2)} /{' '}
                                                    {translate(`plans.billingCycle.${displayPlan.billing_cycle}_short`, { _: displayPlan.billing_cycle })}
                                                </Typography>
                                            )}
                                        </Box>
                                        */}

                                        {/* Subscription State */}
                                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ opacity: 0.7 }}>{translate('subscription.status_label', { _: 'Status:' })}</Typography>
                                            {(() => {
                                                // Priority order:
                                                // 1. CANCELLED if status/state is cancelled
                                                // 2. CANCELLING if cancellation is scheduled but period hasn't ended yet
                                                // 3. Normal status
                                                const displayStatus = isCancelled
                                                    ? 'cancelled'
                                                    : isCancellationScheduled 
                                                    ? 'cancelling' 
                                                    : subscriptionState;
                                                const statusColor = isCancelled ? 'error.main' :
                                                    displayStatus === 'cancelling' ? 'warning.main' :
                                                    subscriptionState === 'active' ? 'success.main' : 
                                                    subscriptionState === 'trial' ? 'info.main' :
                                                    subscriptionState === 'past_due' ? 'warning.main' :
                                                    subscriptionState === 'suspended' ? 'error.main' :
                                                    'grey.700';
                                                return (
                                                    <Box sx={{ 
                                                        px: 1.5, 
                                                        py: 0.5, 
                                                        bgcolor: statusColor,
                                                        borderRadius: 1, 
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {displayStatus.toUpperCase()}
                                                    </Box>
                                                );
                                            })()}
                                        </Box>

                                        {/* Billing Cycle Info */}
                                        {displayPlan?.billing_cycle && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                    {translate('subscription.billing_cycle_label', { _: 'Billing Cycle:' })} <strong>
                                                        {translate(`plans.billingCycle.${displayPlan.billing_cycle}`, { _: displayPlan.billing_cycle })}
                                                    </strong>
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Current Period */}
                                        {subscription.current_period_start && subscription.current_period_end && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{translate('subscription.current_period_label', { _: 'Current Period:' })}</Typography>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: "medium"
                                                }}>
                                                    {new Date(subscription.current_period_start).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                    {' → '}
                                                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Trial End Date - Only show when actually in trial state */}
                                        {subscription.trial_ends_at && subscriptionState === 'trial' && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{translate('subscription.trial_ends_label', { _: 'Trial Ends:' })}</Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: "medium",
                                                        color: "warning.light"
                                                    }}>
                                                    {new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Renewal Info - Only show if NOT cancelled */}
                                        {subscription.current_period_end && subscriptionState === 'active' && !isCancellationScheduled && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{translate('subscription.next_billing_label', { _: 'Next Billing:' })}</Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: "medium",
                                                        color: "success.light"
                                                    }}>
                                                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Fully cancelled — subscription is done */}
                                        {isCancelled && (
                                            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', borderRadius: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        mb: 0.5
                                                    }}>
                                                    {translate('subscription.cancellation.completed', { _: 'Subscription Cancelled' })}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {translate('subscription.cancellation.cancelled_on', { _: 'Cancelled on:' })}{' '}
                                                    {new Date((subscription as any).cancelled_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Cancellation Info - Show if cancelled_at or cancels_at is set but not yet completed */}
                                        {isCancellationScheduled && (
                                            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', borderRadius: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        mb: 0.5
                                                    }}>
                                                    {translate('subscription.cancellation.scheduled', { _: 'Cancellation Scheduled' })}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {translate('subscription.cancellation.access_until', { _: 'Access until:' })}{' '}
                                                    {new Date(
                                                        (subscription as any).cancels_at || 
                                                        subscription.current_period_end ||
                                                        (subscription as any).cancelled_at
                                                    ).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </Typography>
                                                {(subscription as any).cancellation_reason && (
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                        {translate('subscription.cancellation.reason', { _: 'Reason:' })} {(subscription as any).cancellation_reason}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {/* Pending Plan Change */}
                                        {pendingPlan && (
                                            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.dark', borderRadius: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        mb: 0.5
                                                    }}>
                                                    {translate('subscription.pending_change', { _: 'Pending Change' })}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {translate('subscription.switching_to', { _: 'Switching to:' })} <strong>{pendingPlan.name}</strong>
                                                </Typography>
                                                {(subscription as any).pending_plan_effective_at && (
                                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                        {translate('subscription.effective_date', { _: 'Effective:' })} {new Date((subscription as any).pending_plan_effective_at).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric',
                                                        })}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {/* Unsubscribe Button - Only show if not already scheduled for cancellation */}
                                        {!isCancellationScheduled && subscriptionState === 'active' && (
                                            <>
                                                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={unsubscribing ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                                                        onClick={handleUnsubscribe}
                                                        disabled={unsubscribing}
                                                        sx={{ 
                                                            borderColor: 'rgba(244, 67, 54, 0.5)',
                                                            color: 'error.light',
                                                            '&:hover': {
                                                                borderColor: 'error.main',
                                                                bgcolor: 'rgba(244, 67, 54, 0.08)',
                                                            }
                                                        }}
                                                    >
                                                        {unsubscribing 
                                                            ? translate('subscription.unsubscribe.processing', { _: 'Cancelling...' })
                                                            : translate('subscription.unsubscribe.button', { _: 'Cancel Subscription' })
                                                        }
                                                    </Button>
                                                </Box>
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Alert severity="info" sx={{ mb: 4 }}>
                    {translate('subscription.no_active')}
                </Alert>
            )}

            {/* Available Plans Section - Always shown, but disabled if no payment method */}
            {/* Don't mark any plan as 'current' if subscription is cancelled */}
            <SubscriptionPlansSelector
                currentPlanId={isCancelled ? undefined : ((subscription as any)?.effective_plan_id || subscription?.subscription_plan_id)}
                subscriptionId={isCancelled ? undefined : subscription?.id}
                hasPaymentMethod={paymentMethods.length > 0}
                onSuccess={() => {
                    // Force full refresh with loading indicator after plan change
                    fetchData(true);
                }}
            />
        </Box>
    );
};

export default TenancySubscriptionList;
