import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Grid,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { useTranslate } from '../hooks/usePolyglotTranslation';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    prices?: Record<string, number>;
    billing_cycle: 'monthly' | 'yearly';
    billing_cycle_label: string;
    trial_days: number;
    features: string[];
    limits?: Record<string, any>;
    is_popular?: boolean;
    formatted_price?: string;
}

interface PublicSubscriptionPlansDisplayProps {
    plans?: SubscriptionPlan[];
    loading?: boolean;
    error?: string | null;
    onPlanSelect?: (plan: SubscriptionPlan) => void;
    selectedPlanId?: number | null;
    currencyCode?: string;
    actionButtonText?: string;
    showTrialBadge?: boolean;
    showPopularBadge?: boolean;
}

// Importing centralized price formatter
import { priceFormatter } from 'dash-utils';

// Use the centralized priceFormatter as formatPrice for backward compatibility in this file
const formatPrice = (price: number, currencyCode: string = 'CLP'): string => {
    return priceFormatter(price, currencyCode);
};

/**
 * Reusable component for displaying subscription plans in public pages
 * Can be used in signup, pricing pages, etc.
 */
const PublicSubscriptionPlansDisplay: React.FC<PublicSubscriptionPlansDisplayProps> = ({
    plans = [],
    loading = false,
    error = null,
    onPlanSelect,
    selectedPlanId = null,
    currencyCode = 'CLP',
    actionButtonText = 'Select Plan',
    showTrialBadge = true,
    showPopularBadge = true,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const translate = useTranslate();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography
                    variant="body1"
                    sx={{
                        color: "text.secondary",
                        mt: 2
                    }}>
                    {translate('plans.loading')}
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 3 }}>
                {translate('plans.error')}
            </Alert>
        );
    }

    if (!plans || plans.length === 0) {
        return (
            <Alert severity="info" sx={{ mb: 3 }}>
                {translate('plans.noPlans')}
            </Alert>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Grid container spacing={3} sx={{
                justifyContent: "center"
            }}>
                {plans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    const displayPrice = plan.prices?.[currencyCode] 
                        ? formatPrice(plan.prices[currencyCode], currencyCode)
                        : formatPrice(plan.price, currencyCode);

                    return (
                        <Grid item xs={12} sm={6} md={4} key={plan.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: isSelected ? '2px solid' : '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    position: 'relative',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                {/* Popular Badge */}
                                {showPopularBadge && plan.is_popular && (
                                    <Chip
                                        icon={<StarIcon />}
                                        label={translate('plans.popular')}
                                        color="secondary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -12,
                                            right: 16,
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}

                                {/* Selected Badge */}
                                {isSelected && (
                                    <Chip
                                        icon={<CheckIcon />}
                                        label={translate('plans.selected')}
                                        color="primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -12,
                                            left: 16,
                                        }}
                                    />
                                )}

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                    {/* Plan Name */}
                                    <Typography
                                        variant="h5"
                                        gutterBottom
                                        sx={{
                                            fontWeight: "bold",
                                            textAlign: "center"
                                        }}>
                                        {translate(`plans.planNames.${plan.slug}`) || plan.name}
                                    </Typography>

                                    {/* Price */}
                                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                                        <Typography
                                            variant="h3"
                                            component="span"
                                            sx={{
                                                fontWeight: "bold",
                                                color: "primary.main"
                                            }}>
                                            {displayPrice}
                                        </Typography>
                                        <Typography variant="body1" component="span" sx={{
                                            color: "text.secondary"
                                        }}>
                                            {translate(`plans.billingCycle.${plan.billing_cycle}_short`)}
                                        </Typography>
                                    </Box>

                                    {/* Description */}
                                    {(plan.description || translate(`plans.planDescriptions.${plan.slug}`)) && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mb: 3,
                                                textAlign: 'center',
                                                minHeight: 40
                                            }}>
                                            {translate(`plans.planDescriptions.${plan.slug}`) || plan.description}
                                        </Typography>
                                    )}

                                    {/* Trial Badge */}
                                    {showTrialBadge && plan.trial_days > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                            <Chip
                                                label={translate('plans.trialDays', { days: plan.trial_days })}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </Box>
                                    )}

                                    {/* Features List */}
                                    {plan.features && plan.features.length > 0 && (
                                        <Box sx={{ mb: 3, flexGrow: 1 }}>
                                            {plan.features.map((feature, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 1,
                                                        mb: 1.5,
                                                    }}
                                                >
                                                    <CheckIcon 
                                                        fontSize="small" 
                                                        color="success" 
                                                        sx={{ mt: 0.5, flexShrink: 0 }}
                                                    />
                                                    <Typography variant="body2" sx={{
                                                        color: "text.primary"
                                                    }}>
                                                        {translate(`plans.features.${feature}`) || feature}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    {/* Action Button */}
                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Button
                                            fullWidth
                                            variant={isSelected ? 'outlined' : 'contained'}
                                            color="primary"
                                            size="large"
                                            onClick={() => onPlanSelect?.(plan)}
                                            sx={{
                                                py: 1.5,
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {isSelected ? translate('plans.selected') : actionButtonText}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

export default PublicSubscriptionPlansDisplay;
