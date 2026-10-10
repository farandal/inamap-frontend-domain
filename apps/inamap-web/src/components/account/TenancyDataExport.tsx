import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useRecordContext, useNotify, useTranslate, useLocale } from "react-admin";
import { useAxios } from 'dash-axios-hook';
import { useDialog } from "dash-dialog";
// IMPORTANT: Import from 'dash-admin' package to ensure same context instance as main app
import LaravelEchoContext, { ILaravelEchoContext } from 'dash-admin/contexts/com/LaravelEchoContext';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Box,
    Divider,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Stack,
    IconButton,
    Tooltip,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";

export interface Export {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
    created_at: string;
    completed_at: string | null;
    can_download: boolean;
    expires_at: string | null;
}

export interface TenancyDataExportProps extends IDashAutoAdminCustomFieldComponent {
    /** Optional: External exports list (will fetch if not provided) */
    exports?: Export[];
    /** Optional: Callback after successful export request */
    onExportRequested?: () => void;
    /** Optional: Callback after successful download */
    onExportDownloaded?: (exportId: string) => void;
    /** Variant: 'card' shows full card, 'button' shows only the export button */
    variant?: 'card' | 'button' | 'icon-button';
    /** Optional: Custom button props for button/icon-button variant */
    buttonProps?: Record<string, any>;
    /** Optional: Whether to fetch exports automatically */
    autoFetch?: boolean;
    /** Optional: Show export history (only for card variant) */
    showHistory?: boolean;
}

/**
 * TenancyDataExport Component
 * 
 * Provides data export functionality for TenancyAdmin users:
 * - Request new data export
 * - View export history
 * - Download completed exports
 * - Real-time notifications via WebSocket when export completes
 * - Shows a dialog when the export job finishes
 * 
 * Can be used in multiple variants:
 * - 'card': Full card with history and action buttons
 * - 'button': Just the export button
 * - 'icon-button': Icon button (for lists)
 */
