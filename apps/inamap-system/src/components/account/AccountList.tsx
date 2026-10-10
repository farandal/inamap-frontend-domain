import React from "react";
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
} from "@mui/material";
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
const AccountList: React.FC<IDashAutoAdminDataGrid> = ({
    resourceConfig,
    dataGridProps,
    locale,
}) => {

    const translate = useTranslate();
    // Use the WithListContext provided data; resourceConfig/dataGridProps/locale kept for linter & future use
    return (
        <WithListContext<IAccount>
            render={({ data }: { data?: IAccount[] }) => {
                if (!data || data.length === 0) {
                    return <Typography>No accounts</Typography>;
                }

                return (
                    <Grid container spacing={2}>
                        {data.map((rec) => {
                            // Fields to display - ignore settings, metadata, marked_for_deletion_at, gateway*, pm*
                            const {
                                id,
                                name,
                                email,
                                status,
                                created_at,
                                updated_at,
                                trial_ends_at,
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            } = rec as any;

                            // Trial progress: use created_at -> trial_ends_at if available
                            let trialProgress = null;
                            if (trial_ends_at) {
                                const now = new Date();
                                const end = new Date(trial_ends_at);
                                const start = created_at ? new Date(created_at) : new Date();
                                const totalMs = Math.max(1, end.getTime() - start.getTime());
                                const remainingMs = Math.max(0, end.getTime() - now.getTime());
                                const percent = Math.max(
                                    0,
                                    Math.min(100, Math.round((remainingMs / totalMs) * 100))
                                );
                                const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                                trialProgress = { percent, daysLeft };
                            }

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
                                                        {name || email || `#${id}`}
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
                                                    Email
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
                                                    label={`Created: ${formatDate(created_at, locale)}`}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`Updated: ${formatDate(updated_at, locale)}`}
                                                    size="small"
                                                />
                                                {trial_ends_at && (
                                                    <Chip
                                                        label={`Trial ends: ${formatDate(trial_ends_at, locale)}`}
                                                        size="small"
                                                    />
                                                )}
                                            </Box>

                                            {trial_ends_at && trialProgress && (
                                                <Box sx={{
                                                    mt: 2
                                                }}>
                                                    <Typography variant="caption" sx={{
                                                        color: "text.secondary"
                                                    }}>
                                                        Trial days left: {trialProgress.daysLeft}
                                                    </Typography>
                                                    <Box sx={{
                                                        mt: 1
                                                    }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={trialProgress.percent}
                                                        />
                                                    </Box>
                                                </Box>
                                            )}
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
