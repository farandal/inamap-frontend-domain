import React, { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    IconButton,
    Divider,
    Alert,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Tooltip,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Receipt as ReceiptIcon,
    Visibility as ViewIcon,
    PictureAsPdf as PdfIcon,
    Close as CloseIcon,
    CheckCircle as PaidIcon,
    HourglassEmpty as PendingIcon,
    Error as FailedIcon,
} from '@mui/icons-material';
import { useRecordContext, useNotify, useTranslate } from 'react-admin';
import { useAxios } from 'dash-axios-hook';
import { saveAs } from 'file-saver';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

/**
 * Interface for the invoice/payment record
 */
interface InvoiceRecord {
    id: string | number;
    tenancy_subscription_id: number;
    tenancy_payment_method_id: number;
    payment_gateway: string;
    transaction_id: string;
    amount: string;
    currency: string;
    status: string;
    metadata?: {
        type?: string;
        plan_id?: number;
        plan_name?: string;
        period_start?: string;
        period_end?: string;
        auto_generated?: boolean;
        receipt_path?: string;
        receipt_generated_at?: string;
    };
    failure_reason?: string | null;
    created_at: string;
    updated_at: string;
    provider_transaction_id?: string | null;
    invoice_number?: string;
    invoice_path?: string;
    invoice_sent_at?: string | null;
    document_type?: string;
}

/**
 * InvoicePreview - Component for displaying and downloading PDF invoices/receipts
 * for tenancy payments
 * 
 * Features:
 * - Displays invoice status with visual indicators
 * - Preview PDF in a dialog
 * - Download invoice/receipt PDF
 * - Shows invoice number and amount
 */
