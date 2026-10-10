import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import TenancyDataExport from '@app/components/account/TenancyDataExport';

import { 
    TenancyLanguageSelector, 
    TenancyCurrencySelector, 
    TenancyTimezoneSelector 
} from '@app/components/account/TenancyRegionalSelectors';
import { TenancySubscriptionInfo } from '@app/components/account';



/**
 * Schema for Tenancy Account management
 * API Endpoint: /api/tenancy/tenancy
 * 
 * Trial information is now calculated from the current_subscription relationship,
 * not stored directly on the tenancy model.
 */
const tenancyAccountSchema: IDashAutoAdminAttribute[] = [
    {
        tab: 'Account',
        label: 'Public Name',
        attribute: 'public_name',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'Legal Name',
        attribute: 'legal_name',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'Public ID',
        attribute: 'public_id',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'Email',
        attribute: 'email',
        type: String,
        inList: true,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'URL',
        attribute: 'url',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'Slug',
        attribute: 'slug',
        type: String,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Regional Settings - Use custom components that fetch from system config
    {
        tab: 'Account',
        label: 'Primary Language',
        attribute: 'primary_language',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: true,
        custom: true,
        component: TenancyLanguageSelector,
    },
    {
        tab: 'Account',
        label: 'Primary Currency',
        attribute: 'primary_currency',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: true,
        custom: true,
        component: TenancyCurrencySelector,
    },
    {
        tab: 'Account',
        label: 'Primary Timezone',
        attribute: 'primary_timezone',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: true,
        custom: true,
        component: TenancyTimezoneSelector,
    },

    // Subscription & Trial Information - Displayed from current_subscription relationship
    // This is a custom component that reads from the current_subscription object
    {
        tab: 'Subscription',
        label: 'Subscription & Trial',
        attribute: 'current_subscription',
        type: 'custom',
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
        component: TenancySubscriptionInfo,
    },
    
    // Data Export Section
    {
        tab: 'Data Export',
        label: 'Data Export',
        attribute: 'data_export',
        type: 'custom',
        inList: false,
        inEdit: true,
        inShow: false,
        inCreate: false,
        component: TenancyDataExport,
        componentProps: {
            variant: 'card',
            showHistory: true,
        },
    },
    
];

export default tenancyAccountSchema;
