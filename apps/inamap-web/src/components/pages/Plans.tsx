import React, { useState } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    ToggleButton,
    ToggleButtonGroup,
    Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PublicSubscriptionPlansDisplay from '../billing/PublicSubscriptionPlansDisplay';
import { useSubscriptionPlans, useCurrencies, SubscriptionPlan } from '../../hooks/useSystemConfig';
import { useTranslate } from '../hooks/usePolyglotTranslation';

/**
 * Plans Page - Displays available subscription plans
 * Uses cached React Query for optimized data fetching
 */
const Plans: React.FC = () => {
    const navigate = useNavigate();
    const translate = useTranslate();
    const { data: plans, isLoading, error } = useSubscriptionPlans();
    const { data: currencies } = useCurrencies();
    
    // Set default currency to the first available currency or CLP
    const defaultCurrency = currencies?.[0]?.code || 'CLP';
    const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);

    const handlePlanSelect = (plan: SubscriptionPlan) => {
        // Navigate to signup with selected plan
        navigate('/signup', { 
            state: { 
                selectedPlanId: plan.id,
                selectedPlanSlug: plan.slug 
            } 
        });
    };
    
    const handleCurrencyChange = (
        event: React.MouseEvent<HTMLElement>,
        newCurrency: string | null
    ) => {
        if (newCurrency !== null) {
            setSelectedCurrency(newCurrency);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 6 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h2" gutterBottom sx={{
                        fontWeight: "bold"
                    }}>
                        {translate('plans.title')}
                    </Typography>
                    <Typography variant="h6" sx={{
                        color: "text.secondary"
                    }}>
                        {translate('plans.subtitle')}
                    </Typography>
                </Box>

                {/* Currency Selector */}
                {currencies && currencies.length > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <ToggleButtonGroup
                            value={selectedCurrency}
                            exclusive
                            onChange={handleCurrencyChange}
                            aria-label="currency selector"
                            size="small"
                        >
                            {currencies.map((currency) => (
                                <ToggleButton 
                                    key={currency.code} 
                                    value={currency.code}
                                    aria-label={currency.code}
                                >
                                    {currency.code}
                                    {currency.symbol && ` (${currency.symbol})`}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                )}

                {/* Plans Display */}
                <PublicSubscriptionPlansDisplay
                    plans={plans}
                    loading={isLoading}
                    error={error?.message || null}
                    onPlanSelect={handlePlanSelect}
                    actionButtonText={translate('plans.getStarted')}
                    showTrialBadge={true}
                    showPopularBadge={true}
                    currencyCode={selectedCurrency}
                />

                {/* Additional Info */}
                {!isLoading && !error && plans.length > 0 && (
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Typography variant="body2" sx={{
                            color: "text.secondary"
                        }}>
                            {translate('plans.footer')}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default Plans;