/**
 * Subscription Plan Resource Override for INAMAP System
 * 
 * This resource configuration overrides the default subscription plan resource
 * from dash-admin to use the specialized schema with gateway sync logging.
 */
import { IDashAutoAdminResourceConfig } from "dash-auto-admin";
import { ResourceTemplate } from "dash-admin";
import { DASHAppConstants } from "dash-constants";
import { SubscriptionPlanFormatsProvider } from "dash-admin/contexts/SubscriptionPlanFormatsProvider";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import subscriptionPlanSchema from "./schemas/subscription_plan";

const drawerSettings = {
    drawer: true,
    drawerOptions: {
        view: true,
        edit: false,
        create: false,
    },
    listViewButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
    listEditButton: { props: { buttonProps: { variant: 'text', size: 'small' }, label: '' } },
};

/**
 * INAMAP-specific subscription plan resource configuration
 * with specialized audit logging that includes gateway sync events
 */
export const subscriptionPlanResource: IDashAutoAdminResourceConfig = {
    roles: [DASHAppConstants.system.SYSTEM_ROLE],
    component: ResourceTemplate,
    model: 'system/subscription-plan',
    label: 'Subscription Plans',
    group: "System",
    icon: <CardMembershipIcon />,
    trash: true,

    // Context wrapper for fetching limit formats and addon formats from backend
    contextComponent: ({ resourceConfig, mode, children }) => {
        return mode === "list" ? children : (
            <SubscriptionPlanFormatsProvider cacheSeconds={300}>
                {children}
            </SubscriptionPlanFormatsProvider>
        );
    },

    // Use our custom schema with SubscriptionPlanAuditLog
    schema: subscriptionPlanSchema,

    menu: [
        {
            title: 'All Plans',
            redirect: '/system/subscription-plan',
        },
    ],

    mainAction: {
        title: 'Create Plan',
        fn: "redirect",
        mode: "create",
        redirect: "create",
    },

    ...drawerSettings,
};

export default subscriptionPlanResource;
