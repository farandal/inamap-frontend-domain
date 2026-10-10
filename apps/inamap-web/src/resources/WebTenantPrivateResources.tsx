/**
 * Manifiesto de recursos de inamap-web a nivel TENANT: lo que ve un
 * TenancyAdmin después de cambiar a un tenant (TenantSwitcher), igual a lo
 * que ve el propio tenant. El alcance lo da el encabezado X-Tenant-Id.
 */
import { ResourceManifest } from 'dash-app-common';

export const WebTenantPrivateResources: ResourceManifest = {
    inamapResources: () => import('ina-maps/resources/inamapResources'),
    reportResources: () => import('ina-maps/resources/reportResources'),
};

export default WebTenantPrivateResources;
