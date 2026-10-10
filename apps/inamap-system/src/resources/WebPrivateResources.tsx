/**
 * Resources
 * 
 * Resource manifest for the INAMAP application.
 * This file uses the refactored kt-* packages for all domain-specific resources.
 * 
 * Resources are loaded dynamically using import functions,
 * allowing Vite to properly analyze and code-split them.
 */

import { ResourceManifest } from 'dash-app-common';
//import MallResources from './kt-mall/resources/MallResources';
// ============================================================================
// RESOURCE MANIFEST
// ============================================================================
// All resources are imported from kt-* packages for proper modularization.

export const WebPrivateResources: ResourceManifest = {

    // ========================================================================
    // SYSTEM RESOURCES (from dash-admin)
    // ========================================================================
    // Core system resources from dash-admin (users, roles, permissions, etc.)
    systemResources: () => import('dash-admin/systemResources'),

    // ========================================================================
    // SUBSCRIPTION PLAN OVERRIDE (INAMAP-specific)
    // ========================================================================
    // Overrides the default subscription plan resource with specialized audit logging
    // that includes gateway sync events (Flow, Rebill, etc.)
    subscriptionPlanResource: () => import('./private/subscriptionPlanResource'),

    tenancyResources: () => import('./private/tenancyResources'),

    // ========================================================================
    // PRE-RELEASE SIGNUPS (landing page interest capture, system admin only)
    // ========================================================================
    prereleaseSignupResource: () => import('./private/prereleaseSignupResource'),

    // ========================================================================
    // INAMAPS (ina-maps) — el administrador de sistema ve todos los inamaps
    // de todas las tenancies (alcance resuelto en el servidor) y los reportes.
    // ========================================================================
    inamapResources: () => import('ina-maps/resources/inamapResources'),
    reportResources: () => import('ina-maps/resources/reportResources'),

};

export default WebPrivateResources;
