import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import { SelectInput } from 'react-admin';
import CurrentSubscription from '../../../components/billing/CurrentSubscription';

/**
 * Schema for Tenancy Subscription management
 * API Endpoint: /api/tenancy/subscriptions
 */
const tenancySubscriptionSchema: IDashAutoAdminAttribute[] = [
    {
        tab: 'Current Plan',
        label: 'Current Subscription',
        attribute: 'current_subscription',
        type: String,
        custom: true,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: CurrentSubscription,
    },
    {
        label: 'Current Plan',
        attribute: 'effective_plan.name',
        listAttribute: 'effective_plan.name',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
        // Fallback to subscription_plan.name if effective_plan is null (backward compatibility)
        /*render: (record: any) => {
            return record?.effective_plan?.name || record?.subscription_plan?.name || 'N/A';
        },*/
    },
    {
        label: 'Subscription State',
        attribute: 'subscription_state',
        type: String,
        component: SelectInput,
        componentProps: {
            choices: [
                { id: 'trial', name: 'Trial' },
                { id: 'active', name: 'Active' },
                { id: 'past_due', name: 'Past Due' },
                { id: 'suspended', name: 'Suspended' },
                { id: 'canceled', name: 'Canceled' },
            ],
            disabled: true,
        },
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Status (Legacy)',
        attribute: 'status',
        type: String,
        component: SelectInput,
        componentProps: {
            choices: [
                { id: 'trial', name: 'Trial' },
                { id: 'active', name: 'Active' },
                { id: 'past_due', name: 'Past Due' },
                { id: 'cancelled', name: 'Cancelled' },
            ],
            disabled: true,
        },
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Billing Period',
        label: 'Period Start',
        attribute: 'current_period_start',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Billing Period',
        label: 'Period End',
        attribute: 'current_period_end',
        type: Date,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Trial',
        label: 'Trial Ends',
        attribute: 'trial_ends_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Pending Changes',
        label: 'Pending Plan',
        attribute: 'pending_plan.name',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Pending Changes',
        label: 'Change Type',
        attribute: 'pending_plan_change_type',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Pending Changes',
        label: 'Effective At',
        attribute: 'pending_plan_effective_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Cancels At',
        attribute: 'cancels_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Cancellation Reason',
        attribute: 'cancellation_reason',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Cancelled At (Legacy)',
        attribute: 'cancelled_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Payment Gateway',
        attribute: 'payment_gateway',
        type: String,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
];

export default tenancySubscriptionSchema;
