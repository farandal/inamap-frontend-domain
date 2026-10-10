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
    // KIOSK RESOURCES (from kt-kiosk)
    // ========================================================================
    publicWebResources: () => import('./public/homeResources'),
    
};

export default WebPrivateResources;