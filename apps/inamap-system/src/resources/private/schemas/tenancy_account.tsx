import { IDashAutoAdminAttribute } from 'dash-auto-admin';
import { SelectInput } from 'react-admin';
import TenancyAccountManagement from '@app/components/account/TenancyAccountManagement';
import TenancyAccountDelete from '@app/components/account/TenancyAccountDelete';
import TenancyDataExport from '@app/components/account/TenancyDataExport';


/**
 * Schema for Tenancy Account management
 * API Endpoint: /api/tenancy/tenancy
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
    {
        tab: 'Account',
        label: 'Currency',
        attribute: 'settings.currency',
        type: String,
        inList: false,
        inEdit: true,
        inShow: true,
        inCreate: true,
        fieldProps: {
            helperText: "Default currency code (e.g., USD, EUR)"
        }
    },
    {
        tab: 'Account',
        label: 'Timezone',
        attribute: 'settings.timezone',
        type: String,
        inList: false,
        inShow: true,
        inEdit: false,
        inCreate: false,
    },
    {
        tab: 'Account',
        label: 'Timezone',
        attribute: 'settings.timezone',
        type: String,
        custom: true,
        inList: false,
        inShow: false,
        inEdit: true,
        inCreate: true,
        component: SelectInput,
        componentProps: {
            source: 'settings.timezone',
            choices: [
                { id: 'America/Santiago', name: 'America/Santiago' },
                { id: 'UTC', name: 'UTC' },
                { id: 'America/New_York', name: 'America/New_York' },
                { id: 'Europe/London', name: 'Europe/London' },
            ],
            defaultValue: 'UTC'
        }
    },
    {
        tab: 'Trial',
        label: 'Trial Ends At',
        attribute: 'trial_ends_at',
        type: Date,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Trial',
        label: 'Is On Trial',
        attribute: 'is_on_trial',
        type: Boolean,
        inList: true,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    {
        tab: 'Trial',
        label: 'Trial Days Remaining',
        attribute: 'trial_days_remaining',
        type: Number,
        inList: false,
        inEdit: false,
        inShow: true,
        inCreate: false,
    },
    // Account Management Section - Only visible in edit mode
    // Combined component (shows both delete and export in one tab)
    /*{
        tab: 'Account Management',
        label: 'Account Management',
        attribute: 'account_management',
        type: 'custom',
        inList: false,
        inEdit: true,
        inShow: false,
        inCreate: false,
        component: TenancyAccountManagement,
    },*/
    // Alternative: Separate tabs for delete and export
    // Uncomment these and comment the above to use separate tabs
    
    /*{
        tab: 'Delete Account',
        label: 'Delete Account',
        attribute: 'delete_account',
        type: 'custom',
        inList: false,
        inEdit: true,
        inShow: false,
        inCreate: false,
        component: TenancyAccountDelete,
        componentProps: {
            variant: 'card',
        },
    },*/
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
