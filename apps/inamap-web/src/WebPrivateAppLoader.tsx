import React, { lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setPanelSettings } from 'dash-admin-state/redux/actions/Common';
import { setResources as setReduxResources } from 'dash-admin-state/redux/actions/Resources';
import { loadResourcesFromManifest, clearResourceCache } from 'dash-app-common/components/DashResourceLoader';
import { GlobalSmallLoader } from 'dash-boilerplate';
import Dashboard from './components/Dashboard';
import { dashStorage } from 'dash-utils';
import type { TenantSwitchEventDetail } from 'dash-admin';

const WebPrivateApp = lazy(() => import('./WebPrivateApp'));
const MainAppHookComponent = lazy(() => import('./contexts/MainAppHookComponent'));
const LaravelEchoProvider = lazy(() => 
  import('dash-admin/contexts/com/LaravelEchoContext').then(m => ({ default: m.LaravelEchoProvider }))
);

/**
 * PrivateAppLoader
 * 
 * Lazy loads admin resources and routes only when authenticated user is detected.
 * This reduces initial bundle size by ~300KB by not loading admin resources 
 * for public or self-service users.
 * 
 * Loads different resource manifests depending on tenant context:
 * - Tenancy level (no active_tenant_id): Loads WebPrivateResources (tenancy admin resources)
 * - Tenant level (active_tenant_id set): Merges tenant-specific resources + routes
 * 
 * Listens for 'tenant_switch' events to reload resources when the user
 * switches between tenancy account and individual tenants.
 * 
 * Uses a reactive `tenantContext` state (instead of reading from storage inside
 * a memoized callback) so that React properly detects the change and re-runs
 * the resource-loading effect.
 */

/** Sentinel value: resource loading hasn't started yet */
const UNINITIALIZED = Symbol('UNINITIALIZED');

