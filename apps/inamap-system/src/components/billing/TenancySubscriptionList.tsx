import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useDataProvider, useGetIdentity } from 'react-admin';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
import CurrentSubscription from './CurrentSubscription';
import SubscriptionPlansSelector from './SubscriptionPlansSelector';

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

interface TenancySubscriptionListProps {
    resourceConfig: IDashAutoAdminResourceConfig;
}

/**
 * Custom list component for subscription management.
 * Displays:
 * - Current subscription at the top
 * - Available plans for upgrade/downgrade below
 */
const TenancySubscriptionList: React.FC<TenancySubscriptionListProps> = ({ resourceConfig }) => {
    const dataProvider = useDataProvider();
    const { identity } = useGetIdentity();
    const [subscription, setSubscription] = useState<TenancySubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            // Fetch the current tenancy's active subscription
            const { data } = await dataProvider.getList('tenancy/subscriptions', {
                pagination: { page: 1, perPage: 1 },
                sort: { field: 'created_at', order: 'DESC' },
                filter: { status: ['active', 'trial'] },
                meta: { forceRefresh: true },
            });

            if (data && data.length > 0) {
                setSubscription(data[0] as TenancySubscription);
            } else {
                setSubscription(null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load subscription');
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                }}
            >
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

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{
                fontWeight: "bold"
            }}>
                Subscription Management
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                Manage your subscription plan and billing settings.
            </Typography>

            {/* Current Subscription Section */}
            {subscription ? (
                <Box sx={{ mb: 4 }}>
                    {/* We render CurrentSubscription with the subscription as record context */}
                    <Box
                        sx={{
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="h6">Subscription</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Manage your subscription and add-ons.
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                p: 3,
                                bgcolor: 'grey.900',
                                borderRadius: 2,
                                color: 'common.white',
                            }}
                        >
                            {subscription.subscription_plan && (
                                <>
                                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                                        ${(subscription.subscription_plan.price / 100).toFixed(2)} /{' '}
                                        {subscription.subscription_plan.billing_cycle === 'monthly' ? 'month' : 'year'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h5" sx={{
                                            fontWeight: "bold"
                                        }}>
                                            {subscription.subscription_plan.name}
                                        </Typography>
                                        {subscription.current_period_end && (
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 0.5,
                                                    bgcolor: 'success.main',
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                }}
                                            >
                                                Renews{' '}
                                                {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Box>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Alert severity="info" sx={{ mb: 4 }}>
                    You don't have an active subscription. Choose a plan below to get started.
                </Alert>
            )}

            {/* Available Plans Section */}
            <SubscriptionPlansSelector
                currentPlanId={subscription?.subscription_plan_id}
                subscriptionId={subscription?.id}
                onSuccess={() => fetchSubscription(false)}
            />
        </Box>
    );
};

export default TenancySubscriptionList;