const InvoicePreview: React.FC<IDashAutoAdminCustomFieldComponent> = ({ method }) => {
    const record = useRecordContext<InvoiceRecord>();
    const axios = useAxios();
    const notify = useNotify();
    const translate = useTranslate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Build the API endpoint for downloading an invoice
     */
    const buildDownloadUrl = useCallback((paymentId: string | number) => {
        return `tenancy/payments/${paymentId}/download`;
    }, []);

    /**
     * Load PDF for preview
     */
    const loadPdf = useCallback(async () => {
        if (!record) return;

        setLoading(true);
        setError(null);

        try {
            const downloadUrl = buildDownloadUrl(record.id);
            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], {
                type: 'application/pdf',
            });

            const fileURL = URL.createObjectURL(file);
            setPdfUrl(fileURL);
            setLoading(false);
        } catch (err: any) {
            console.error('Error loading PDF:', err);
            setLoading(false);
            setError(translate('billing.invoices.loadError'));
            notify(translate('billing.invoices.loadError'), { type: 'error' });
        }
    }, [record, buildDownloadUrl, axios, notify, translate]);

    /**
     * Download the invoice PDF
     */
    const downloadInvoice = useCallback(async () => {
        if (!record) return;

        try {
            const downloadUrl = buildDownloadUrl(record.id);
            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], {
                type: 'application/pdf',
            });

            const documentType = record.document_type || 'invoice';
            const invoiceNumber = record.invoice_number || record.id;
            const fileName = `${documentType}-${invoiceNumber}.pdf`;
            
            saveAs(file, fileName);
            notify(translate('billing.invoices.downloadSuccess'), { type: 'success' });
        } catch (err) {
            console.error('Error downloading PDF:', err);
            notify(translate('billing.invoices.downloadError'), { type: 'error' });
        }
    }, [record, buildDownloadUrl, axios, notify, translate]);

    /**
     * Open preview dialog
     */
    const viewInvoice = useCallback(async () => {
        setViewDialogOpen(true);
        await loadPdf();
    }, [loadPdf]);

    /**
     * Close preview dialog
     */
    const closeViewDialog = useCallback(() => {
        setViewDialogOpen(false);
        // Clean up blob URL
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    }, [pdfUrl]);

    /**
     * Get status icon and color
     */
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'succeeded':
            case 'paid':
                return { 
                    icon: <PaidIcon fontSize="small" />, 
                    color: 'success' as const,
                    label: translate('billing.invoices.status.succeeded')
                };
            case 'pending':
                return { 
                    icon: <PendingIcon fontSize="small" />, 
                    color: 'warning' as const,
                    label: translate('billing.invoices.status.pending')
                };
            case 'failed':
                return { 
                    icon: <FailedIcon fontSize="small" />, 
                    color: 'error' as const,
                    label: translate('billing.invoices.status.failed')
                };
            default:
                return { 
                    icon: <ReceiptIcon fontSize="small" />, 
                    color: 'default' as const,
                    label: status 
                };
        }
    };

    /**
     * Format currency amount
     */
    const formatAmount = (amount: string, currency: string) => {
        const numAmount = parseFloat(amount);
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency || 'CLP',
        }).format(numAmount);
    };

    /**
     * Format date
     */
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    /**
     * Get document type label
     */
    const getDocumentTypeLabel = (type?: string) => {
        switch (type) {
            case 'receipt':
                return translate('billing.invoices.documentType.receipt');
            case 'invoice':
                return translate('billing.invoices.documentType.invoice');
            default:
                return translate('billing.invoices.documentType.document');
        }
    };

    // Only show in list and show modes
    if (method === 'create' || method === 'edit') {
        return null;
    }

    if (!record) {
        return (
            <Box sx={{ p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    // Check if invoice is available
    const hasInvoice = record.invoice_path || record.metadata?.receipt_path;
    const statusInfo = getStatusInfo(record.status);

    // List mode - compact inline display
    if (method === 'list') {
        return (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title={translate('billing.invoices.view')}>
                    <span>
                        <IconButton 
                            size="small" 
                            onClick={viewInvoice}
                            disabled={!hasInvoice}
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={translate('billing.invoices.download')}>
                    <span>
                        <IconButton 
                            size="small" 
                            onClick={downloadInvoice}
                            disabled={!hasInvoice}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>

                {/* Preview Dialog */}
                <Dialog
                    open={viewDialogOpen}
                    onClose={closeViewDialog}
                    maxWidth="lg"
                    fullWidth
                    slotProps={{
                        paper: {
                            sx: { minHeight: '80vh' }
                        }
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1} sx={{
                            alignItems: "center"
                        }}>
                            <PdfIcon color="error" />
                            <Typography variant="h6">
                                {getDocumentTypeLabel(record.document_type)} {record.invoice_number}
                            </Typography>
                        </Stack>
                        <IconButton onClick={closeViewDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                minHeight: 400 
                            }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ m: 2 }}>
                                {error}
                            </Alert>
                        ) : pdfUrl ? (
                            <object
                                data={pdfUrl}
                                type="application/pdf"
                                style={{
                                    width: '100%',
                                    height: 'calc(80vh - 140px)',
                                    border: 'none',
                                }}
                            >
                                <Alert severity="warning" sx={{ m: 2 }}>
                                    {translate('billing.invoices.browserNotSupported')}
                                </Alert>
                            </object>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeViewDialog}>
                            {translate('billing.invoices.close')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={downloadInvoice}
                        >
                            {translate('billing.invoices.download')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    // Show/View mode - full card display
    return (
        <Box sx={{ width: '100%', p: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon /> {translate('billing.invoices.title')}
                </Typography>
            </Box>

            {/* Invoice Card */}
            <Card>
                <CardContent 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        py: 2,
                        flexDirection: isSmallScreen ? 'column' : 'row',
                        gap: isSmallScreen ? 2 : 0,
                        alignItems: isSmallScreen ? 'stretch' : 'center',
                    }}
                >
                    {/* Left side - PDF icon and invoice info */}
                    <Stack direction="row" spacing={2} sx={{
                        alignItems: "center"
                    }}>
                        <PdfIcon 
                            sx={{ 
                                fontSize: isSmallScreen ? 32 : 48, 
                                color: hasInvoice ? 'error.main' : 'action.disabled' 
                            }} 
                        />
                        <Box>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    alignItems: "center",
                                    mb: 0.5
                                }}>
                                <Typography variant="subtitle1" sx={{
                                    fontWeight: "bold"
                                }}>
                                    {getDocumentTypeLabel(record.document_type)} #{record.invoice_number || record.id}
                                </Typography>
                                <Chip 
                                    icon={statusInfo.icon}
                                    label={statusInfo.label}
                                    color={statusInfo.color}
                                    size="small"
                                />
                            </Stack>
                            <Typography variant="body2" sx={{
                                color: "text.secondary"
                            }}>
                                {formatAmount(record.amount, record.currency)}
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: "text.secondary"
                            }}>
                                {formatDate(record.created_at)}
                                {record.metadata?.plan_name && ` • Plan ${record.metadata.plan_name}`}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Right side - Action buttons */}
                    <Stack 
                        direction="row" 
                        spacing={1}
                        sx={{
                            width: isSmallScreen ? '100%' : 'auto',
                            justifyContent: isSmallScreen ? 'center' : 'flex-end',
                        }}
                    >
                        {!hasInvoice ? (
                            <Chip 
                                label={translate('billing.invoices.notAvailable')}
                                color="default" 
                                size="small" 
                            />
                        ) : isSmallScreen ? (
                            // Small screens: Circular icon buttons
                            (<>
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={viewInvoice}
                                    disabled={loading}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={16} color="inherit" />
                                    ) : (
                                        <ViewIcon fontSize="small" />
                                    )}
                                </IconButton>
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={downloadInvoice}
                                    sx={{
                                        bgcolor: 'secondary.main',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'secondary.dark',
                                        },
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <DownloadIcon fontSize="small" />
                                </IconButton>
                            </>)
                        ) : (
                            // Large screens: Text buttons
                            (<>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={loading ? <CircularProgress size={16} /> : <ViewIcon />}
                                    onClick={viewInvoice}
                                    disabled={loading}
                                >
                                    {translate('billing.invoices.view')}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadInvoice}
                                >
                                    {translate('billing.invoices.download')}
                                </Button>
                            </>)
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={closeViewDialog}
                maxWidth="lg"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { minHeight: '80vh' }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} sx={{
                        alignItems: "center"
                    }}>
                        <PdfIcon color="error" />
                        <Typography variant="h6">
                            {getDocumentTypeLabel(record.document_type)} {record.invoice_number}
                        </Typography>
                    </Stack>
                    <IconButton onClick={closeViewDialog} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            minHeight: 400 
                        }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ m: 2 }}>
                            {error}
                        </Alert>
                    ) : pdfUrl ? (
                        <object
                            data={pdfUrl}
                            type="application/pdf"
                            style={{
                                width: '100%',
                                height: 'calc(80vh - 140px)',
                                border: 'none',
                            }}
                        >
                            <Alert severity="warning" sx={{ m: 2 }}>
                                {translate('billing.invoices.browserNotSupported')}
                            </Alert>
                        </object>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeViewDialog}>
                        {translate('billing.invoices.close')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={downloadInvoice}
                    >
                        {translate('billing.invoices.download')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoicePreview;
