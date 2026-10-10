import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import InvoiceStatusBadge from '../../../components/billing/InvoiceStatusBadge';
import InvoiceActions from '../../../components/billing/InvoiceActions';

/**
 * Schema for Tenancy Invoices (Payments)
 * API Endpoint: /api/tenancy/payments
 */
const tenancyInvoiceSchema: IDashAutoAdminAttribute[] = [
    {
        label: 'Status',
        attribute: 'status',
        type: String,
        custom: true,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: InvoiceStatusBadge,
    },
    {
        label: 'Amount',
        attribute: 'amount',
        type: Number,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
        // Will be formatted as currency in the component
    },
    {
        label: 'Currency',
        attribute: 'currency',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Due At',
        attribute: 'created_at',
        type: Date,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Paid At',
        attribute: 'updated_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Transaction ID',
        attribute: 'provider_transaction_id',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Actions',
        attribute: 'actions',
        type: String,
        custom: true,
        inList: true,
        inEdit: false,
        inShow: false,
        inCreate: false,
        component: InvoiceActions,
    },
];

export default tenancyInvoiceSchema;
