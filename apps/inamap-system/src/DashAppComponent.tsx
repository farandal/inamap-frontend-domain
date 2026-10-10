/**
 * DashAppComponent
 * 
 * This component is lazy-loaded from main.tsx and contains all heavy dependencies:
 * - Redux store and Provider
 * - Dash admin state initialization
 * - Heavy styles loading
 * - Platform body classes
 * 
 * By lazy-loading this component, we keep react-admin and other heavy deps
 * out of the initial bundle, reducing initial load from ~2MB to ~200KB.
 */
import React from 'react';
import { Provider } from 'react-redux';
import { dashStorage } from 'dash-utils';
import { applyPlatformBodyClasses } from 'dash-utils';

// These imports are now lazy-loaded instead of in the critical path
import DASHAuthenticationService from 'dash-admin/contexts/auth/DASHAuthenticationService';
import { AuthPersistenceService } from 'dash-auth';

// Import store configuration
import configureStore from 'dash-admin-state/redux/store';
import {
    IDASHAppState,
    defaultCommon,
    defaultPageSettings,
    defaultFormState,
    defaultSettings,
    setReduxStore,
} from 'dash-admin-state';

// Import CSS variable utility from dash-boilerplate
import { getCssVariableNumber } from 'dash-boilerplate';

/* Dependency Styles - now async loaded */
import 'react-toastify/dist/ReactToastify.css';

/* Fonts */
import './assets/fonts/Montserrat-Black.ttf';
import './assets/fonts/Montserrat-Bold.ttf';
import './assets/fonts/Montserrat-Medium.ttf';
import './assets/fonts/Montserrat-Regular.ttf';
import './assets/fonts/Montserrat-SemiBold.ttf';

/* App styles - now async loaded */
import "dash-styles/dash.less";
import './styles.less';

// Import assets for initial state
import squaredLogo from './assets/logo-squared.svg';
import horizontalLogo from './assets/logo-horizontal.svg';
import LoginBackground from './assets/login-back.svg';

// Import from local dash-extensions
import { DASHLayoutSettings, DASHGroupIcons } from './dash-extensions/config';
import { updateDomCssVariables } from 'dash-utils';

// Import the bootstrap component
import WebBootstrap from './WebBootstrap';

// Get tenant images from persistence
const getTenantImages = () => {
    try {
        return AuthPersistenceService.getTenantImages();
    } catch {
        return null;
    }
};

// Create initial app state for Redux
const getDefaultAppCommon = () => {
    const tenantImages = getTenantImages();
    
    // Read sidebar dimensions from CSS variables (defined in styles.less)
    // Uses getCssVariableNumber from dash-boilerplate
    const sidebarLargeWidth = getCssVariableNumber('--sidebar-large-width', 255);
    const sidebarSmallWidth = getCssVariableNumber('--sidebar-small-width', 64);
    const sidebarHorizontalHeight = getCssVariableNumber('--sidebar-horizontal-height', 120);
    // Logo dimensions for vertical sidebar (left/right)
    const logoVerticalMaxWidth = getCssVariableNumber('--logo-vertical-max-width', 130);
    const logoVerticalMaxHeight = getCssVariableNumber('--logo-vertical-max-height', 130);
    // Logo dimensions for horizontal sidebar (top/bottom)
    const logoHorizontalMaxWidth = getCssVariableNumber('--logo-horizontal-max-width', 200);
    const logoHorizontalMaxHeight = getCssVariableNumber('--logo-horizontal-max-height', 60);

    return {
        ...defaultCommon,
        appPath: '/',
        navExpanded: dashStorage.getItem('dashNavExpanded') ? dashStorage.getItem('dashNavExpanded') === 'true' : true,
        navSize: dashStorage.getItem('dashNavSize') || 'small',       
        width: window.innerWidth,
        height: window.innerHeight,
        // Custom header toolbar with language switcher and dark mode toggle for light app
        //headerToolBar: PublicHeaderActions,
        //headerToolBar: null,
        // Replace the default sidebar actions (BridgedLocalesMenuButton, etc.) with our custom headerToolBar
        headerToolBarReplace: false,
        panelSettings: {
            appName: 'INAMAP',
            horizontalLogo: tenantImages?.horizontal_logo?.original || horizontalLogo,
            squaredLogo: tenantImages?.squared_logo?.original || squaredLogo,
            loginBackground: tenantImages?.banner?.original || LoginBackground,
            sidebarPosition: 'top',
            // Sidebar sizing (from CSS variables)
            sidebarLargeWidth,
            sidebarSmallWidth,
            sidebarHorizontalHeight,
            // Logo sizing for vertical sidebar (left/right)
            logoVerticalMaxWidth,
            logoVerticalMaxHeight,
            // Logo sizing for horizontal sidebar (top/bottom)
            logoHorizontalMaxWidth,
            logoHorizontalMaxHeight,
            // Padding configuration (in pixels, derived from sidebar sizes)
            paddingHorizontal: sidebarLargeWidth,
            paddingVertical: sidebarHorizontalHeight,
        },
    };
};

const defaultAppSettings = () => {
    const tenantSettings = AuthPersistenceService.getTenantSettings();
    return {
        ...defaultSettings,
        ...(tenantSettings || {}),
        loading: false,
        navStyle: DASHLayoutSettings.NAV_STYLE_FIXED,
        layoutType: DASHLayoutSettings.LAYOUT_TYPE_FULL,
        themeType: DASHLayoutSettings.THEME_TYPE_DARK,
        layoutSettings: DASHLayoutSettings,
        groupIcons: DASHGroupIcons,
        themeColor: '',
        isDirectionRTL: false,
        locale: 'es',
        availableLocales: [
            {
                locale: 'es',
                languageId: 'spanish',
                name: 'Español',
                icon: 'es',
            },
            {
                locale: 'en',
                languageId: 'english',
                name: 'English',
                icon: 'en',
            },
        ],
        translations: {},
    };
};

// Create the initial state
const createInitialState = (): IDASHAppState<any, any, any> => ({
    settings: defaultAppSettings(),
    common: getDefaultAppCommon(),
    page: defaultPageSettings,
    auth: DASHAuthenticationService.getInitialAuthState(),
    resources: { items: [] },
    formData: defaultFormState,
    componentData: {},
});

// Create Redux store - this is now lazy loaded
const INITIAL_APP_STATE = createInitialState();
const store = configureStore(INITIAL_APP_STATE);
setReduxStore(store);

// Inject CSS variables from tenant settings
const injectTenantStyles = () => {
    const tenantSettings = AuthPersistenceService.getTenantSettings();
    if (tenantSettings) {
        try {
            const colors = tenantSettings.colors;
            console.log('Updating colors from local storage');
            updateDomCssVariables(DASHLayoutSettings.THEME_TYPE_DARK, colors);
        } catch (error) {
            console.error('Error parsing tenant settings:', error);
        }
    }
};

// Apply platform classes and inject styles
applyPlatformBodyClasses();
injectTenantStyles();

/**
 * DashAppComponent
 * 
 * Wraps the main bootstrap component with all required providers.
 * This is lazy-loaded to keep heavy deps out of the initial bundle.
 */
const DashAppComponent: React.FC = () => {
    return (
        <Provider store={store}>
            <WebBootstrap />
        </Provider>
    );
};

export default DashAppComponent;
