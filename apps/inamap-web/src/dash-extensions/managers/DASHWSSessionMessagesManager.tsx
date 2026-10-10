import { useEffect, useState } from 'react';
import useLaravelEcho from 'dash-admin/contexts/com/useLaravelEcho';
import { useAuthContext } from 'dash-admin/contexts/auth/AuthContext';
import type { IAuthContext } from 'dash-admin/contexts/auth';
import { IDashNotificationPayloadBase } from 'dash-admin/interfaces/communication/INotification';
import { dashStorage } from 'dash-utils';
// Define an interface for product status tracking
interface IProductStatus {
  product_id: number;
  product_name: string;
  status: string;
  quantity: number;
  image_url?: string;
  tenant_id?: number;
  tenant_name?: string;
}

const DASHWSSessionMessagesManager = () => {
    const [events, setEvents] = useState<IDashNotificationPayloadBase[]>([]);
    const [lastEvent, setLastEvent] = useState<IDashNotificationPayloadBase>(null);
    const [productStatuses, setProductStatuses] = useState<Record<number, IProductStatus>>({});
    const [tenantStatuses, setTenantStatuses] = useState<Record<number, string>>({});
   
    const sessionId = dashStorage.getItem('mall-session-hash');
   
    const { lastEvent: event, isConnected } = useLaravelEcho({
        type: 'public',
        channel: sessionId ? `session.${sessionId}` : null,
        enabled: !!sessionId,
    });

    useEffect(() => {
        if (event?.data) {
            setLastEvent(event.data);
           /* 
            // Log notification for debugging
            console.log('Mall session event received:', event.data);
            
            // Handle mall order status updates
            if (event.data.type === 'mall_order_status_update') {
                const { tenant_name, status, tenant_id, products, master_tab_id, timestamp } = event.data;
                console.log(`Order status update from ${tenant_name}: Status changed to ${status}`);
                
                // Update tenant status tracking
                if (tenant_id) {
                    setTenantStatuses(prev => ({
                        ...prev,
                        [tenant_id]: status
                    }));
                }
                
                // Update product statuses in state
                if (products && Array.isArray(products)) {
                    const newProductStatuses = { ...productStatuses };
                    
                    products.forEach(product => {
                        if (product.product_id) {
                            newProductStatuses[product.product_id] = {
                                product_id: product.product_id,
                                product_name: product.product_name || 'Unknown Product',
                                status: product.status || status,
                                quantity: product.quantity || 1,
                                image_url: product.image_url,
                                tenant_id: tenant_id,
                                tenant_name: tenant_name
                            };
                        }
                    });
                    
                    setProductStatuses(newProductStatuses);
                    console.log('Updated product statuses:', newProductStatuses);
                }
            }*/
        }
    }, [event]);

    useEffect(() => {
        if (lastEvent) {
            setEvents(prev => [...prev, lastEvent]);
        }
    }, [lastEvent]);

    const clear = () => setLastEvent(null);

    return {
        events,
        lastEvent,
        productStatuses,
        tenantStatuses,
        isConnected,
        clear,
    };
};

export default DASHWSSessionMessagesManager;
