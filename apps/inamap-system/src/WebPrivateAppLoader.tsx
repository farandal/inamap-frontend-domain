import React, { lazy, Suspense, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPanelSettings } from 'dash-admin-state/redux/actions/Common';
import { GlobalSmallLoader } from 'dash-boilerplate';
import Dashboard from './components/Dashboard';

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
 */
const WebPrivateAppLoader: React.FC = () => {
  const dispatch = useDispatch();
  const [resources, setResources] = React.useState<any>(null);
  const [routes, setRoutes] = React.useState<{ private: any; public: any }>({ private: null, public: null });
  const [isLoading, setIsLoading] = React.useState(true);

  // Set sidebar position to 'left' when private app loads
  useEffect(() => {
    console.log('📐 PrivateAppLoader: Setting sidebarPosition to left');
    dispatch(setPanelSettings({ sidebarPosition: 'left' }));
  }, [dispatch]);

  React.useEffect(() => {
    console.log('🔄 PrivateAppLoader: Loading admin resources...');
    
    Promise.all([
      import('./resources/WebPrivateResources').then(m => m.WebPrivateResources),
      import('./WebPrivateRoutes').then(m => ({
        private: m.dashPrivateRoutes,
        public: m.dashPublicRoutes
      }))
    ]).then(([res, rts]) => {
      console.log('✅ PrivateAppLoader: Admin resources loaded');
      setResources(res);
      setRoutes(rts);
      setIsLoading(false);
    }).catch(error => {
      console.error('❌ PrivateAppLoader: Failed to load resources:', error);
      setIsLoading(false);
    });
  }, []);

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
      <WebPrivateApp {...privateAppProps} />
    </Suspense>
  );
};

export default WebPrivateAppLoader;
