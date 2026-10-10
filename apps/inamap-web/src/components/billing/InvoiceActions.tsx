import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import {
    Visibility as ViewIcon,
    Download as DownloadIcon,
    MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useRecordContext, useNotify } from 'react-admin';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

interface InvoiceRecord {
    id: string | number;
    status: string;
    provider_transaction_id?: string;
    invoice_url?: string;
}

const ActionsMenu: React.FC = () => {
    const record = useRecordContext<InvoiceRecord>();
    const notify = useNotify();

    if (!record) return null;

    const handleViewDetails = () => {
        // In a real implementation, this would open a modal or navigate to details
        notify('Invoice details view coming soon', { type: 'info' });
    };

    const handleDownload = () => {
        if (record.invoice_url) {
            window.open(record.invoice_url, '_blank');
        } else {
            notify('Invoice download not available', { type: 'warning' });
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
                <IconButton size="small" onClick={handleViewDetails}>
                    <ViewIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Download">
                <IconButton 
                    size="small" 
                    onClick={handleDownload}
                    disabled={!record.invoice_url}
                >
                    <DownloadIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="More Actions">
                <IconButton size="small">
                    <MoreIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

const InvoiceActions: React.FC<IDashAutoAdminCustomFieldComponent> = ({
    method,
    attribute,
    resourceConfig,
}) => {
    switch (method) {
        case 'list':
            return <ActionsMenu />;
        case 'view':
        case 'edit':
        case 'create':
        default:
            return null;
    }
};

export default InvoiceActions;
