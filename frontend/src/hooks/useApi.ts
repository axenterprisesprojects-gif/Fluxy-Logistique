import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

// Use Constants.expoConfig.extra for production builds, fallback to env for development
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export function useApi() {
  const { sessionToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (sessionToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${sessionToken}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
      throw new Error(error.detail || 'Erreur serveur');
    }

    return response.json();
  };

  // Business APIs
  const updateBusinessProfile = (data: any) => 
    fetchWithAuth('/api/business/profile', { method: 'PUT', body: JSON.stringify(data) });

  const createDelivery = (data: any) => 
    fetchWithAuth('/api/business/delivery', { method: 'POST', body: JSON.stringify(data) });

  const getBusinessDeliveries = () => 
    fetchWithAuth('/api/business/deliveries');

  // Driver APIs
  const updateDriverProfile = (data: any) => 
    fetchWithAuth('/api/driver/profile', { method: 'PUT', body: JSON.stringify(data) });

  const uploadDriverDocument = (data: any) => 
    fetchWithAuth('/api/driver/document', { method: 'POST', body: JSON.stringify(data) });

  const getAvailableJobs = () => 
    fetchWithAuth('/api/driver/available-jobs');

  const getDriverJobs = () => 
    fetchWithAuth('/api/driver/my-jobs');

  const acceptJob = (deliveryId: string) => 
    fetchWithAuth(`/api/driver/accept/${deliveryId}`, { method: 'POST' });

  const confirmPickup = (deliveryId: string, photo: string) => 
    fetchWithAuth(`/api/driver/confirm-pickup/${deliveryId}`, { 
      method: 'POST', 
      body: JSON.stringify({ photo }) 
    });

  const confirmDelivery = (deliveryId: string, photo: string) => 
    fetchWithAuth(`/api/driver/confirm-delivery/${deliveryId}`, { 
      method: 'POST', 
      body: JSON.stringify({ photo }) 
    });

  // Admin APIs
  const getAdminDashboard = () => 
    fetchWithAuth('/api/admin/dashboard');

  const getAdminDeliveries = (status?: string) => 
    fetchWithAuth(`/api/admin/deliveries${status ? `?status=${status}` : ''}`);

  const getAdminDrivers = (validated?: boolean) => 
    fetchWithAuth(`/api/admin/drivers${validated !== undefined ? `?validated=${validated}` : ''}`);

  const validateDriver = (userId: string) => 
    fetchWithAuth(`/api/admin/validate-driver/${userId}`, { method: 'POST' });

  const getAdminBusinesses = () => 
    fetchWithAuth('/api/admin/businesses');

  const getPricingRules = () => 
    fetchWithAuth('/api/admin/pricing');

  const createPricingRule = (data: any) => 
    fetchWithAuth('/api/admin/pricing', { method: 'POST', body: JSON.stringify(data) });

  const updatePricingRule = (ruleId: string, data: any) => 
    fetchWithAuth(`/api/admin/pricing/${ruleId}`, { method: 'PUT', body: JSON.stringify(data) });

  const deletePricingRule = (ruleId: string) => 
    fetchWithAuth(`/api/admin/pricing/${ruleId}`, { method: 'DELETE' });

  const updateCommission = (percentage: number) => 
    fetchWithAuth(`/api/admin/commission?commission_percentage=${percentage}`, { method: 'PUT' });

  // Public APIs
  const getItemTypes = () => 
    fetchWithAuth('/api/item-types');

  const getTimeSlots = () => 
    fetchWithAuth('/api/time-slots');

  return {
    // Business
    updateBusinessProfile,
    createDelivery,
    getBusinessDeliveries,
    // Driver
    updateDriverProfile,
    uploadDriverDocument,
    getAvailableJobs,
    getDriverJobs,
    acceptJob,
    confirmPickup,
    confirmDelivery,
    // Admin
    getAdminDashboard,
    getAdminDeliveries,
    getAdminDrivers,
    validateDriver,
    getAdminBusinesses,
    getPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    updateCommission,
    // Public
    getItemTypes,
    getTimeSlots,
  };
}
