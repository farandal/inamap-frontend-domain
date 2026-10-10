import { IDashAutoAdminResourceConfig } from "dash-auto-admin";
import ResourceTemplate from "dash-admin/templates/ResourceTemplate";
import React, { lazy } from "react";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import StoreIcon from "@mui/icons-material/Store";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

// Schemas
import tenancyAccountSchema from "./schemas/tenancy_account";
import tenancySubscriptionSchema from "./schemas/tenancy_subscription";
import tenancyInvoiceSchema from "./schemas/tenancy_invoice";
import tenancyPaymentMethodSchema from "./schemas/tenancy_payment_method";
import tenancyTenantSchema from "./schemas/tenancy_tenant";
import serviceAccountSchema from "./schemas/service_account";
import ApiKeyRevealContent from "dash-admin/components/serviceAccount/ApiKeyRevealDialog";

// Custom Components
import TenancySubscriptionList from "../../components/billing/TenancySubscriptionList";
import TenancyTenantListHeader from "../../components/tenancy/TenancyTenantListHeader";
import AccountList from "@app/components/account/AccountList";
import GatewayCallback from "../../components/billing/GatewayCallback";
import PaymentMethodsPage from "../../components/billing/PaymentMethodsPage";
import TenancySubscriptionContext from "../../components/tenancy/TenancySubscriptionContext";
import { Route } from "react-router-dom";
import { DASHAppConstants } from "dash-constants";
import Avatar from "dash-admin/components/avatar/Avatar";
import { SelectInput } from "react-admin";
import Person from "@mui/icons-material/Person";

import { RutValidatorWithoutDots, SystemRequestsCache } from "dash-admin";


const TableContainer = lazy(() => import('@mui/material/TableContainer'));
/**
 * Tenancy Resources for the Private Web App
 * 
 * These resources manage tenancy account and billing features:
 * - Account: Tenancy settings and configuration 
 * - Subscription: Plan management, upgrades/downgrades
 * - Invoices: Payment history
 * - Payment Methods: Stored payment methods (outlined)
 */

const drawerSettings = {
    drawer: true,
    drawerOptions: {
        view: true,
        edit: true,
        create: false,
    },
    listViewButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
    listEditButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
};



