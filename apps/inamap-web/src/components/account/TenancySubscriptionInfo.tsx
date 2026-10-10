import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    LinearProgress,
    Stack,
    Divider,
    Alert,
    Button,
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Timer as TimerIcon,
    CreditCard as CreditCardIcon,
    StarOutlined as PlanIcon,
} from '@mui/icons-material';
import { useRecordContext, useTranslate } from 'react-admin';
import { Link } from 'react-router-dom';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

/**
 * TenancySubscriptionInfo
 * 
 * Displays subscription and trial information from the current_subscription
 * relationship that is now eager-loaded by the TenancyController.
 * 
 * The trial information is calculated on the backend from the subscription,
 * not stored directly on the tenancy model.
 */
const TenancySubscriptionInfo: React.FC<IDashAutoAdminCustomFieldComponent> = ({
    resourceConfig,
    attribute,
    method,
}) => {
    const record = useRecordContext();
    const translate = useTranslate();
    
    if (!record) {
        return null;
    }

    const subscription = record.current_subscription;
    const isOnTrial = record.is_on_trial;
    const trialDaysRemaining = record.trial_days_remaining || 0;
    const trialEndsAt = record.trial_ends_at;

    // Format date for display
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Get status color
    const getStatusColor = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('active')) return 'success';
        if (s.includes('trial')) return 'info';
        if (s.includes('past_due')) return 'warning';
        if (s.includes('suspend') || s.includes('suspended')) return 'error';
        if (s.includes('cancel')) return 'default';
        return 'default';
    };

    // Calculate trial progress percentage
    const calculateTrialProgress = () => {
        if (!isOnTrial || !subscription?.trial_ends_at || !record.created_at) {
            return 0;
        }
        
        const now = new Date();
        const end = new Date(subscription.trial_ends_at);
        const start = new Date(record.created_at);
        const totalMs = Math.max(1, end.getTime() - start.getTime());
        const remainingMs = Math.max(0, end.getTime() - now.getTime());
        
        return Math.max(0, Math.min(100, Math.round((remainingMs / totalMs) * 100)));
    };

    const trialProgress = calculateTrialProgress();
    const plan = subscription?.effective_plan || subscription?.subscription_plan;

    // No subscription state
    if (!subscription) {
        return (
            <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {translate('tenancy.subscription.no_subscription', { 
                            defaultValue: 'No active subscription found.' 
                        })}
                    </Alert>
                    <Button
                        component={Link}
                        to="/tenancy/subscription"
                        variant="contained"
                        startIcon={<PlanIcon />}
                    >
                        {translate('tenancy.subscription.view_plans', { 
                            defaultValue: 'View Available Plans' 
                        })}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {translate('tenancy.subscription.title', { 
                        defaultValue: 'Subscription & Plan' 
                    })}
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                {/* Current Plan */}
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="body2" gutterBottom sx={{
                            color: "text.secondary"
                        }}>
                            {translate('tenancy.subscription.current_plan', { 
                                defaultValue: 'Current Plan' 
                            })}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{
                            alignItems: "center"
                        }}>
                            <PlanIcon color="primary" />
                            <Typography variant="h6">
                                {plan?.name || 'Unknown Plan'}
                            </Typography>
                            <Chip 
                                label={subscription.subscription_state || subscription.status || 'Unknown'}
                                color={getStatusColor(subscription.subscription_state || subscription.status) as any}
                                size="small"
                            />
                        </Stack>
                        {plan?.price != null && (
                            <Typography variant="body2" sx={{
                                color: "text.secondary"
                            }}>
                                ${(plan.price / 100).toFixed(2)} / {plan.billing_cycle === 'monthly' ? 'month' : 'year'}
                            </Typography>
                        )}
                    </Box>

                    {/* Trial Information */}
                    {isOnTrial && trialEndsAt && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="body2" gutterBottom sx={{
                                    color: "text.secondary"
                                }}>
                                    {translate('tenancy.subscription.trial_status', { 
                                        defaultValue: 'Trial Status' 
                                    })}
                                </Typography>
                                
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        alignItems: "center",
                                        mb: 1
                                    }}>
                                    <TimerIcon color="info" />
                                    <Typography variant="body1">
                                        {trialDaysRemaining} {translate('tenancy.subscription.days_remaining', { 
                                            defaultValue: 'days remaining' 
                                        })}
                                    </Typography>
                                </Stack>
                                
                                <LinearProgress 
                                    variant="determinate" 
                                    value={trialProgress} 
                                    color="info"
                                    sx={{ height: 8, borderRadius: 1, mb: 1 }}
                                />
                                
                                <Stack direction="row" spacing={1} sx={{
                                    alignItems: "center"
                                }}>
                                    <CalendarIcon fontSize="small" color="action" />
                                    <Typography variant="body2" sx={{
                                        color: "text.secondary"
                                    }}>
                                        {translate('tenancy.subscription.trial_ends', { 
                                            defaultValue: 'Trial ends:' 
                                        })} {formatDate(trialEndsAt)}
                                    </Typography>
                                </Stack>
                            </Box>
                        </>
                    )}

                    {/* Billing Period */}
                    {subscription.current_period_end && !isOnTrial && (
                        <>
                            <Divider />
                            <Box>
                                <Typography variant="body2" gutterBottom sx={{
                                    color: "text.secondary"
                                }}>
                                    {translate('tenancy.subscription.billing_period', { 
                                        defaultValue: 'Billing Period' 
                                    })}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{
                                    alignItems: "center"
                                }}>
                                    <CalendarIcon color="action" />
                                    <Typography variant="body2">
                                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                                    </Typography>
                                </Stack>
                            </Box>
                        </>
                    )}

                    {/* Pending Plan Change */}
                    {subscription.pending_plan && (
                        <>
                            <Divider />
                            <Alert severity="info">
                                <Typography variant="body2">
                                    {translate('tenancy.subscription.pending_change', { 
                                        defaultValue: 'Scheduled plan change to' 
                                    })} <strong>{subscription.pending_plan.name}</strong>
                                    {subscription.pending_plan_effective_at && (
                                        <> {translate('tenancy.subscription.on', { defaultValue: 'on' })} {formatDate(subscription.pending_plan_effective_at)}</>
                                    )}
                                </Typography>
                            </Alert>
                        </>
                    )}

                    {/* Manage Subscription Button */}
                    <Box sx={{ pt: 1 }}>
                        <Button
                            component={Link}
                            to="/tenancy/subscription"
                            variant="outlined"
                            startIcon={<CreditCardIcon />}
                            size="small"
                        >
                            {translate('tenancy.subscription.manage', { 
                                defaultValue: 'Manage Subscription' 
                            })}
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default TenancySubscriptionInfo;
