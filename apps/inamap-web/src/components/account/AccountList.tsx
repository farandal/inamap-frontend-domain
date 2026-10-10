import React, { useState, useEffect, useCallback } from "react";
import { IAccount } from "@app/interfaces/IAccount";
import { IDashAutoAdminDataGrid } from "dash-auto-admin";
import { WithListContext } from "react-admin";
import {
    Card,
    CardHeader,
    CardActions,
    CardContent,
    Typography,
    Chip,
    Box,
    Grid,
    Avatar,
    Stack,
    LinearProgress,
    Divider,
    ButtonGroup,
    Alert,
} from "@mui/material";
import { useAxios } from 'dash-axios-hook';
import { DeletionStatus } from './TenancyAccountDelete';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashResourceButton from "dash-auto-admin/toolbar/buttons/DashResourceButton";
import { useTranslate } from "../hooks/usePolyglotTranslation";
import TenancyAccountDelete from "./TenancyAccountDelete";

const formatDate = (v?: string | null, locale?: string) =>
    v ? new Date(v).toLocaleDateString(locale || undefined) : "-";

const statusColor = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("active")) return "success";
    if (s.includes("trial")) return "info";
    if (s.includes("suspend") || s.includes("suspended")) return "error";
    if (s.includes("inactive") || s.includes("disabled")) return "default";
    return "default";
};

/**
 * AccountList - Displays tenancy account cards with subscription info.
 * 
 * Trial information is now calculated from the current_subscription relationship,
 * which is eager-loaded by the TenancyController.
 */