const tenancyResources: IDashAutoAdminResourceConfig[] = [
    // Dashboard / Home
    /*{
        roles: ["*"],
        model: "dashboard",
        listComponent: (resourceConfig) => { return <>Dashboard</>},
        group: "dashboard",
        path: "/",
        schema: [],
        label: "Home",
        icon: <DashboardIcon />,
        // Dashboard is handled by the app layout
    },*/

    // Feature 1: Tenancy Account
    {
        roles: ["TenancyAdmin", "System"],
        component: ResourceTemplate,
        model: "tenancy",
        group: "resource.tenancy.groups.account",
        //path: "/tenancy/account",
        schema: tenancyAccountSchema,
        label: "resource.tenancy.account.label",
        icon: <BusinessIcon />,
        //listComponent: (resourceConfig) => <AccountList resourceConfig={resourceConfig} />,
        dataGridComponent: AccountList,
        
        // Single record mode - tenancy admins only see their own tenancy
        create: false,
      
        mutationMode: "pessimistic",
        redirectAfterUpdate: false,
        
        ...drawerSettings,
    },

    // Feature 2: Subscription Management
    {
        roles: ["TenancyAdmin", "System"],
        component: ResourceTemplate,
        //contextComponent: TenancySubscriptionContext,
        model: "tenancy/subscriptions",
        group: "resource.tenancy.groups.account",
        path: "/tenancy/subscription",
        schema: tenancySubscriptionSchema,
        label: "resource.tenancy.subscription.label",
        icon: <SubscriptionsIcon />,
        
        // Custom list component showing current plan + all plans
        listComponent: (resourceConfig) => {
            
        
            return <TenancySubscriptionContext resourceConfig={resourceConfig} mode="list" ><TenancySubscriptionList resourceConfig={resourceConfig} /></TenancySubscriptionContext>
        
        },

        // Include relationships in all API calls
        listProps: {
            queryOptions: {
                meta: {
                    include: 'subscriptionPlan,effectivePlan,pendingPlan',
                },
            },
        },
        
        view: true,
        create: false,
        edit: false,
    },

    // Feature 3: Invoices
    {
        roles: ["TenancyAdmin", "System"],
        component: ResourceTemplate,
        model: "tenancy/payments",
        group: "resource.tenancy.groups.account",
        path: "/tenancy/invoices",
        schema: tenancyInvoiceSchema,
        label: "resource.tenancy.invoices.label",
        icon: <ReceiptIcon />,
        
        view: true,
        create: false,
        edit: false,
        delete: false,

        listDeleteButton: { enabled: false },
        listEditButton: { enabled: false },

    
        // DataGrid settings for invoice list
        dataGridProps: {
            stickyHeader: true,
            rowClick: false
        },
        
        ...drawerSettings,
    },

    // Feature 4: Payment Methods
    {
        roles: ["TenancyAdmin", "System"],
        component: ResourceTemplate,
        model: "tenancy/payment-methods",
        group: "resource.tenancy.groups.account",
        path: "/tenancy/payment-methods",
        schema: tenancyPaymentMethodSchema,
        label: "resource.tenancy.payment_methods.label",
        icon: <PaymentIcon />,
        
        // Custom list component showing gateway selector or connected payment method
        listComponent: (resourceConfig) => <PaymentMethodsPage resourceConfig={resourceConfig} />,
        
        // Custom route for gateway callback
        customRoutes: (resourceConfig) => {
            return <Route
                path={"/" + resourceConfig.model + "/callback"}
                element={<GatewayCallback />}
            />
        },
        
        view: true,
        create: false, // Creation handled by gateway integration
        edit: false,
    },

    // Feature 5: Tenant Management
    {
        roles: ["TenancyAdmin", "System"],
        component: ResourceTemplate,
        model: "tenancy/tenants",
        group: "resource.tenancy.groups.system",
        path: "/tenancy/tenants",
        schema: tenancyTenantSchema,
        config: { tenant_selector_model: 'tenant/tenant'}, // custom config resourceConfig dependant to let the TenantMarketplaceSelector in the schema know which model to use for fetching tenant data
        label: "resource.tenancy.tenants.label",
        icon: <StoreIcon />,
        
        // Custom header component showing plan limits
        //listHeaderComponent: (resourceConfig) => <TenancyTenantListHeader resourceConfig={resourceConfig} />,
        
        
        // CRUD settings with plan limit enforcement
        view: true,
        create: true,
        edit: true,
        delete: true,
        
        menu: [
            {
                title: "resource.tenancy.tenants.menu_all",
                redirect: "/tenancy/tenants",
            },
        ],
        
        mainAction: {
            title: "resource.tenancy.tenants.main_action",
            fn: "redirect",
            mode: "create",
            redirect: "create",
        },
        
        toolbarCreateButton: { enabled: false },

         syncTabsWithLocation: false,
        
              contextComponent: ({ resourceConfig, mode, children }) => {
                    console.log("TenantSettingsFormatsProvider", resourceConfig, mode);
                    return mode === "list" ? children : <SystemRequestsCache
                        cacheKey="tenant_settings_formats_cache"
                        apiUrl="tenancy/tenants/systemSettingFormats"
                        cacheSeconds={300}
                    >{children}</SystemRequestsCache>
                },
           
        
        referenceFilters: [
            {
                id: "name",
                label: "Name",
                source: "name",
                reference: null,
                optionText: null,
                alwaysOn: true,
            },
        ],
        
        // Handle plan limit errors on create
        onError: (mode, error) => {
            if (mode === 'create' && error?.body?.limit_info) {
                // Plan limit exceeded - show upgrade prompt
                console.warn('Plan limit reached:', error.body.limit_info);
            }
        },
        
        mutationMode: "pessimistic",
        saveButtonAlwaysEnabled: true,
        redirectAfterCreate: true,
        redirectAfterUpdate: false,
        
        dataGridProps: {
            stickyHeader: true,
            rowClick:false,
        },

          postFormatter: (params) => {

            /* Hack for the attributes empty post array issue [], 
            this is because the object is sent as an array with keys. invalid javascript array.
            */
            if(Array.isArray(params.attributes)) {
            params.attributes = Object.fromEntries(Object.entries(params.attributes).map(([key, value]) => [key.replace(/^\d+$/, ''), value]));
                
            return params;
        }

        /*if(Array.isArray(params.settings)) {
            params.settings = Object.fromEntries(Object.entries(params.settings).map(([key, value]) => [key.replace(/^\d+$/, ''), value]));
           
        }
        if (params.systemMarketplaces)
            params.system_marketplace_ids = params.systemMarketplaces.map(
                (item) => item.id
            );
        if (params.systemPointOfSales)
            params.system_point_of_sale_ids = params.systemPointOfSales.map(
                (item) => item.id
            );*/

        return params;
    },
        
       /* ...drawerSettings,
        drawerOptions: {
            view: false,
            edit: false,
            create: false,
        },
        
        */
        listViewButton: { enabled: false },

        /*listDeleteButton: {
            confirm: true,
            props: { buttonProps: { variant: 'text', size: 'small' }, label: '' },
        },*/
    },


     {
           roles: ["TenancyAdmin"],
            component: ResourceTemplate,
            trash: true,
            isFormData: true,
            model: 'tenancy/users',
            //group: 'resource.groups.system_resources',
             group: "resource.tenancy.groups.system",
            label: 'resource.system.users.label',
            refreshAfter: true,
            referenceFilters: [
                // TODO: Cuando se cambia el cliente se debn mostrar sólo los CP de este filtro
                {
                    id: 'search',
                    label: 'resource.system.users.filter_search',
                    source: 'q',
                    reference: null,
                    optionText: '', // field from the model
                    alwaysOn: true,
                },
            ],
            schema: [
                {
                    tab: 'Datos Usuario',
                    attribute: 'avatar',
                    listAttribute: 'image_path',
                    label: 'Imágen Usuario',
                    type: String,
                    sortable: true,
                    inEdit: true,
                    inCreate: true,
                    inShow: true,
                    inList: false,
                    custom: true,
                    component: Avatar,
                    processor: 'File',
                },
                {
                    label: 'Nombre',
                    attribute: 'name',
                    type: String,
                    tab: 'Datos Usuario',
                    //validate: (name: string) => (name && name.length >= 3 ? undefined : <div>Name is too short</div>)
                },
                {
                    label: "Apellido",
                    attribute: "lastname",
                    type: String,
                    tab: "Datos Usuario",
                    //validate: (name: string) => (name && name.length >= 3 ? undefined : <div>Name is too short</div>)
                },
                {
                    tab: 'Datos Usuario',
                    attribute: 'public_id',
                    label: 'Rut',
                    type: String,
                    fieldProps: { required: true/*, validate: [required()],*/, showDiv: true },
                    slotProps: { input: { fullWidth: true, autoComplete: "off" } },
                    sortable: true,
                    inEdit: true,
                    inCreate: true,
                    inShow: true,
                    inList: false,
                    validate: (value) => {
    
                        if (!value) throw Error('El campo es requerido');
    
                        if (!RutValidatorWithoutDots(value)) {
                            throw Error('El Rut es inválido');
                        }
                    }
                },
                {
                    label: 'Email',
                    attribute: 'email',
                    type: String,
                    tab: 'Datos Usuario',
                    slotProps: { input: { fullWidth: true, "data-testid": "email-input" } },
                    //validate: (email: string) => (email && email.indexOf('@') > 0 ? undefined : 'Invalid email')
                },
                {
                    label: 'Contraseña',
                    attribute: 'password',
                    type: String,
                    isPassword: true,
                    slotProps: { input: { fullWidth: true, autoComplete: "new-password" } },
                    inList: false,
                    tab: 'Contraseña',
                    validate: (password: string) => {
                        if (password && password.length < 6 && password.length > 1) {
                            throw Error('Min 6 caracteres');
                        }
                    },
                },
                {
                    label: 'Confirmar Contraseña',
                    attribute: 'password_confirmation',
                    type: String,
                    isPassword: true,
                    slotProps: { input: { fullWidth: true, autoComplete: "new-password" } },
                    inList: false,
                    tab: 'Contraseña',
                    validate: (password: string, values: any) => {
    
                        if (values.password !== "" && (values.password !== password)) {
                            throw Error('Contraseñas no coinciden.');
                        }
                    },
                },
                {
                    // @TODO Solo mostrar cuando se está creando:
                    label: 'Genear Contraseña Aleatorea Automáticamente',
                    attribute: 'generate_password',
                    type: Boolean,
                    inList: false,
                    tab: 'Contraseña',
                },
                {
                    tab: 'Datos Usuario',
                    label: 'Roles',
                    attribute: 'roles',
                    listAttribute: 'role_ids',
                    type: 'system/role.name',
                    //type: Object,
                    // TODO Agregar un filtro, solo para traer los roles de cliente.
                    //pagination: false,
                    multiple: true,
                    inList: false,
                    inShow: false,
                    //custom: true,
                    //componentProps:{ options: {fullwidth: true} },
                    //component: SelectArrayInput,
                    //searchField: "subdomain"
                },
                {
                    tab: 'Datos Usuario',
                    label: 'Roles',
                    attribute: 'roles',
                    listAttribute: 'role_ids',
                    type: 'system/role.name',
                    fieldProps: { linkType: false },
                    //type: Object,
                    // TODO Agregar un filtro, solo para traer los roles de cliente.
                    //pagination: false,
                    multiple: true,
                    inEdit: false,
                    inCreate: false,
    
                    //custom: true,
                    //componentProps:{ options: {fullwidth: true} },
                    //component: ReferenceArrayField,
                    //searchField: "subdomain"
                },
                {
                    tab: 'Datos Usuario',
                    label: 'Cliente',
                    attribute: 'tenant_id',
                    //listAttribute: 'name',
                    type: 'system/tenant.name',
             
                    //type: Object,
                    // TODO Agregar un filtro, solo para traer los roles de cliente.
                    pagination: false,
                    multiple: false,
                    //custom: true,
                    //componentProps: {multiple:false},
                    //componentProps: { options: {fullwidth: true} },
                    component: SelectInput,
                    fieldProps: {
                        allowEmpty: true,  // Allow empty selection
                        emptyText: 'Sin cliente', // Text for empty option
                        
                    },
                    componentProps: {
                        link: false,
                        parse: (value: any) => {
                            console.log('Parsing tenant_id value:', value); // Debug log
                            // Convert empty string or falsy values to null
                            if (value === '' || value === undefined || value === 'null') {
                                console.log('Converting to null');
                                return null;
                            }
                            // Convert string numbers to actual numbers
                            if (typeof value === 'string' && !isNaN(Number(value))) {
                                const numValue = Number(value);
                                console.log('Converting to number:', numValue);
                                return numValue;
                            }
                            console.log('Returning original value:', value);
                            return value;
                        },
                        format: (value: any) => {
                            console.log('Formatting tenant_id value:', value); // Debug log
                            // Format null/undefined as empty string for display
                            if (value === null || value === undefined) {
                                return '';
                            }
                            return value;
                        }
                    },
                    processor: 'Null',
    
                },
                {
                    attribute: 'active',
                    type: Boolean,
                    inList: true,
                    label: 'Activo',
                    tab: 'Datos Usuario',
                    processor: 'Boolean',
                },
                /*{
                  attribute: 'avatar',
                  listAttribute: 'system/userclients.avatar',
                  type: ImageInput, // TODO: el componente no muestra la imágen
                  inList: false,
                  label: 'Imágen',
                  tab: 'Datos Usuario',
                  processor: 'RawFile',
                  //validate: (password: string) => (password && password.length >= 6 ? undefined : <div>Password is too short</div>)
              },*/
            ],
            //references: [{ reference: 'roles', target: 'role', schema: rolesSchema }]
            //references: [{ reference: 'roles', target: 'id', schema: roleSchema }],
            icon: <Person />,
            redirectAfterUpdate: false,
            showDialogAfterSubmit: true,
            showNotifyAfterSubmit: true,
            menu: [
                {
                    title: 'resource.system.users.menu_list',
                    redirect: '/tenancy/users',
                },
                {
                    title: "🗑",
                    redirect: "/tenancy/users/trash",
                }
            ],
            //{
            //    title: "🗑",
            //    redirect: "/trash/admin/user",
            //}],
            mainAction: {
                title: 'resource.system.users.main_action',
                // type: "ghost",
                redirect: '/tenancy/users/create',
            },
            mutationMode: 'pessimistic',
            // isFormData: true,
            dataGridProps: { stickyHeader: true, rowClick: false },
            dataGridWrapper: (props: any) => (
                <TableContainer sx={{ maxHeight: 800 }}>{props.children}</TableContainer>
            ),
            formPostFormatter: (params, form) => {
                return form;
            },
            /*postFormatter: (params, method) => {
              
                if (method === 'update') {
                    params._method = 'PUT';
                }
                params.role_id = params.role_ids ? params.role_ids[0] : null;
    
                // Handle tenant_id properly - ensure it's null when not selected
                if (params.tenant_id === '' || params.tenant_id === undefined || params.tenant_id === 'null') {
                    params.tenant_id = null;
                } else if (params.tenant_id && typeof params.tenant_id === 'string') {
                    // Convert string to number if it's a valid number
                    const numValue = Number(params.tenant_id);
                    if (!isNaN(numValue)) {
                        params.tenant_id = numValue;
                    }
                }
    
                console.log('Processed params:', params); // Debug log
    
                return params;
            },*/
            ...drawerSettings,
        },

    // Feature: Service Accounts (API Keys)
    //
    // Lives under /api/system/service_accounts because that route group runs
    // AccessMiddleware, so the ServiceAccountManager permission set is enforced
    // at the route layer. It is NOT System-Admin-only: the backend scopes
    // non-admin actors down to their own tenancy/tenant.
    {
        roles: ["ServiceAccountManager", "System"],
        component: ResourceTemplate,
        model: "system/service_accounts",
        group: "resource.tenancy.groups.account",
        path: "/tenancy/service-accounts",
        schema: serviceAccountSchema,
        label: "resource.tenancy.serviceAccounts.label",
        icon: <VpnKeyIcon />,

        view: false,
        create: true,
        edit: true,

        // create:true alone does not render the toolbar button - ToolbarCreateButton
        // requires an explicit opt-in (see dash-admin/systemResources.tsx precedent).
        toolbarCreateButton: { enabled: true },

        mutationMode: "pessimistic",

        // The API returns the plaintext key exactly once, on create. Replace the
        // generic "created" dialog with the reveal so the operator can copy it —
        // there is no way to recover it afterwards.
        //
        // Cast: `createSuccessDialog` exists in dash-frontend-core source (used
        // at runtime via LINK_DASH_CORE aliasing) but not yet in the published
        // @dashadmin/dash-admin typings. Drop the cast once dash-admin is
        // republished and the dependency bumped.
        ...({
            createSuccessDialog: (data: any) =>
                data?.plain_text_token
                    ? {
                          // Translated by the dialog service; core ships the key.
                          title: "serviceAccount.reveal.title",
                          content: (
                              <ApiKeyRevealContent
                                  token={data.plain_text_token}
                                  name={data.name}
                              />
                          ),
                      }
                    : null,
        } as any),

        ...drawerSettings,

        drawer: true,
        
        listViewButton:false,
        listEditButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },

        drawerOptions: {
            view: false,
            // Creation returns the plaintext key exactly once, so it needs the
            // full page and the reveal dialog rather than a drawer.
            create: false,
            edit: true,
        },
        dataGridProps: {
            rowClick:false,
            stickyHeader: false
         }
    },

];

export default tenancyResources;