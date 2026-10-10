import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAxios } from 'dash-axios-hook';

/**
 * System Config Types
 */
export interface Currency {
    id: number;
    code: string;
    symbol: string;
    format: string;
    label: string;
}

export interface Language {
    id: number;
    code: string;
    name: string;
    native_name: string;
    label: string;
}

export interface Timezone {
    value: string;
    label: string;
    offset: string;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    prices?: Record<string, number>;
    billing_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
    billing_cycle_label: string;
    trial_days: number;
    features: string[];
    limits?: Record<string, any>;
    is_popular?: boolean;
    is_active?: boolean;
    formatted_price?: string;
    allow_downgrade?: boolean;
    tier?: number; // 1=Basic, 2=Standard, 3=Pro, etc. (higher = better plan)
}

export interface SystemConfigData {
    currencies: Currency[];
    languages: Language[];
    timezones: Record<string, Timezone[]>;
    subscription_plans: SubscriptionPlan[];
    defaults: {
        language: string;
        currency: string;
        timezone: string;
    };
}

export interface SystemConfigResponse {
    success: boolean;
    data: SystemConfigData;
    cached_until?: string;
}

/**
 * Cache Configuration
 * 
 * System config data is relatively static and can be cached for longer periods
 */
export const SYSTEM_CONFIG_CACHE = {
    staleTime: 30 * 60 * 1000,      // 30 minutes - data considered fresh
    gcTime: 60 * 60 * 1000,         // 60 minutes - garbage collection time
    refetchOnWindowFocus: false,     // Don't refetch when user returns to tab
    refetchOnMount: false,           // Use cached data on component mount
    retry: 2,                        // Retry failed requests twice
};

/**
 * Hook to fetch and cache system configuration data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSystemConfig();
 * 
 * if (isLoading) return <CircularProgress />;
 * if (error) return <Alert severity="error">{error.message}</Alert>;
 * 
 * const currencies = data?.data.currencies;
 * const plans = data?.data.subscription_plans;
 * ```
 */
export function useSystemConfig(): UseQueryResult<SystemConfigResponse, Error> {
    const axios = useAxios();

    return useQuery<SystemConfigResponse, Error>({
        queryKey: ['system', 'config'],
        queryFn: async () => {
            console.log('⚙️ [useSystemConfig] Fetching system configuration...');
            const response = await axios.get('/public/system-config');
            
            console.log('✅ [useSystemConfig] System config loaded:', {
                currencies: response.data.data.currencies?.length || 0,
                languages: response.data.data.languages?.length || 0,
                plans: response.data.data.subscription_plans?.length || 0,
                cached_until: response.data.cached_until,
            });
            
            return response.data;
        },
        ...SYSTEM_CONFIG_CACHE,
    });
}

/**
 * Hook to get only subscription plans from system config
 * 
 * @example
 * ```tsx
 * const { data: plans, isLoading } = useSubscriptionPlans();
 * ```
 */
export function useSubscriptionPlans() {
    const { data, isLoading, error } = useSystemConfig();
    
    return {
        data: data?.data.subscription_plans || [],
        isLoading,
        error,
    };
}

/**
 * Hook to get only currencies from system config
 */
export function useCurrencies() {
    const { data, isLoading, error } = useSystemConfig();
    
    return {
        data: data?.data.currencies || [],
        isLoading,
        error,
    };
}

/**
 * Hook to get only languages from system config
 */
export function useLanguages() {
    const { data, isLoading, error } = useSystemConfig();
    
    return {
        data: data?.data.languages || [],
        isLoading,
        error,
    };
}

/**
 * Hook to get only timezones from system config
 */
export function useTimezones() {
    const { data, isLoading, error } = useSystemConfig();
    
    return {
        data: data?.data.timezones || {},
        isLoading,
        error,
    };
}

/**
 * Hook to get default values from system config
 */
export function useSystemDefaults() {
    const { data, isLoading, error } = useSystemConfig();
    
    return {
        data: data?.data.defaults || {
            language: 'es',
            currency: 'CLP',
            timezone: 'America/Santiago',
        },
        isLoading,
        error,
    };
}
