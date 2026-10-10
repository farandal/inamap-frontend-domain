import { useState, useEffect } from 'react';
import { useAxios } from 'dash-axios-hook';

export interface PaymentGatewayCapabilities {
    billing_cycles: string[];
    supports_subscriptions: boolean;
    supports_trials: boolean;
    supported_currencies?: string[];
    supported_payment_methods?: string[];
    requires_customer_id?: boolean;
}

export interface PaymentGatewayCapabilitiesResponse {
    gateway: string;
    gateway_name: string;
    capabilities: PaymentGatewayCapabilities;
}

/**
 * Hook to fetch payment gateway capabilities for the current tenancy
 * 
 * Returns the capabilities of the active payment gateway, including
 * supported billing cycles, currencies, payment methods, etc.
 * 
 * @example
 * ```tsx
 * const { capabilities, supportedBillingCycles, isLoading } = usePaymentGatewayCapabilities();
 * 
 * if (isLoading) return <CircularProgress />;
 * 
 * // Use supported billing cycles to filter plans
 * const filteredPlans = plans.filter(plan => 
 *   supportedBillingCycles.includes(plan.billing_cycle)
 * );
 * ```
 * 
 * @returns {object} - Contains data, gateway info, capabilities, loading state, and error
 */
export const usePaymentGatewayCapabilities = () => {
    const  axios = useAxios();
    const [data, setData] = useState<PaymentGatewayCapabilitiesResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      

        const fetchCapabilities = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // axios automatically appends "/api" prefix
                const response = await axios.get<PaymentGatewayCapabilitiesResponse>(
                    'tenancy/payment-gateway/capabilities'
                );
                
                setData(response.data);
            } catch (err) {
                console.error('Error fetching payment gateway capabilities:', err);
                setError(err as Error);
                // Set fallback data on error
                setData({
                    gateway: 'unknown',
                    gateway_name: 'Unknown Gateway',
                    capabilities: {
                        billing_cycles: ['monthly'],
                        supports_subscriptions: false,
                        supports_trials: false,
                    }
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCapabilities();
    }, []);

    return {
        data,
        gateway: data?.gateway ?? null,
        gatewayName: data?.gateway_name ?? null,
        capabilities: data?.capabilities ?? {
            billing_cycles: ['monthly'], // Safe fallback
            supports_subscriptions: false,
            supports_trials: false,
        },
        supportedBillingCycles: data?.capabilities?.billing_cycles ?? ['monthly'],
        isLoading,
        error,
    };
};

export default usePaymentGatewayCapabilities;
