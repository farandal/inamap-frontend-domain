/**
 * WebPublicAppLoader
 * 
 * OPTIMIZED: Simplified loader for the public app.
 * The public app routes are loaded directly - no need for dynamic resource loading.
 * This keeps the public landing page lean and fast.
 */
import React, { lazy, Suspense } from 'react';
import GlobalSmallLoader from './dash-extensions/components/GlobalSmallLoader';

// Lazy load the public app component
const WebPublicApp = lazy(() => import('./WebPublicApp.light'));

/**
 * PublicAppLoader
 * 
 * Simple loader for the public (unauthenticated) landing page.
 * No admin resources or heavy dependencies are loaded here.
 */
const WebPublicAppLoader: React.FC = () => {
    return (
        <Suspense fallback={<GlobalSmallLoader message="Loading..." />}>
            <WebPublicApp />
        </Suspense>
    );
};

export default WebPublicAppLoader;
