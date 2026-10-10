import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useState, useEffect, useCallback } from "react";
import { useRecordContext, useNotify, useTranslate, useLocale } from "react-admin";
import { useAxios } from 'dash-axios-hook';
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

export interface Export {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
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
                                            secondaryAction={
                                                exp.can_download && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleDownloadExport(exp.id)}
                                                    >
                                                        {t('export.history.download')}
                                                    </Button>
                                                )
                                            }
                                        >
                                            <ListItemIcon>
                                                {getExportStatusIcon(exp.status)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} sx={{
                                                        alignItems: "center"
                                                    }}>
                                                        <Typography variant="body2">
                                                            {formatDate(exp.created_at)}
                                                        </Typography>
                                                        <Chip
                                                            label={t(`export.history.status.${exp.status}`)}
                                                            size="small"
                                                            color={exp.status === 'completed' ? 'success' : exp.status === 'failed' ? 'error' : 'default'}
                                                        />
                                                    </Stack>
                                                }
                                                secondary={
                                                    exp.expires_at && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {t('export.history.expires', { date: formatDate(exp.expires_at) })}
                                                        </Typography>
                                                    )
                                                }
                                            />
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
