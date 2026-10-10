import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useState, useEffect, useCallback } from "react";
import { useRecordContext, useNotify, useRefresh, useTranslate, useLocale } from "react-admin";
import { useAxios } from 'dash-axios-hook';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Box,
    Divider,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tooltip,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import WarningIcon from "@mui/icons-material/Warning";
import UndoIcon from "@mui/icons-material/Undo";

export interface DeletionStatus {
    can_delete: boolean;
    reasons: string[];
    deletion_status: {
        is_pending_deletion: boolean;
        scheduled_deletion_at: string | null;
        days_until_deletion: number | null;
        can_cancel: boolean;
    };
    deprovisioning_delay_days: number;
}

export interface TenancyAccountDeleteProps extends IDashAutoAdminCustomFieldComponent {
    /** Optional: External deletion status (will fetch if not provided) */
    deletionStatus?: DeletionStatus | null;
    /** Optional: Callback after successful deletion request */
    onDeletionRequested?: () => void;
    /** Optional: Callback after successful cancellation */
    onDeletionCancelled?: () => void;
    /** Variant: 'card' shows full card, 'button' shows only the delete button */
    variant?: 'card' | 'button' | 'icon-button';
    /** Optional: Custom button props for button/icon-button variant */
    buttonProps?: Record<string, any>;
    /** Optional: Whether to fetch deletion status automatically */
    autoFetch?: boolean;
}

/**
 * TenancyAccountDelete Component
 * 
 * Provides account deletion functionality for TenancyAdmin users:
 * - Request account deletion with confirmation dialog
 * - Cancel pending deletion
 * 
 * Can be used in multiple variants:
 * - 'card': Full card with status and action buttons
 * - 'button': Just the delete/cancel button
 * - 'icon-button': Icon button (for lists)
 */
