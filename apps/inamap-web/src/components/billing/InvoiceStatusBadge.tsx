import React from 'react';
import { Chip } from '@mui/material';
import { useRecordContext, useTranslate } from 'react-admin';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

type InvoiceStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

interface InvoiceRecord {
    id: string | number;
    status: InvoiceStatus;
    amount: number;
    currency: string;
}

const getStatusColor = (status: InvoiceStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
        case 'succeeded':
            return 'success';
        case 'pending':
            return 'warning';
        case 'failed':
            return 'error';
        case 'refunded':
            return 'default';
        default:
            return 'default';
    }
};

const StatusBadge: React.FC = () => {
    const record = useRecordContext<InvoiceRecord>();
    const translate = useTranslate();

    if (!record) return null;

    const color = getStatusColor(record.status);
    const label = translate(`billing.invoices.status.${record.status}`, { _: record.status });

    return (
        <Chip
            label={label}
            color={color}
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
