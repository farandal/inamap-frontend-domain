import React, { useState, useMemo, useCallback } from "react";
import { useRecordContext, useGetList, Loading } from "react-admin";
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Tooltip,
    Alert,
} from "@mui/material";
import {
    DataGrid as MUIGrid,
    GridColDef,
    GridRowParams,
    GridPaginationModel,
    GridToolbarContainer,
    GridToolbarExport,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

/**
 * SubscriptionPlanAuditLog Component
 *
 * A specialized audit log component for Subscription Plans that extends the
 * generic audit logging with gateway sync event visualization.
 *
 * Features:
 * - Shows both standard CRUD events and gateway sync events
 * - Color-coded sync status (success/warning/error)
 * - Gateway-specific details in dialog
 * - Distinguishes between audit logs and gateway sync logs
 */

interface ActivityLogRecord {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer_type: string | null;
    causer_id: number | null;
    causer_name?: string;
    properties: Record<string, any>;
    event: string | null;
    batch_uuid: string | null;
    created_at: string;
    updated_at: string;
}

interface DialogState {
    open: boolean;
    log: ActivityLogRecord | null;
}

export interface SubscriptionPlanAuditLogProps {
    resourceConfig?: {
        model?: string;
        [key: string]: any;
    };
    method?: 'create' | 'edit' | 'view' | 'list' | 'show';
    resource?: string;
    [key: string]: any;
}

/**
 * Custom toolbar with export functionality
 */
const AuditToolbar: React.FC = () => {
    return (
        <GridToolbarContainer>
            <GridToolbarExport
                csvOptions={{
                    fileName: 'subscription-plan-audit-logs',
                    delimiter: ',',
                    utf8WithBom: true,
                }}
                printOptions={{
                    hideFooter: true,
                    hideToolbar: true,
                }}
            />
        </GridToolbarContainer>
    );
};

/**
 * Get event color chip based on event type - includes gateway sync events
 */
const getEventChip = (event: string | null, logName?: string): React.ReactNode => {
    const eventLower = (event || '').toLowerCase();
    let color: 'success' | 'warning' | 'error' | 'info' | 'default' | 'secondary' = 'default';
    let icon: React.ReactNode = null;
    let variant: 'filled' | 'outlined' = 'outlined';

    // Handle gateway sync events
    if (logName === 'gateway_sync' || eventLower.startsWith('sync_')) {
        variant = 'filled';
        switch (eventLower) {
            case 'sync_success':
                color = 'success';
                icon = <CheckCircleIcon fontSize="small" />;
                break;
            case 'sync_started':
                color = 'info';
                icon = <SyncIcon fontSize="small" />;
                break;
            case 'sync_warning':
                color = 'warning';
                icon = <WarningIcon fontSize="small" />;
                break;
            case 'sync_failed':
                color = 'error';
                icon = <ErrorIcon fontSize="small" />;
                break;
            default:
                color = 'secondary';
                icon = <SyncIcon fontSize="small" />;
        }

        return (
            <Chip
                icon={icon}
                label={event || 'N/A'}
                color={color}
                size="small"
                variant={variant}
            />
        );
    }

    // Handle standard CRUD events
    switch (eventLower) {
        case 'created':
            color = 'success';
            break;
        case 'updated':
            color = 'warning';
            break;
        case 'deleted':
            color = 'error';
            break;
        case 'restored':
            color = 'info';
            break;
        default:
            color = 'default';
    }

    return (
        <Chip
            label={event || 'N/A'}
            color={color}
            size="small"
            variant="outlined"
        />
    );
};

/**
 * Get source chip for log type
 */
const getSourceChip = (logName: string): React.ReactNode => {
    const isSync = logName === 'gateway_sync';
    return (
        <Chip
            icon={isSync ? <SyncIcon fontSize="small" /> : undefined}
            label={isSync ? 'Gateway Sync' : 'Audit'}
            color={isSync ? 'secondary' : 'default'}
            size="small"
            variant="outlined"
        />
    );
};

/**
 * JSON Viewer Dialog with gateway sync details
 */
interface JsonDialogProps {
    open: boolean;
    log: ActivityLogRecord | null;
    onClose: () => void;
}

const SubscriptionPlanAuditJsonDialog: React.FC<JsonDialogProps> = ({ open, log, onClose }) => {
    if (!log) return null;

    const formatJson = (obj: any): string => {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    };

    const isGatewaySync = log.log_name === 'gateway_sync';
    const properties = log.properties || {};
    const isSyncError = log.event?.toLowerCase() === 'sync_failed';
    const isSyncSuccess = log.event?.toLowerCase() === 'sync_success';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="audit-log-dialog-title"
        >
            <DialogTitle id="audit-log-dialog-title">
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}>
                        {isGatewaySync && <SyncIcon color="secondary" />}
                        <Typography variant="h6">
                            {isGatewaySync ? 'Gateway Sync Details' : 'Audit Log Details'}
                        </Typography>
                    </Box>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {/* Gateway sync message alert */}
                {isGatewaySync && properties.message && (
                    <Alert 
                        severity={isSyncError ? 'error' : isSyncSuccess ? 'success' : 'info'}
                        sx={{ mb: 2 }}
                        icon={isSyncError ? <ErrorIcon /> : isSyncSuccess ? <CheckCircleIcon /> : <SyncIcon />}
                    >
                        {properties.message}
                    </Alert>
                )}

                {/* Error details */}
                {isGatewaySync && properties.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <strong>Error:</strong> {properties.error}
                    </Alert>
                )}

                <Box sx={{
                    mb: 2
                }}>
                    <Typography variant="subtitle2" color="textSecondary">
                        {isGatewaySync ? 'Sync Information' : 'Event Information'}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                        <Typography variant="body2">
                            <strong>ID:</strong> {log.id}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Event:</strong> {log.event || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Description:</strong> {log.description}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Log Type:</strong> {log.log_name === 'gateway_sync' ? 'Gateway Sync' : 'Audit Trail'}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Created At:</strong> {new Date(log.created_at).toLocaleString()}
                        </Typography>
                        {log.causer_name && (
                            <Typography variant="body2">
                                <strong>Triggered By:</strong> {log.causer_name}
                            </Typography>
                        )}
                        {isGatewaySync && properties.gateway && (
                            <Typography variant="body2">
                                <strong>Gateway:</strong> {properties.gateway.toUpperCase()}
                            </Typography>
                        )}
                        {isGatewaySync && properties.action && (
                            <Typography variant="body2">
                                <strong>Action:</strong> {properties.action}
                            </Typography>
                        )}
                        {isGatewaySync && properties.external_plan_id && (
                            <Typography variant="body2">
                                <strong>External Plan ID:</strong> {properties.external_plan_id}
                            </Typography>
                        )}
                    </Paper>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                        Full Properties (JSON)
                    </Typography>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mt: 1,
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                            maxHeight: 300,
                            overflow: 'auto',
                        }}
                    >
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {formatJson(log.properties)}
                        </pre>
                    </Paper>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/**
 * Main Subscription Plan Audit Log View Component
 */
