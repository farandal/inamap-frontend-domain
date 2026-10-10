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
        label: 'Plan',
        attribute: 'subscription_plan.name',
        listAttribute: 'subscription_plan.name',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        label: 'Status',
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
        label: 'Cancelled At',
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
