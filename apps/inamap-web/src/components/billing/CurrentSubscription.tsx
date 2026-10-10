import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
} from '@mui/material';
import {
    KeyboardArrowDown as ArrowDownIcon,
    SwapHoriz as ChangePlanIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useRecordContext, useDataProvider, useNotify, useRefresh, useTranslate } from 'react-admin';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';
import { priceFormatter } from 'dash-utils';

interface SubscriptionRecord {
    id: string | number;
    status: 'trial' | 'active' | 'past_due' | 'cancelled';
    subscription_state?: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
    subscription_plan?: {
        id: number;
        name: string;
        price: number;
        billing_cycle: 'daily' | 'monthly' | 'yearly';
        formatted_price?: string;
    };
    effective_plan?: {
        id: number;
        name: string;
        price: number;
        billing_cycle: 'daily' | 'monthly' | 'yearly';
        formatted_price?: string;
    };
    current_period_end?: string;
    trial_ends_at?: string;
    cancelled_at?: string;
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
        case 'active':
            return 'success';
        case 'trial':
            return 'warning';
        case 'past_due':
            return 'error';
        case 'cancelled':
        default:
            return 'default';
    }
};

const SubscriptionCard: React.FC<{ method: string }> = ({ method }) => {
    const record = useRecordContext<SubscriptionRecord>();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [loading, setLoading] = useState(false);

    // Format date helper
    const formatDate = (dateString?: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format price with translated billing cycle
    const formatPrice = (price: number, cycle: string): string => {
        const formatted = priceFormatter(price, 'USD');
        const cycleKey = `plans.billingCycle.${cycle}_short`;
        const cycleName = translate(cycleKey, { _: `/${cycle}` });
        return `${formatted} ${cycleName}`;
    };

    if (!record) return null;

    // Use effective_plan if available (newer API), fallback to subscription_plan
    const plan = record.effective_plan || record.subscription_plan;
    // Use subscription_state if available, fallback to status
    const subscriptionState = record.subscription_state || record.status;
    const isInTrial = subscriptionState === 'trial';
    const isActive = subscriptionState === 'active' || isInTrial;
    // Only show trial_ends_at as renewal date if actually in trial state
    const renewalDate = isInTrial ? record.trial_ends_at : record.current_period_end;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCancelPlan = async () => {
        handleMenuClose();
        if (!window.confirm(translate('subscription.unsubscribe.confirm_message'))) {
            return;
        }
        
        try {
            setLoading(true);
            await dataProvider.create(`tenancy/subscriptions/${record.id}/cancel`, {
                data: {},
            });
            notify(translate('subscription.cancel_success'), { type: 'success' });
            refresh();
        } catch (error: any) {
            notify(error.message || translate('subscription.cancel_error'), { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            sx={{
                background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
                        theme.palette.background.default,
                        0.9
                    )} 100%)`,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" component="h2" gutterBottom>
                            {translate('subscription.current.title')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {translate('subscription.current.subtitle')}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        p: 3,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {plan && (
                        <>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                {formatPrice(plan.price, plan.billing_cycle)}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="h5" component="span" sx={{
                                    fontWeight: "bold"
                                }}>
                                    {plan.name}
                                </Typography>
                                {renewalDate && (
                                    <Chip
                                        label={`${translate('subscription.renews')} ${formatDate(renewalDate)}`}
                                        size="small"
                                        color="success"
                                        sx={{ fontWeight: 500 }}
                                    />
                                )}
                            </Box>

                            {isActive && (
                                <>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        endIcon={<ArrowDownIcon />}
                                        onClick={handleMenuOpen}
                                        disabled={loading}
                                        sx={{
                                            bgcolor: 'grey.800',
                                            '&:hover': { bgcolor: 'grey.700' },
                                        }}
                                    >
                                        {translate('subscription.manage')}
                                    </Button>

                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                                        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                                    >
                                        <MenuItem onClick={handleMenuClose}>
                                            <ListItemIcon>
                                                <ChangePlanIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>{translate('subscription.choose_plan')}</ListItemText>
                                        </MenuItem>
                                        <Divider />
                                        <MenuItem onClick={handleCancelPlan} sx={{ color: 'error.main' }}>
                                            <ListItemIcon>
                                                <CancelIcon fontSize="small" color="error" />
                                            </ListItemIcon>
                                            <ListItemText>{translate('subscription.cancel_plan')}</ListItemText>
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}

                            {!isActive && (
                                <Chip
                                    label={record.status.toUpperCase()}
                                    color={getStatusColor(record.status)}
                                    size="small"
                                />
                            )}
                        </>
                    )}

                    {!plan && (
                        <Typography color="textSecondary">
                            {translate('subscription.no_active')}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const CurrentSubscription: React.FC<IDashAutoAdminCustomFieldComponent> = ({
    method,
    attribute,
    resourceConfig,
}) => {
    switch (method) {
        case 'view':
        case 'edit':
            return <SubscriptionCard method={method} />;
        case 'list':
        case 'create':
        default:
            return null;
    }
};

export default CurrentSubscription;