const WebPrivateAppLoader: React.FC = () => {
  const dispatch = useDispatch();
  const [resources, setResources] = React.useState<any>(null);
  const [routes, setRoutes] = React.useState<{ private: any; public: any }>({ private: null, public: null });
  const [isLoading, setIsLoading] = React.useState(true);
  const [switchKey, setSwitchKey] = React.useState(0); // Force remount on tenant switch

  /**
   * Tracks which tenant is active for resource loading purposes.
   * - `UNINITIALIZED` = hasn't been read from storage yet (initial state)
   * - `null` = tenancy level (no active tenant)
   * - `string` = specific tenant id
   */
  const [tenantContext, setTenantContext] = React.useState<string | null | typeof UNINITIALIZED>(UNINITIALIZED);

  // Keep a ref to know if this is the initial load vs a switch
  const isInitialLoad = useRef(true);

  // Set sidebar position to 'left' when private app loads
  useEffect(() => {
    console.log('📐 PrivateAppLoader: Setting sidebarPosition to left');
    dispatch(setPanelSettings({ sidebarPosition: 'left' }));
  }, [dispatch]);

  /**
   * On mount, read the initial tenant context from storage.
   * This handles the case where the user had a tenant selected before page reload.
   */
  useEffect(() => {
    const storedTenantId = dashStorage.getItem('active_tenant_id') || null;
    console.log(`🔄 PrivateAppLoader: Initial tenant context from storage: ${storedTenantId || 'tenancy level'}`);
    setTenantContext(storedTenantId);
  }, []);

  /**
   * Listen for tenant_switch events from TenantSwitcher.
   * Updates `tenantContext` state (which triggers the resource loading effect)
   * and increments `switchKey` to force a full remount of WebPrivateApp.
   */
  useEffect(() => {
    const handleTenantSwitch = (event: Event) => {
      const detail = (event as CustomEvent<TenantSwitchEventDetail>).detail;
      console.log('🔄 PrivateAppLoader: Tenant switch detected', detail);

      // Mark as no longer initial load
      isInitialLoad.current = false;

      // Clear current resources to force the loading guard to activate.
      // This ensures the old WebPrivateApp unmounts completely
      // before the new one mounts with different resources.
      setResources(null);
      setRoutes({ private: null, public: null });

      // Increment key to force full remount of react-admin
      setSwitchKey(prev => prev + 1);

      // Update the tenant context — this triggers the resource loading effect
      setTenantContext(detail.tenantId);
    };

    window.addEventListener('tenant_switch', handleTenantSwitch);
    return () => window.removeEventListener('tenant_switch', handleTenantSwitch);
  }, []);

  /**
   * Resource loading effect — reactive to `tenantContext` changes.
   * Loads different resource manifests depending on whether a tenant is active.
   */
  useEffect(() => {
    // Skip if not initialized yet
    if (tenantContext === UNINITIALIZED) return;

    const isTenantLevel = !!tenantContext;
    console.log(`🔄 PrivateAppLoader: Loading resources (tenant level: ${isTenantLevel}, tenant: ${tenantContext || 'none'})...`);
    setIsLoading(true);

    if (isTenantLevel) {
      // Tenant-level: load ONLY tenant-specific resources (not merged with base)
      // Base manifest already contains the same keys - merging produces identical resources
      Promise.all([
        import('./resources/WebTenantPrivateResources').then(m => m.WebTenantPrivateResources),
        import('./WebPrivateRoutes').then(m => ({
          private: m.dashPrivateRoutes,
          public: m.dashPublicRoutes
        })),
        import('./PrivateTenantRoutes').then(m => m.default),
      ]).then(async ([tenantManifest, baseRts, tenantRoutes]) => {
        console.log('🔄 PrivateAppLoader: [TENANT] Manifest loaded', {
          tenantKeys: Object.keys(tenantManifest),
        });

        // Resolve tenant manifest to actual resource configs
        clearResourceCache(tenantManifest);
        const resolvedResources = await loadResourcesFromManifest(tenantManifest);
        console.log('✅ PrivateAppLoader: [TENANT] Resolved', resolvedResources.length, 'resources', {
          models: resolvedResources.map(r => r.model),
          groups: [...new Set(resolvedResources.map(r => r.group))],
        });

        // Dispatch resolved resources directly to Redux so the menu updates immediately
        dispatch<any>(setReduxResources(resolvedResources));
        console.log('📤 PrivateAppLoader: [TENANT] Dispatched', resolvedResources.length, 'resources to Redux');

        // Merge routes: tenant private routes are appended to base private routes
        const mergedPrivateRoutes = () => [
          ...baseRts.private(),
          ...tenantRoutes(),
        ];
        // Pass resolved array (not manifest) so WebPrivateApp uses it directly
        setResources(resolvedResources);
        setRoutes({ private: mergedPrivateRoutes, public: baseRts.public });
        setIsLoading(false);
      }).catch(error => {
        console.error('❌ PrivateAppLoader: [TENANT] Failed to load resources:', error);
        setIsLoading(false);
      });
    } else {
      // Tenancy-level: load only base resources
      Promise.all([
        import('./resources/WebPrivateResources').then(m => m.WebPrivateResources),
        import('./WebPrivateRoutes').then(m => ({
          private: m.dashPrivateRoutes,
          public: m.dashPublicRoutes
        }))
      ]).then(async ([manifest, rts]) => {
        console.log('🔄 PrivateAppLoader: [TENANCY] Manifest loaded', {
          keys: Object.keys(manifest),
        });

        // Resolve manifest to actual resource configs
        clearResourceCache(manifest);
        const resolvedResources = await loadResourcesFromManifest(manifest);
        console.log('✅ PrivateAppLoader: [TENANCY] Resolved', resolvedResources.length, 'resources', {
          models: resolvedResources.map(r => r.model),
          groups: [...new Set(resolvedResources.map(r => r.group))],
        });

        // Dispatch resolved resources directly to Redux so the menu updates immediately
        dispatch<any>(setReduxResources(resolvedResources));
        console.log('📤 PrivateAppLoader: [TENANCY] Dispatched', resolvedResources.length, 'resources to Redux');

        // Pass resolved array (not manifest)
        setResources(resolvedResources);
        setRoutes(rts);
        setIsLoading(false);
      }).catch(error => {
        console.error('❌ PrivateAppLoader: Failed to load resources:', error);
        setIsLoading(false);
      });
    }
  }, [tenantContext]);

  const privateAppProps = useMemo(() => ({
    customResources: resources,
    customPublicRoutes: routes.public,
    customPrivateRoutes: routes.private,
    dashboard: Dashboard, // Dashboard component renders at "/" instead of redirecting
    AdminHook: () => <><MainAppHookComponent /></>,
    customEchoProvider: ({ manager, children }: any) => (
      <LaravelEchoProvider manager={manager}>
          {children}
      </LaravelEchoProvider>
    )
  }), [resources, routes]);

  if (isLoading || !resources || !routes.private || !routes.public) {
    return <GlobalSmallLoader message="Loading admin resources..." />;
  }

  return (
    <Suspense fallback={<GlobalSmallLoader message="Loading admin panel..." />}>
      <WebPrivateApp key={`private-app-${switchKey}`} {...privateAppProps} />
    </Suspense>
  );
};

export default WebPrivateAppLoader;