const SubscriptionPlanAuditLogView: React.FC<SubscriptionPlanAuditLogProps> = ({ 
    resourceConfig, 
    resource: resourceOverride 
}) => {
    const record = useRecordContext();
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });
    const [dialogState, setDialogState] = useState<DialogState>({
        open: false,
        log: null,
    });

    // Build the audit endpoint URL
    const baseResource = resourceOverride || resourceConfig?.model || 'system/subscription_plan';
    const auditResource = `${baseResource}/audit`;

    const { data, total, isLoading, error } = useGetList<ActivityLogRecord>(
        auditResource,
        {
            pagination: {
                page: paginationModel.page + 1,
                perPage: paginationModel.pageSize,
            },
            sort: { field: 'created_at', order: 'DESC' },
            filter: { subject_id: record?.id },
        },
        { enabled: !!record?.id, refetchOnWindowFocus: false }
    );

    const handleViewLog = useCallback((log: ActivityLogRecord) => {
        setDialogState({ open: true, log });
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogState({ open: false, log: null });
    }, []);

    const columns: GridColDef[] = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
            },
            {
                field: 'log_name',
                headerName: 'Source',
                width: 130,
                renderCell: (params) => getSourceChip(params.value || 'default'),
            },
            {
                field: 'event',
                headerName: 'Event',
                width: 140,
                renderCell: (params) => getEventChip(params.value, params.row.log_name),
            },
            {
                field: 'description',
                headerName: 'Description',
                flex: 1,
                minWidth: 180,
            },
            {
                field: 'causer_name',
                headerName: 'Changed By',
                width: 130,
                valueGetter: (value, row) => row.causer_name || 'System',
            },
            {
                field: 'created_at',
                headerName: 'Date',
                width: 170,
                valueFormatter: (value) =>
                    value ? new Date(value).toLocaleString() : '',
            },
            {
                field: 'actions',
                headerName: 'Actions',
                type: 'actions',
                width: 80,
                getActions: (params: GridRowParams<ActivityLogRecord>) => [
                    <Tooltip title="View Details" key="view">
                        <IconButton
                            size="small"
                            onClick={() => handleViewLog(params.row)}
                            color="primary"
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>,
                ],
            },
        ],
        [handleViewLog]
    );

    if (!record?.id) {
        return (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{
                    color: "text.secondary"
                }}>
                    Save the record first to view audit logs
                </Typography>
            </Paper>
        );
    }

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography color="error">
                    Error loading audit logs: {(error as Error)?.message || 'Unknown error'}
                </Typography>
            </Paper>
        );
    }

    const rows = data || [];

    // Count sync events for summary
    const syncEvents = rows.filter(r => r.log_name === 'gateway_sync');
    const syncErrors = syncEvents.filter(r => r.event?.toLowerCase() === 'sync_failed');

    return (
        <Box>
            {/* Summary alerts for sync status */}
            {syncErrors.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {syncErrors.length} gateway sync error(s) detected. Click on the rows to view details.
                </Alert>
            )}

            <Paper variant="outlined" sx={{ width: '100%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h6">
                        Audit Logs & Gateway Sync History
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            ml: 'auto'
                        }}>
                        {total || 0} entries
                    </Typography>
                </Box>

                <MUIGrid
                    rows={rows}
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 25, 50]}
                    rowCount={total || 0}
                    paginationMode="server"
                    disableRowSelectionOnClick
                    autoHeight
                    slots={{
                        toolbar: AuditToolbar,
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-row': {
                            cursor: 'pointer',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                    getRowClassName={(params) => {
                        if (params.row.log_name === 'gateway_sync') {
                            if (params.row.event?.toLowerCase() === 'sync_failed') {
                                return 'sync-error-row';
                            }
                            return 'sync-row';
                        }
                        return '';
                    }}
                    onRowClick={(params) => handleViewLog(params.row)}
                />
            </Paper>

            <SubscriptionPlanAuditJsonDialog
                open={dialogState.open}
                log={dialogState.log}
                onClose={handleCloseDialog}
            />
        </Box>
    );
};

/**
 * Main exported component - handles different modes
 */
const SubscriptionPlanAuditLog: React.FC<SubscriptionPlanAuditLogProps> = (props) => {
    const { method } = props;

    // Only show in edit/view modes
    if (method === 'create' || method === 'list') {
        return null;
    }

    return <SubscriptionPlanAuditLogView {...props} />;
};

export default SubscriptionPlanAuditLog;