const TenancyAccountDelete: React.FC<TenancyAccountDeleteProps> = ({
    method,
    attribute,
    resourceConfig,
    deletionStatus: externalDeletionStatus,
    onDeletionRequested,
    onDeletionCancelled,
    variant = 'card',
    buttonProps = {},
    autoFetch = true,
    ...props
}) => {
    const record = useRecordContext();
    const axios = useAxios();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();
    const locale = useLocale();

    // Translation helper for tenancy account management keys
    const t = (key: string, options?: any) => {
        return translate(`tenancy_account.management.${key}`, options);
    };

    // Deletion state
    const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(externalDeletionStatus || null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const confirmWord = t('delete.dialog.confirm_word');

    // Update internal state when external status changes
    useEffect(() => {
        if (externalDeletionStatus !== undefined) {
            setDeletionStatus(externalDeletionStatus);
        }
    }, [externalDeletionStatus]);

    const fetchDeletionStatus = useCallback(async () => {
        try {
            const response = await axios.get(`/tenancy/account/deletion-status`);
            setDeletionStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch deletion status:', error);
        }
    }, []);

    // Auto-fetch deletion status on mount when autoFetch is true
    useEffect(() => {
        if (autoFetch && !externalDeletionStatus) {
            fetchDeletionStatus();
        }
    }, [autoFetch, externalDeletionStatus, fetchDeletionStatus]);

    const handleDeleteRequest = async () => {
        if (confirmText !== confirmWord) {
            notify(translate('ra.message.invalid_form'), { type: 'warning' });
            return;
        }

        setIsDeleting(true);
        try {
            const response = await axios.post(`/tenancy/account/request-deletion`, {
                confirm: true,
                confirm_text: confirmWord,
            });

            if (response.data.success) {
                notify(t('delete.success'), { type: 'success' });
                setDeleteDialogOpen(false);
                setConfirmText('');
                fetchDeletionStatus();
                refresh();
                onDeletionRequested?.();
            }
        } catch (error: any) {
           
            const message = error.response?.data?.message || t('delete.error');
            notify(message, { type: 'error' });
      
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDeletion = async () => {
        setIsCancelling(true);
        try {
            const response = await axios.post(`/tenancy/account/cancel-deletion`);

            if (response.data.success) {
                notify(t('pending_deletion.cancel_success'), { type: 'success' });
                fetchDeletionStatus();
                refresh();
                onDeletionCancelled?.();
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('pending_deletion.cancel_error');
            notify(message, { type: 'error' });
        } finally {
            setIsCancelling(false);
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

    // Use API-fetched status if available, otherwise infer from record data
    const isPendingDeletion = deletionStatus?.deletion_status?.is_pending_deletion
        || (record?.marked_for_deletion_at != null);

    // Delete Confirmation Dialog (shared by all variants)
    const renderDialog = () => (
        <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="error" />
                {t('delete.dialog.title')}
            </DialogTitle>
            <DialogContent>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('delete.dialog.warning_title')}
                    </Typography>
                    <Typography variant="body2">
                        {t('delete.dialog.warning_content')}
                    </Typography>
                </Alert>
                
                <List dense sx={{ mb: 2 }}>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.disable')} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText 
                            primary={t('delete.dialog.warning_items.schedule', {
                                days: deletionStatus?.deprovisioning_delay_days || 30
                            })} 
                        />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.delete_users')} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.delete_tenants')} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.delete_products')} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.delete_subscriptions')} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary={t('delete.dialog.warning_items.delete_data')} />
                    </ListItem>
                </List>

                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: "bold",
                        mb: 1
                    }}>
                    {t('delete.dialog.confirm_instruction')}
                </Typography>
                <TextField
                    fullWidth
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder={confirmWord}
                    error={confirmText.length > 0 && confirmText !== confirmWord}
                    helperText={
                        confirmText.length > 0 && confirmText !== confirmWord
                            ? translate('ra.message.invalid_form')
                            : ''
                    }
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>
                    {t('delete.dialog.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteRequest}
                    disabled={confirmText !== confirmWord || isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
                >
                    {t('delete.dialog.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Icon button variant (for use in lists)
    if (variant === 'icon-button') {
        if (isPendingDeletion) {
            return (
                <>
                    <Tooltip title={t('pending_deletion.cancel_button')}>
                        <IconButton
                            color="warning"
                            onClick={handleCancelDeletion}
                            disabled={isCancelling}
                            {...buttonProps}
                        >
                            {isCancelling ? <CircularProgress size={20} /> : <UndoIcon />}
                        </IconButton>
                    </Tooltip>
                </>
            );
        }

        return (
            <>
                <Tooltip title={t('delete.button')}>
                    <IconButton
                        color="error"
                        onClick={() => setDeleteDialogOpen(true)}
                        {...buttonProps}
                    >
                        <DeleteForeverIcon />
                    </IconButton>
                </Tooltip>
                {renderDialog()}
            </>
        );
    }

    // Button variant
    if (variant === 'button') {
        if (isPendingDeletion) {
            return (
                <>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={isCancelling ? <CircularProgress size={16} /> : <UndoIcon />}
                        onClick={handleCancelDeletion}
                        disabled={isCancelling}
                        {...buttonProps}
                    >
                        {t('pending_deletion.cancel_button')}
                    </Button>
                </>
            );
        }

        return (
            <>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    {...buttonProps}
                >
                    {t('delete.button')}
                </Button>
                {renderDialog()}
            </>
        );
    }

    // Card variant (full card view)
    return (
        <>
            <Card variant="outlined" sx={{ borderColor: isPendingDeletion ? 'error.main' : 'divider' }}>
                <CardHeader
                    avatar={<DeleteForeverIcon color={isPendingDeletion ? 'error' : 'action'} />}
                    title={
                        <Typography variant="h6" color={isPendingDeletion ? 'error' : 'textPrimary'}>
                            {isPendingDeletion ? t('pending_deletion.title') : t('delete.title')}
                        </Typography>
                    }
                    subheader={t('delete.description')}
                />
                <Divider />
                <CardContent>
                    {isPendingDeletion ? (
                        // Pending deletion state
                        (<Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    {t('pending_deletion.description', {
                                        date: formatDate(deletionStatus?.deletion_status?.scheduled_deletion_at || null),
                                    })}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        mt: 1
                                    }}>
                                    {translate('ra.page.days', { smart_count: deletionStatus?.deletion_status?.days_until_deletion || 0 })}
                                </Typography>
                            </Alert>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={isCancelling ? <CircularProgress size={16} /> : <UndoIcon />}
                                onClick={handleCancelDeletion}
                                disabled={isCancelling}
                            >
                                {t('pending_deletion.cancel_button')}
                            </Button>
                        </Box>)
                    ) : (
                        // Normal state - can request deletion
                        (<Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {t('delete.dialog.warning_content')}
                            </Typography>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteForeverIcon />}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                {t('delete.button')}
                            </Button>
                        </Box>)
                    )}
                </CardContent>
            </Card>
            {renderDialog()}
        </>
    );
};

export default TenancyAccountDelete;
