import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    CreditCard as CardIcon,
    AccountBalance as BankIcon,
    Star as DefaultIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRecordContext, useNotify } from 'react-admin';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';

interface PaymentMethodRecord {
    id: string | number;
    type: 'card' | 'bank_transfer' | string;
    last_four: string;
    brand?: string;
    is_default: boolean;
    expires_at?: string;
}

const getCardBrandIcon = (brand?: string): string => {
    const brandIcons: Record<string, string> = {
        visa: '💳 Visa',
        mastercard: '💳 Mastercard',
        amex: '💳 Amex',
        discover: '💳 Discover',
    };
    return brandIcons[brand?.toLowerCase() || ''] || '💳';
};

const PaymentMethodDisplay: React.FC<{ showActions?: boolean }> = ({ showActions = false }) => {
    const record = useRecordContext<PaymentMethodRecord>();
    const notify = useNotify();

    if (!record) return null;

    const isCard = record.type === 'card';
    const Icon = isCard ? CardIcon : BankIcon;
    
    const expiryDate = record.expires_at 
        ? new Date(record.expires_at).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
        : null;

    const handleDelete = () => {
        // TODO: Implement delete via dataProvider
        notify('Delete payment method functionality coming soon', { type: 'info' });
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                }}
            >
                <Icon color="action" />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{
                    fontWeight: "medium"
                }}>
                    {record.brand || record.type} •••• {record.last_four}
                </Typography>
                {expiryDate && (
                    <Typography variant="caption" color="textSecondary">
                        Expires {expiryDate}
                    </Typography>
                )}
            </Box>

            {record.is_default && (
                <Chip
                    icon={<DefaultIcon fontSize="small" />}
                    label="Default"
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            )}

            {showActions && (
                <Tooltip title="Remove">
                    <IconButton size="small" onClick={handleDelete} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

const PaymentMethodCard: React.FC<IDashAutoAdminCustomFieldComponent> = ({
    method,
    attribute,
    resourceConfig,
}) => {
    switch (method) {
        case 'list':
            return <PaymentMethodDisplay showActions={true} />;
        case 'view':
            return <PaymentMethodDisplay showActions={false} />;
        case 'edit':
        case 'create':
        default:
            return null;
    }
};

export default PaymentMethodCard;
