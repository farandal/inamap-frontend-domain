import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { useDataProvider, useNotify, useRefresh } from 'react-admin';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    trial_days: number;
    is_active: boolean;
    features?: string[];
    limits?: Record<string, any>;
    tier?: number;
    allow_downgrade?: boolean;
}

interface SubscriptionPlansSelectorProps {
    currentPlanId?: number;
    subscriptionId?: string | number;
    onPlanSelect?: (plan: SubscriptionPlan) => void;
    onSuccess?: () => void | Promise<void>;
}

const formatPrice = (price: number): string => {
    return `$${(price / 100).toFixed(2)}`;
};

const SubscriptionPlansSelector: React.FC<SubscriptionPlansSelectorProps> = ({
    currentPlanId,
    subscriptionId,
    onPlanSelect,
    onSuccess,
}) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                const { data } = await dataProvider.getList('system/subscription-plan', {
                    pagination: { page: 1, perPage: 20 },
                    sort: { field: 'price', order: 'ASC' },
                    filter: { is_active: true },
                });
                setPlans(data as SubscriptionPlan[]);
            } catch (err: any) {
                setError(err.message || 'Failed to load subscription plans');
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [dataProvider]);

    const handleSelectPlan = async (plan: SubscriptionPlan) => {
        if (!subscriptionId) {
            onPlanSelect?.(plan);
            return;
        }

        // Determine action type for UI messaging using tier (higher tier = better plan)
        const currentPlan = plans.find((p) => p.id === currentPlanId);
        const currentTier = currentPlan?.tier || 1;
        const newTier = plan.tier || 1;
        const isUpgrade = newTier > currentTier;
        const isDowngrade = newTier < currentTier;
        
        const actionLabel = isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change';
        const action = isUpgrade ? 'upgrade' : 'downgrade'; // Keep for some var names if needed, but mostly actionable is actionLabel

        if (!window.confirm(`Are you sure you want to ${actionLabel} to ${plan.name}?`)) {
            return;
        }

        try {
            setUpgrading(plan.id);
            // Use unified change-plan endpoint
            await dataProvider.create(`tenancy/subscriptions/${subscriptionId}/change-plan`, {
                data: { subscription_plan_id: plan.id },
            });
            notify(`Successfully changed to ${plan.name}`, { type: 'success' });
            refresh();
            // Refetch parent data to update currentPlanId
            if (onSuccess) {
                await onSuccess();
            }
        } catch (err: any) {
            notify(err.message || `Failed to change plan`, { type: 'error' });
        } finally {
            setUpgrading(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                Available Plans
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Choose a plan that fits your needs. You can upgrade or downgrade at any time.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const isProcessing = upgrading === plan.id;

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
                                        label="Current Plan"
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
                                            {formatPrice(plan.price)}
                                        </Typography>
                                        <Typography variant="body2" component="span" color="textSecondary">
                                            /{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                                        </Typography>
                                    </Box>

                                    {plan.description && (
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                            {plan.description}
                                        </Typography>
                                    )}

                                    {plan.trial_days > 0 && (
                                        <Chip
                                            label={`${plan.trial_days} day trial`}
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
                                                    <Typography variant="body2">{feature}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Button
                                            fullWidth
                                            variant={isCurrent ? 'outlined' : 'contained'}
                                            disabled={isCurrent || isProcessing}
                                            onClick={() => handleSelectPlan(plan)}
                                        >
                                            {isProcessing ? (
                                                <CircularProgress size={24} />
                                            ) : isCurrent ? (
                                                'Current Plan'
                                            ) : (
                                                'Select Plan'
                                            )}
                                        </Button>
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
