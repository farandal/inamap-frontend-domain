/**
 * Auth provider utilities for logout and session management
 */

import { AuthPersistenceService, clearDeviceStoreAuth } from "dash-auth";

/**
 * Performs complete logout from storage, clearing all auth data
 * and stopping background services
 */
export const logoutFromStorage = async (reason: string): Promise<void> => {
    console.log("logoutFromStorage", reason);

    // Use the centralized persistence service instead of manual cleanup
    AuthPersistenceService.markAsLoggedOut();

    // Clear auth data from device store (Electron/Capacitor)
    // This is crucial - it removes token/user from electron-store so they
    // don't get restored on next app launch
    await clearDeviceStoreAuth();

    // Keep only the IPC service cleanup
    const DashIPCService = (window as any).DashIPCService;
    DashIPCService && DashIPCService.action('stop-bg-service');
};
