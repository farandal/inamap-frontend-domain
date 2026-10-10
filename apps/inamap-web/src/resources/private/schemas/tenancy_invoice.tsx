import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import InvoiceStatusBadge from '../../../components/billing/InvoiceStatusBadge';
import InvoicePreview from '../../../components/billing/InvoicePreview';

/**
 * Schema for Tenancy Invoices (Payments)
 * API Endpoint: /api/tenancy/payments
 * 
 * Features:
 * - Status badge with visual indicators
 * - Invoice preview and download capabilities
 * - Amount and date display
 */
const tenancyInvoiceSchema: IDashAutoAdminAttribute[] = [
    // Invoice number - primary identifier
    {
        label: 'Número',
        attribute: 'invoice_number',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Status with visual badge
    {
        label: 'Estado',
        attribute: 'status',
        type: String,
        custom: true,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: InvoiceStatusBadge,
    },
    // Amount - formatted as currency
    {
        label: 'Monto',
        attribute: 'amount',
        type: Number,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Currency code (hidden in list, shown in detail)
    {
        label: 'Moneda',
        attribute: 'currency',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Document type (receipt/invoice)
    {
        label: 'Tipo',
        attribute: 'document_type',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Created/Due date
    {
        label: 'Fecha',
        attribute: 'created_at',
        type: Date,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Payment gateway used
    {
        label: 'Pasarela',
        attribute: 'payment_gateway',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Transaction ID
    {
        label: 'ID Transacción',
        attribute: 'transaction_id',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Invoice preview and download actions - for list view
    {
        label: 'Documento',
        attribute: 'invoice_preview',
        type: String,
        custom: true,
        inList: true,
        inEdit: false,
        inShow: false,
        inCreate: false,
        component: InvoicePreview,
    },
    // Invoice preview card - for show view (full display)
    {
        tab: 'Documento',
        label: 'Vista previa del documento',
        attribute: 'invoice_document',
        type: Object,
        custom: true,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: InvoicePreview,
    },
];

export default tenancyInvoiceSchema;