const TenancyDataExport: React.FC<TenancyDataExportProps> = ({
    method,
    attribute,
    resourceConfig,
    exports: externalExports,
    onExportRequested,
    onExportDownloaded,
    variant = 'card',
    buttonProps = {},
    autoFetch = true,
    showHistory = true,
    ...props
}) => {
    const record = useRecordContext();
    const axios = useAxios();
    const notify = useNotify();
    const translate = useTranslate();
    const locale = useLocale();
    const dialog = useDialog();

    // LaravelEcho context for real-time WebSocket notifications
    const laravelEchoContext = useContext<ILaravelEchoContext>(LaravelEchoContext);
    const { lastEvent } = laravelEchoContext;

    // Track processed events to avoid duplicate handling
    const lastProcessedEventRef = useRef<string | null>(null);

    // Translation helper for tenancy account management keys
    const t = (key: string, options?: any) => {
        return translate(`tenancy_account.management.${key}`, options);
    };

    // Export state
    const [exports, setExports] = useState<Export[]>(externalExports || []);
    const [isExporting, setIsExporting] = useState(false);
    const [loadingExports, setLoadingExports] = useState(autoFetch && !externalExports);

    // Update internal state when external exports change
    useEffect(() => {
        if (externalExports !== undefined) {
            setExports(externalExports);
        }
    }, [externalExports]);

    const fetchExports = useCallback(async () => {
        setLoadingExports(true);
        try {
            const response = await axios.get(`/tenancy/account/exports`);
            setExports(response.data.exports || []);
        } catch (error) {
            console.error('Failed to fetch exports:', error);
        } finally {
            setLoadingExports(false);
        }
    }, []);

    // Fetch exports on mount if autoFetch is enabled and no external exports provided
    useEffect(() => {
        if (autoFetch && externalExports === undefined && record?.id) {
            fetchExports();
        }
    }, [record?.id, autoFetch, externalExports, fetchExports]);

    // ============ WebSocket Notification Listener ============
    useEffect(() => {
        if (!lastEvent) return;

        // Extract event type from multiple possible locations in the notification structure
        const eventType = lastEvent.type ||
            lastEvent.data?.type ||
            lastEvent.notificationPayload?.type ||
            lastEvent.notificationPayload?.stdClass?.type ||
            lastEvent.notificationPayload?.notificationPayload?.type;

        const notificationClass = lastEvent.notificationPayload?.class ||
            lastEvent.notificationPayload?.stdClass?.class;

        // Only handle tenancy data export notifications
        if (eventType !== 'tenancy_data_export_completed' &&
            notificationClass !== 'TenancyDataExportNotification') {
            return;
        }

        // Get data from multiple possible locations in the notification structure
        const eventData = lastEvent.data || {};
        const payloadData = lastEvent.notificationPayload?.notificationPayload || {};

        const eventTimestamp = eventData.timestamp ||
            payloadData.timestamp ||
            lastEvent.timestamp;

        const exportId = eventData.export_id || payloadData.export_id || '';
        const currentEventKey = `${eventType}-${eventTimestamp || ''}-${exportId}`;

        // Skip if we've already processed this exact event
        if (lastProcessedEventRef.current === currentEventKey) {
            return;
        }

        // Mark as processed
        lastProcessedEventRef.current = currentEventKey;

        const notificationData = eventData.export_id ? eventData : payloadData;
        const status = notificationData.status || 'completed';
        const canDownload = notificationData.can_download || false;
        const completedExportId = notificationData.export_id;

        console.log('[TenancyDataExport] Export notification received:', {
            status,
            exportId: completedExportId,
            canDownload,
        });

        // Refresh the export list to show updated status
        fetchExports();

        // Show a dash-dialog based on the export result
        if (status === 'completed' && canDownload) {
            dialog({
                variant: "success",
                title: t('export.dialog.completed_title', { _: 'Data Export Ready' }),
                content: t('export.dialog.completed_content', {
                    _: 'Your data export has been completed successfully and is ready for download.'
                }),
                showCancelButton: true,
                confirmText: t('export.dialog.download_button', { _: 'Download Now' }),
                cancelText: t('export.dialog.dismiss_button', { _: 'Later' }),
                onConfirm: () => {
                    if (completedExportId) {
                        handleDownloadExport(completedExportId);
                    }
                },
            });
        } else if (status === 'failed') {
            const errorMessage = notificationData.error || '';
            dialog({
                variant: "danger",
                title: t('export.dialog.failed_title', { _: 'Data Export Failed' }),
                content: t('export.dialog.failed_content', {
                    _: `The data export could not be completed. ${errorMessage ? `Error: ${errorMessage}` : 'Please try again later.'}`,
                }),
                confirmText: t('export.dialog.ok_button', { _: 'OK' }),
            });
        }
    }, [lastEvent]);

    const handleRequestExport = async () => {
        setIsExporting(true);
        try {
            const response = await axios.post(`/tenancy/account/exports`, {
                include_users: true,
                include_tenants: true,
                include_products: true,
                include_billing: true,
            });

            if (response.data.success) {
                notify(t('export.success'), { type: 'success' });
                fetchExports();
                onExportRequested?.();
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('export.error');
            notify(message, { type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadExport = async (exportId: string) => {
        try {
            const response = await axios.get(`/tenancy/account/exports/${exportId}/download`, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tenancy-export-${exportId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            onExportDownloaded?.(exportId);
        } catch (error: any) {
            const message = error.response?.data?.message || translate('ra.notification.http_error');
            notify(message, { type: 'error' });
        }
    };

    const getExportStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon color="success" />;
            case 'failed':
                return <ErrorIcon color="error" />;
            case 'expired':
                return <HistoryToggleOffIcon color="disabled" />;
            case 'pending':
            case 'processing':
                return <HourglassEmptyIcon color="warning" />;
            default:
                return <HourglassEmptyIcon />;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const hasExportInProgress = exports.some(e => e.status === 'pending' || e.status === 'processing');

    // Icon button variant (for use in lists)
    if (variant === 'icon-button') {
        return (
            <Tooltip title={hasExportInProgress ? t('export.in_progress') : t('export.button')}>
                <span>
                    <IconButton
                        color="primary"
                        onClick={handleRequestExport}
                        disabled={isExporting || hasExportInProgress}
                        {...buttonProps}
                    >
                        {isExporting ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                    </IconButton>
                </span>
            </Tooltip>
        );
    }

    // Button variant
    if (variant === 'button') {
        return (
            <Button
                variant="contained"
                color="primary"
                startIcon={isExporting ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                onClick={handleRequestExport}
                disabled={isExporting || hasExportInProgress}
                {...buttonProps}
            >
                {isExporting ? t('export.requesting') : t('export.button')}
            </Button>
        );
    }

    // Card variant (full card view)
    return (
        <Card variant="outlined">
            <CardHeader
                avatar={<CloudDownloadIcon color="action" />}
                title={
                    <Typography variant="h6">
                        {t('export.title')}
                    </Typography>
                }
                subheader={t('export.description')}
            />
            <Divider />
            <CardContent>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={isExporting ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                    onClick={handleRequestExport}
                    disabled={isExporting || hasExportInProgress}
                    sx={{ mb: 2 }}
                >
                    {isExporting ? t('export.requesting') : t('export.button')}
                </Button>

                {hasExportInProgress && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="textSecondary">
                            {t('export.waiting_message', { _: 'Your export is being processed. You will be notified when it is ready.' })}
                        </Typography>
                    </Box>
                )}

                {showHistory && (
                    <>
                        {loadingExports ? (
                            <CircularProgress size={24} />
                        ) : exports.length > 0 ? (
                            <>
                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                    {t('export.history.title')}
                                </Typography>
                                <List dense>
                                    {exports.map((exp) => (
                                        <ListItem
                                            key={exp.id}
                                            sx={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <ListItemIcon>
                                                {getExportStatusIcon(exp.status)}
                                            </ListItemIcon>
                                            <ListItemText
                                                sx={{ pr: 2 }}
                                                primary={
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        useFlexGap
                                                        sx={{
                                                            alignItems: "center",
                                                            flexWrap: "wrap"
                                                        }}>
                                                        <Typography variant="body2">
                                                            {formatDate(exp.created_at)}
                                                        </Typography>
                                                        <Chip
                                                            label={t(`export.history.status.${exp.status}`)}
                                                            size="small"
                                                            color={
                                                                exp.status === 'completed' ? 'success' :
                                                                exp.status === 'failed' ? 'error' :
                                                                exp.status === 'expired' ? 'default' :
                                                                'default'
                                                            }
                                                        />
                                                    </Stack>
                                                }
                                                secondary={
                                                    <>
                                                        {exp.status === 'completed' && exp.expires_at && (
                                                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                                                {t('export.history.expires', { date: formatDate(exp.expires_at), _: `Expires: ${formatDate(exp.expires_at)}` })}
                                                            </Typography>
                                                        )}
                                                        {exp.status === 'expired' && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "text.disabled",
                                                                    mt: 0.5,
                                                                    display: 'block'
                                                                }}>
                                                                {t('export.history.expired_note', { _: 'This export has expired and the file has been deleted.' })}
                                                            </Typography>
                                                        )}
                                                    </>
                                                }
                                            />
                                            {exp.can_download && exp.status !== 'expired' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleDownloadExport(exp.id)}
                                                    sx={{ flexShrink: 0 }}
                                                >
                                                    {t('export.history.download')}
                                                </Button>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                {t('export.history.no_exports')}
                            </Typography>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default TenancyDataExport;
