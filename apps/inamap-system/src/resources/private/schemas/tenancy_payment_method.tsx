import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import PaymentMethodCard from '../../../components/billing/PaymentMethodCard';

/**
 * Schema for Tenancy Payment Methods
 * API Endpoint: /api/tenancy/payment-methods
 * 
 * NOTE: This is an outline implementation. Full payment gateway integration
 * will be implemented when specific gateways (Stripe, PayPal, etc.) are configured.
 */
const tenancyPaymentMethodSchema: IDashAutoAdminAttribute[] = [
    {
        label: 'Payment Method',
        attribute: 'payment_method_display',
        type: String,
        custom: true,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: PaymentMethodCard,
    },
    {
        label: 'Type',
        attribute: 'type',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Last Four',
        attribute: 'last_four',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Brand',
        attribute: 'brand',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Default',
        attribute: 'is_default',
        type: Boolean,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Expires At',
        attribute: 'expires_at',
        type: Date,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Gateway',
        attribute: 'gateway_name',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
];

export default tenancyPaymentMethodSchema;
