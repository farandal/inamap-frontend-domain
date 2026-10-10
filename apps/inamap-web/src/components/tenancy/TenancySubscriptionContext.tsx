/**
 * TenancySubscriptionContext
 * 
 * Context component for the Tenancy Subscription resource.
 * Handles WebSocket notifications for plan changes and triggers UI refresh.
 * Similar pattern to ProductImportContext.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRefresh, useNotify } from 'react-admin';
import { IDashAutoAdminResourceConfig } from 'dash-auto-admin';
// IMPORTANT: Import from 'dash-admin' package (not source path) to ensure same context instance as main app
import LaravelEchoContext, { ILaravelEchoContext } from 'dash-admin/contexts/com/LaravelEchoContext';

// ============ Types ============

export interface ITenancySubscriptionContextValue {
    lastPlanChangeEvent: any | null;
    clearState: () => void;
}

const defaultContextValue: ITenancySubscriptionContextValue = {
    lastPlanChangeEvent: null,
    clearState: () => {},
};

export const TenancySubscriptionStateContext = createContext<ITenancySubscriptionContextValue>(defaultContextValue);

export const useTenancySubscriptionState = () => useContext(TenancySubscriptionStateContext);

// ============ Notification Listener Component ============

interface NotificationListenerProps {
    children: React.ReactNode;
}

const TenancySubscriptionNotificationListener: React.FC<NotificationListenerProps> = ({ children }) => {
    const refresh = useRefresh();
    const notify = useNotify();
    const laravelEchoContext = useContext<ILaravelEchoContext>(LaravelEchoContext);
    const { lastEvent } = laravelEchoContext;
    
    console.log('[TenancySubscriptionNotificationListener] Component mounted/rendered');
    console.log('[TenancySubscriptionNotificationListener] LaravelEchoContext:', laravelEchoContext);
    console.log('[TenancySubscriptionNotificationListener] lastEvent:', lastEvent);
    
    // Last event for raw access
    const [lastPlanChangeEvent, setLastPlanChangeEvent] = useState<any>(null);
    
    // Track processed events to avoid duplicates - use ref to prevent re-renders
    const lastProcessedEventRef = useRef<string | null>(null);

    const clearState = useCallback(() => {
        setLastPlanChangeEvent(null);
    }, []);

    useEffect(() => {
        console.log('[TenancySubscriptionNotificationListener] useEffect triggered, lastEvent:', lastEvent);
        
        if (!lastEvent) {
            console.log('[TenancySubscriptionNotificationListener] No lastEvent, returning');
            return;
        }

        // Create a stable event key - use event's own identifiers
        const eventType = lastEvent.type || 
                          lastEvent.data?.type || 
                          lastEvent.notificationPayload?.type ||
                          lastEvent.notificationPayload?.stdClass?.type ||
                          lastEvent.notificationPayload?.notificationPayload?.type;
        
        // Get data from multiple possible locations in the notification structure
        const eventData = lastEvent.data || {};
        const payloadData = lastEvent.notificationPayload?.notificationPayload || {};
        
        // Try multiple timestamp locations
        const eventTimestamp = eventData.timestamp || 
                               payloadData.timestamp ||
                               lastEvent.timestamp;
        
        // Create key from type + timestamp + unique content indicator
        const subscriptionId = eventData.subscription_id || payloadData.subscription_id || '';
        const currentEventKey = `${eventType}-${eventTimestamp || ''}-${subscriptionId}`;
        
        console.log('[TenancySubscriptionContext] Event key check:', {
            eventType,
            eventTimestamp,
            subscriptionId,
            currentEventKey,
            lastProcessedKey: lastProcessedEventRef.current,
            willSkip: lastProcessedEventRef.current === currentEventKey
        });
        
        // Skip if we've already processed this exact event
        if (lastProcessedEventRef.current === currentEventKey) {
            console.log('[TenancySubscriptionContext] Skipping duplicate event');
            return;
        }

        // Check if this is a subscription plan change notification
        const notificationClass = lastEvent.notificationPayload?.class || 
                                  lastEvent.notificationPayload?.stdClass?.class;

        console.log('[TenancySubscriptionContext] Received event:', {
            type: lastEvent.type,
            dataType: lastEvent.data?.type,
            payloadType: lastEvent.notificationPayload?.type,
            stdClassType: lastEvent.notificationPayload?.stdClass?.type,
            payloadClass: notificationClass,
            eventType,
            data: lastEvent.data
        });

        // Handle subscription plan change notifications
        if (eventType === 'subscription_plan_change_applied' || 
            notificationClass === 'App\\AppNotifications\\Notifications\\Billing\\SubscriptionPlanChangeNotification') {
            
            // Mark as processed
            lastProcessedEventRef.current = currentEventKey;
            
            // Get notification data from multiple possible locations
            const notificationData = lastEvent.data || 
                                     lastEvent.notificationPayload?.notificationPayload ||
                                     lastEvent.notificationPayload?.stdClass?.notificationPayload ||
                                     {};
            
            const fromPlanName = notificationData.from_plan_name || 'Previous Plan';
            const toPlanName = notificationData.to_plan_name || 'New Plan';
            const changeType = notificationData.change_type || 'change';
            
            console.log('[TenancySubscriptionContext] Plan change detected:', {
                fromPlan: fromPlanName,
                toPlan: toPlanName,
                changeType,
                subscriptionId: notificationData.subscription_id
            });
            
            // Update state
            setLastPlanChangeEvent(lastEvent);
            
            // Show notification to user
            const message = changeType === 'upgrade' 
                ? `Plan upgraded to ${toPlanName}`
                : changeType === 'downgrade'
                ? `Plan changed to ${toPlanName}`
                : `Plan changed from ${fromPlanName} to ${toPlanName}`;
            
            notify(message, { type: 'success' });
            
            // Trigger refresh to reload subscription data
            console.log('[TenancySubscriptionContext] Triggering refresh...');
            refresh();
        }
    }, [lastEvent, refresh, notify]);

    const contextValue: ITenancySubscriptionContextValue = {
        lastPlanChangeEvent,
        clearState,
    };

    return (
        <TenancySubscriptionStateContext.Provider value={contextValue}>
            {children}
        </TenancySubscriptionStateContext.Provider>
    );
};

// ============ Main Context Component ============

/**
 * TenancySubscriptionContext
 * 
 * Context wrapper for the Tenancy Subscription resource.
 * Wraps with the NotificationListener in 'view', 'edit', and 'list' modes to handle WebSocket events
 * for plan change notifications. Create mode just passes children through.
 * 
 * Signature matches IDashAutoAdminResourceConfig.contextComponent
 */
const TenancySubscriptionContext = ({
    resourceConfig,
    mode,
    children
}: {
    resourceConfig: IDashAutoAdminResourceConfig;
    mode?: 'list' | 'create' | 'edit' | 'view';
    children?: React.ReactNode;
}): React.ReactElement => {
    console.log('[TenancySubscriptionContext] Component rendering with mode:', mode);
    
    // Wrap with notification listener in 'view', 'edit', and 'list' modes
    // This ensures we catch plan change events even when viewing the list
    //if (mode === 'view' || mode === 'edit' || mode === 'list') {
        console.log('[TenancySubscriptionContext] Wrapping with NotificationListener');
        return (
            <TenancySubscriptionNotificationListener>
                {children}
            </TenancySubscriptionNotificationListener>
        );
    //}

    // For create mode, just pass children through
    console.log('[TenancySubscriptionContext] Passing children through (no listener)');
    return <>{children}</>;
};

export default TenancySubscriptionContext;


