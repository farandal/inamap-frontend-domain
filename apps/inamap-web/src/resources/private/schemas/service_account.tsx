import { IDashAutoAdminAttribute } from "dash-auto-admin";
import { SelectInput } from "react-admin";
import ServiceAccountStatusSwitch from "dash-admin/components/serviceAccount/ServiceAccountStatusSwitch";

/**
 * Schema for Service Account API Keys
 * API Endpoint: /api/system/service_accounts
 *
 * An API key is backed by a service-account user carrying the selected roles.
 * Two rules drive this schema:
 *
 *  - Tenant, name and expiration are fixed at creation (inCreate only). The
 *    backend rejects any attempt to change them, so exposing them as editable
 *    would only produce 422s.
 *  - The role set is the ONLY mutable field.
 */
const serviceAccountSchema: IDashAutoAdminAttribute[] = [
    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.name',
        attribute: 'name',
        type: String,
        // Immutable after creation.
        inEdit: false,
        validate: (value: string) => {
            if (!value) throw new Error('El nombre es requerido');
            if (value.length > 255) throw new Error('Máximo 255 caracteres');
        },
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.tenant',
        attribute: 'tenant_id',
        type: 'tenancy/tenants.name',
        multiple: false,
        pagination: false,
        component: SelectInput,
        // The key is pinned to this tenant permanently.
        inEdit: false,
        inList: true,
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.expiration',
        attribute: 'expiration',
        type: String,
        // custom + component routes this through the custom-component branch of
        // AttributeToInput. Without it the field falls back to a plain text
        // input and the choices are ignored.
        custom: true,
        component: SelectInput,
        // Only meaningful at creation; the stored expires_at is shown instead.
        inEdit: false,
        inList: false,
        inShow: false,
        componentProps: {
            // source is required by the custom-component branch.
            source: 'expiration',
            defaultValue: '30',
            // translateChoice renders the keys below through the i18n provider.
            translateChoice: true,
            choices: [
                { id: '1', name: 'serviceAccount.expiration.1' },
                { id: '7', name: 'serviceAccount.expiration.7' },
                { id: '30', name: 'serviceAccount.expiration.30' },
                { id: 'never', name: 'serviceAccount.expiration.never' },
            ],
        },
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.roles',
        attribute: 'roles',
        listAttribute: 'role_ids',
        type: 'system/role.name',
        multiple: true,
        // The only field that may change after creation.
        inList: true,
        componentProps: {
            // Server-side exclusion of System and ServiceAccountManager, so the
            // picker can never offer a role ApiKeyService would reject. Applied
            // in RolesFilter rather than here so the rule cannot drift from the
            // escalation guard. The per-actor level ceiling is already applied
            // by RoleController::applyRoleVisibilityPolicy.
            filter: { assignable_for_service_account: true },
        },
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.status',
        attribute: 'status',
        type: String,
        // Not a form field: status is changed through the dedicated
        // enable/disable endpoints so the credential is never rotated, and the
        // update contract rejects anything but role_ids anyway.
        custom: true,
        component: ServiceAccountStatusSwitch,
        inCreate: false,
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.token',
        attribute: 'masked_token',
        type: String,
        // The full credential is unrecoverable; only the prefix is stored, so
        // it is reference-only and has no place on an edit form.
        readOnly: true,
        inCreate: false,
        inEdit: false,
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.expires_at',
        attribute: 'expires_at',
        type: Date,
       
        inCreate: false,
        inEdit: false
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.last_used_at',
        attribute: 'last_used_at',
        type: Date,
      
        inCreate: false,
        inEdit: false
    },

    {
        tab: 'Datos',
        label: 'resource.tenancy.serviceAccounts.created_at',
        attribute: 'created_at',
        type: Date,
       
        inCreate: false,
        inList: false,
        inEdit: false
    },
];

export default serviceAccountSchema;
