/**
 * Subscription Plan Schema Override for INAMAP System
 * 
 * This schema extends the base subscription plan schema from dash-admin
 * with project-specific components like the SubscriptionPlanAuditLog
 * that includes gateway sync event visualization.
 */
import { IDashAutoAdminAttribute } from "dash-auto-admin";
import SubscriptionPlanAuditLog from "../../../components/billing/SubscriptionPlanAuditLog";

// Import the base schema from dash-admin
import baseSubscriptionPlanSchema from 'dash-admin/schemas/subscriptionPlan';

/**
 * Override the Audit tab to use the specialized SubscriptionPlanAuditLog
 * that shows both standard audit logs AND gateway sync events
 */
const subscriptionPlanSchema: IDashAutoAdminAttribute[] = baseSubscriptionPlanSchema.map(field => {
    // Override the audit_logs field to use our specialized component
    if (field.attribute === 'audit_logs') {
        return {
            ...field,
            component: SubscriptionPlanAuditLog,
            fieldProps: {
                ...field.fieldProps,
                helperText: 'View all changes and gateway sync events for this subscription plan',
            },
        };
    }
    return field;
});

export default subscriptionPlanSchema;
