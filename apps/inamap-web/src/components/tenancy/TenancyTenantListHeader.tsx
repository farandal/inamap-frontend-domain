import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Alert,
    AlertTitle,
    Chip,
    Button,
} from '@mui/material';
import { useDataProvider, useNotify, useRefresh } from 'react-admin';
import BusinessIcon from '@mui/icons-material/Business';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { useNavigate } from 'react-router-dom';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';

interface TenantLimitsInfo {
    current_count: number;
    max_tenants: number | null;
    can_create: boolean;
    plan_name: string;
    is_trial: boolean;
    limits: Record<string, any>;
}

interface TenancyTenantListHeaderProps {
    resourceConfig?: IDashAutoAdminResourceConfig;
}

/**
 * Header component for the Tenancy Tenant list showing plan limits
 */
const TenancyTenantListHeader: React.FC<TenancyTenantListHeaderProps> = ({ resourceConfig }) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const navigate = useNavigate();
    const [limitsInfo, setLimitsInfo] = useState<TenantLimitsInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const response = await dataProvider.getCustom('tenancy/tenants/limits', {});
                setLimitsInfo(response.data?.data || response.data);
            } catch (error: any) {
                console.error('Failed to fetch tenant limits:', error);
                notify('Failed to load tenant limits', { type: 'warning' });
            } finally {
                setLoading(false);
            }
        };

        fetchLimits();
    }, [dataProvider, notify]);

    if (loading) {
        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress />
            </Box>
        );
    }

    if (!limitsInfo) {
        return null;
    }

    const usagePercentage = limitsInfo.max_tenants 
        ? (limitsInfo.current_count / limitsInfo.max_tenants) * 100 
        : 0;
    
    const isAtLimit = limitsInfo.max_tenants !== null && limitsInfo.current_count >= limitsInfo.max_tenants;
    const isNearLimit = limitsInfo.max_tenants !== null && usagePercentage >= 80;

    const handleUpgrade = () => {
        navigate('/tenancy/subscription');
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <BusinessIcon color="primary" fontSize="large" />
                            <Box>
                                <Typography variant="h6">
                                    Tenant Management
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{
                                        color: "text.secondary"
                                    }}>
                                        Current Plan: 
                                    </Typography>
                                    <Chip 
                                        label={limitsInfo.plan_name} 
                                        size="small" 
                                        color={limitsInfo.is_trial ? "warning" : "primary"}
                                    />
                                    {limitsInfo.is_trial && (
                                        <Chip 
                                            label="Trial" 
                                            size="small" 
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                        
                        {(isAtLimit || isNearLimit) && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<UpgradeIcon />}
                                onClick={handleUpgrade}
                            >
                                Upgrade Plan
                            </Button>
                        )}
                    </Box>

                    {limitsInfo.max_tenants !== null && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{
                                    color: "text.secondary"
                                }}>
                                    Tenants Used
                                </Typography>
                                <Typography variant="body2" sx={{
                                    fontWeight: "medium"
                                }}>
                                    {limitsInfo.current_count} / {limitsInfo.max_tenants}
                                </Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min(usagePercentage, 100)}
                                color={isAtLimit ? "error" : isNearLimit ? "warning" : "primary"}
                                sx={{ height: 8, borderRadius: 1 }}
                            />
                        </Box>
                    )}

                    {limitsInfo.max_tenants === null && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "success.main",
                                mt: 1
                            }}>
                            ✓ Unlimited tenants available on your plan
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {isAtLimit && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>Tenant Limit Reached</AlertTitle>
                    You have reached the maximum number of tenants ({limitsInfo.max_tenants}) allowed on your {limitsInfo.plan_name} plan.
                    To add more tenants, please upgrade your subscription.
                </Alert>
            )}

            {limitsInfo.is_trial && !isAtLimit && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    <AlertTitle>Trial Plan</AlertTitle>
                    You are currently on a trial plan. Your trial includes {limitsInfo.max_tenants} tenant(s).
                    Upgrade to a paid plan for more tenants and features.
                </Alert>
            )}
        </Box>
    );
};

export default TenancyTenantListHeader;
