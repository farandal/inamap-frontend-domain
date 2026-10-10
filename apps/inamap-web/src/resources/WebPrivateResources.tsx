/**
 * Manifiesto de recursos de inamap-web a nivel TENANCY (sin tenant activo):
 * administración de la tenancy (tenants, usuarios, suscripción, facturación),
 * los inamaps de todos sus tenants y los reportes.
 *
 * Los recursos se cargan con import() dinámico para que Vite los divida en
 * chunks.
 */
import { ResourceManifest } from 'dash-app-common';

export const WebPrivateResources: ResourceManifest = {
    tenancyResources: () => import('./private/tenancyResources'),

    // Mapas (ina-maps): con ningún tenant activo, el TenancyAdmin ve los
    // inamaps de todos sus tenants (alcance resuelto en el servidor).
    inamapResources: () => import('ina-maps/resources/inamapResources'),

    // Reportes (dash-reports): la lista la decide el registro del backend.
    reportResources: () => import('ina-maps/resources/reportResources'),
};

export default WebPrivateResources;
