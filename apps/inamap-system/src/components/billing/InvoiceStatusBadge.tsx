import React from 'react';
import { Chip } from '@mui/material';
import { useRecordContext } from 'react-admin';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

type InvoiceStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

interface InvoiceRecord {
    id: string | number;
    status: InvoiceStatus;
    amount: number;
    currency: string;
}

const getStatusConfig = (status: InvoiceStatus): { label: string; color: 'success' | 'warning' | 'error' | 'default' } => {
    switch (status) {
        case 'succeeded':
            return { label: 'Paid', color: 'success' };
        case 'pending':
            return { label: 'Pending', color: 'warning' };
        case 'failed':
            return { label: 'Failed', color: 'error' };
        case 'refunded':
            return { label: 'Refunded', color: 'default' };
        default:
            return { label: status, color: 'default' };
    }
};

const StatusBadge: React.FC = () => {
    const record = useRecordContext<InvoiceRecord>();

    if (!record) return null;

    const config = getStatusConfig(record.status);

    return (
        <Chip
            label={config.label}
            color={config.color}
            size="small"
            sx={{
                fontWeight: 600,
                minWidth: 70,
            }}
        />
    );
};

const InvoiceStatusBadge: React.FC<IDashAutoAdminCustomFieldComponent> = ({
    method,
    attribute,
    resourceConfig,
}) => {
    switch (method) {
        case 'list':
        case 'view':
            return <StatusBadge />;
        case 'edit':
        case 'create':
        default:
            return null;
    }
};

export default InvoiceStatusBadge;
