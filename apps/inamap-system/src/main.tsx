/**
 * INAMAP Application Entry Point
 * 
 * OPTIMIZED: This entry point has been restructured to minimize the initial bundle size.
 * - Uses lightweight AppWrapperLight instead of react-admin dependent AppWrapper
 * - Heavy modules (Redux, dash-styles, etc.) are loaded asynchronously
 * - CSS is loaded via async imports to not block initial render
 */
import React from 'react';
import { createRoot } from 'react-dom/client';

// Import lightweight boilerplate components from shared package
import { AppWrapperLight, GlobalSmallLoader, initializeThemeEarly, setGlobalLoaderIcon } from 'dash-boilerplate';
import { INAMAP_LOADER_ICON_MARKUP } from 'ina-common/icons';

const rootElement = document.getElementById('root');
if (!rootElement) { throw new Error('Root element not found'); }

// Initialize theme early before React renders to prevent flash
initializeThemeEarly('dark');

// dash-boilerplate ships GlobalSmallLoader brand-neutral; inject the INAMAP
// placeholder mark before the first render (it's used as a Suspense fallback
// below). Swap INAMAP_LOADER_ICON_MARKUP for the real brand mark once it exists.
setGlobalLoaderIcon(INAMAP_LOADER_ICON_MARKUP);

// Electron store sync (if available)
if (window.electronStore) {
    window.electronStore.syncToLocalStorage().then((all: Record<string, any>) => {
        Object.entries(all).forEach(([key, value]) => {
            window.localStorage.setItem(key, JSON.stringify(value));
        });
    });
}

const root = createRoot(rootElement);

// Lazy load the main app with all its heavy dependencies
// This includes Redux, dash-admin, react-admin (for private app), etc.
const AppComponent = React.lazy<React.FC>(() => {
    return new Promise<{ default: React.FC }>((resolve) => {
        // Small delay to allow initial render first
        setTimeout(() => {
            import('./DashAppComponent').then((mod) => {
                resolve({ default: mod.default });
            }).catch((error) => {
                console.error('Failed to load application:', error);
                resolve({
                    default: () => (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100vh',
                            color: '#000000',
                            gap: '12px'
                        }}>
                            <h1>Failed to load application</h1>
                            <button 
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '8px 24px',
                                    backgroundColor: '#57005aff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )
                });
            });
        }, 100);
    });
});

// Render with minimal wrapper - no Redux provider yet
// Redux provider is included in DashAppComponent
root.render(
    <AppWrapperLight>
        <React.Suspense fallback={<GlobalSmallLoader />}>
            <AppComponent />
        </React.Suspense>
    </AppWrapperLight>
);