const AccountList: React.FC<IDashAutoAdminDataGrid> = ({
    resourceConfig,
    dataGridProps,
    locale,
}) => {

    const translate = useTranslate();
    const axios = useAxios();

    // Deletion status state
    const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);

    const fetchDeletionStatus = useCallback(async () => {
        try {
            const response = await axios.get(`/tenancy/account/deletion-status`);
            setDeletionStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch deletion status:', error);
        }
    }, []);

    useEffect(() => {
        fetchDeletionStatus();
    }, [fetchDeletionStatus]);
    // Use the WithListContext provided data; resourceConfig/dataGridProps/locale kept for linter & future use
    return (
        <WithListContext<IAccount>
            render={({ data }: { data?: IAccount[] }) => {
                if (!data || data.length === 0) {
                    return <Typography>{translate('account.no_accounts')}</Typography>;
                }

                return (
                    <Grid container spacing={2}>
                        {data.map((rec) => {
                            // Fields to display
                            const {
                                id,
                                public_name,
                                email,
                                status,
                                created_at,
                                updated_at,
                                trial_ends_at,
                                // Subscriptions array from eager-loaded relationship
                                subscriptions,
                            } = rec as any;

                            // Get the current (first active) subscription from the array
                            const currentSubscription = Array.isArray(subscriptions) && subscriptions.length > 0
                                ? subscriptions[0]
                                : null;

                            // Calculate trial info from subscription
                            const subscriptionTrialEndsAt = currentSubscription?.trial_ends_at;
                            
                            // Use subscription trial_ends_at if available, otherwise fall back to tenancy trial_ends_at
                            const effectiveTrialEndsAt = subscriptionTrialEndsAt || trial_ends_at;

                            let isOnTrial = false;
                            if (currentSubscription) {
                                isOnTrial = currentSubscription.status === 'trial';
                            } else {
                                isOnTrial = effectiveTrialEndsAt && new Date(effectiveTrialEndsAt) > new Date();
                            }
                            
                            // Calculate days remaining
                            let daysRemaining = 0;
                            if (effectiveTrialEndsAt) {
                                const now = new Date();
                                const end = new Date(effectiveTrialEndsAt);
                                daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                            }

                            const displayName = public_name || email || `#${id}`;

                            // Trial progress: calculated from subscription data
                            let trialProgress = null;
                            if (isOnTrial && effectiveTrialEndsAt) {
                                const now = new Date();
                                const end = new Date(effectiveTrialEndsAt);
                                const start = created_at ? new Date(created_at) : new Date();
                                const totalMs = Math.max(1, end.getTime() - start.getTime());
                                const remainingMs = Math.max(0, end.getTime() - now.getTime());
                                const percent = Math.max(
                                    0,
                                    Math.min(100, Math.round((remainingMs / totalMs) * 100))
                                );
                                trialProgress = { percent, daysLeft: daysRemaining };
                            }

                            // Get plan name from subscription's effective_plan or subscription_plan
                            const planName = currentSubscription?.effective_plan?.name 
                                || currentSubscription?.subscription_plan?.name 
                                || null;

                            return (
                                <Grid item key={id} xs={12} sm={12} md={12} lg={12} xl={12}>
                                    <Card variant="outlined" sx={{ width: "100%" }}>
                                        <CardHeader
                                            avatar={
                                                <Avatar>
                                                    <AccountCircleIcon />
                                                </Avatar>
                                            }
                                            title={
                                                <Stack direction="row" spacing={1} sx={{
                                                    alignItems: "center"
                                                }}>
                                                    <Typography variant="h6" noWrap>
                                                        {displayName}
                                                    </Typography>
                                                    {status && (
                                                        <Chip
                                                            label={status}
                                                            color={statusColor(status) as any}
                                                            size="small"
                                                        />
                                                    )}
                                                </Stack>
                                            }
                                            subheader={<Typography variant="caption">#{id}</Typography>}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <Box sx={{
                                                mb: 1
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    color: "text.secondary"
                                                }}>
                                                    {translate('account.email_label')}
                                                </Typography>
                                                <Typography variant="body1">{email ?? "-"}</Typography>
                                            </Box>

                                            <Box
                                                sx={{
                                                    mb: 1,
                                                    display: "flex",
                                                    gap: 1,
                                                    flexWrap: "wrap"
                                                }}>
                                                <Chip
                                                    label={`${translate('account.created_label')}: ${formatDate(created_at, locale)}`}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`${translate('account.updated_label')}: ${formatDate(updated_at, locale)}`}
                                                    size="small"
                                                />
                                                {isOnTrial && effectiveTrialEndsAt && (
                                                    <Chip
                                                        label={`${translate('account.trial_ends_label')}: ${formatDate(effectiveTrialEndsAt, locale)}`}
                                                        size="small"
                                                        color="info"
                                                    />
                                                )}
                                            </Box>

                                            {/* Plan info from subscription */}
                                            {planName && (
                                                <Box sx={{
                                                    mb: 1
                                                }}>
                                                    <Typography variant="body2" sx={{
                                                        color: "text.secondary"
                                                    }}>
                                                        {translate('account.plan_label')}: <strong>{planName}</strong>
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Trial progress bar */}
                                            {isOnTrial && trialProgress && (
                                                <Box sx={{
                                                    mt: 2
                                                }}>
                                                    <Typography variant="caption" sx={{
                                                        color: "text.secondary"
                                                    }}>
                                                        {translate('account.trial_days_left')}: {trialProgress.daysLeft}
                                                    </Typography>
                                                    <Box sx={{
                                                        mt: 1
                                                    }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={trialProgress.percent}
                                                            color="info"
                                                        />
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Deletion countdown progress bar */}
                                            {deletionStatus?.deletion_status?.is_pending_deletion && (() => {
                                                const daysUntil = deletionStatus.deletion_status.days_until_deletion ?? 0;
                                                const totalDays = deletionStatus.deprovisioning_delay_days || 30;
                                                const percent = Math.max(0, Math.min(100, Math.round((daysUntil / totalDays) * 100)));
                                                const scheduledDate = deletionStatus.deletion_status.scheduled_deletion_at
                                                    ? new Date(deletionStatus.deletion_status.scheduled_deletion_at).toLocaleDateString(locale || undefined)
                                                    : '-';
                                                return (
                                                    <Box sx={{
                                                        mt: 2
                                                    }}>
                                                        <Alert severity="error" sx={{ mb: 1 }}>
                                                            <Typography variant="body2">
                                                                {translate('account.deletion_scheduled', { date: scheduledDate })}
                                                            </Typography>
                                                        </Alert>
                                                        <Typography variant="caption" color="error">
                                                            {translate('account.deletion_days_remaining', { days: Math.ceil(daysUntil) })}
                                                        </Typography>
                                                        <Box sx={{
                                                            mt: 0.5
                                                        }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={percent}
                                                                color="error"
                                                            />
                                                        </Box>
                                                    </Box>
                                                );
                                            })()}
                                        </CardContent>
                                        <CardActions>
                                            <ButtonGroup size={"small"}>
                                                <DashResourceButton
                                                    resource={resourceConfig.model}
                                                    record={rec}
                                                    resourceConfig={resourceConfig}
                                                    mode="edit"
                                                    title={translate('common.edit')}
                                                />
                                            </ButtonGroup>
                                            <TenancyAccountDelete 
                                                resourceConfig={resourceConfig}
                                                method="edit"
                                                attribute={null}
                                                variant="icon-button" 
                                                autoFetch={true}
                                            />
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                );
            }}
        />
    );
};

export default AccountList;
