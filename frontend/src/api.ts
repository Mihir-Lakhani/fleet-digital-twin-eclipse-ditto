import axios, { AxiosResponse } from 'axios';
import { DigitalTwin, CreateTwinRequest, DashboardStats } from './types';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // Don't throw network errors to prevent popups when backend is offline
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      return Promise.reject({ ...error, isOffline: true });
    }
    throw error;
  }
);

export class ApiService {
  // Get all digital twins
  async getAllTwins(): Promise<DigitalTwin[]> {
    try {
      const response: AxiosResponse = await api.get('/mongodb/things');
      // Handle different response formats
      if (response.data.things) {
        return response.data.things;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      if (error.isOffline || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        // Return empty array for offline mode instead of throwing
        console.log('Backend offline - returning empty twins list');
        return [];
      }
      console.error('Error fetching twins:', error);
      throw new Error('Failed to fetch digital twins');
    }
  }

  // Create a new digital twin
  async createTwin(twinData: CreateTwinRequest): Promise<DigitalTwin> {
    try {
      // Generate unique thingId
      const thingId = `${twinData.type}:${Date.now()}`;
      const policyId = `${thingId}:policy`;

      const twin = {
        thingId,
        policyId,
        attributes: {
          // Basic Info
          name: twinData.name,
          type: twinData.type,
          status: twinData.status,
          description: twinData.description || '',
          
          // Extended attributes
          location: twinData.location,
          assetMetadata: twinData.assetMetadata,
          maintenanceInfo: twinData.maintenanceInfo,
          telemetryOverview: twinData.telemetryOverview,
          operationalSettings: twinData.operationalSettings,
          relationships: twinData.relationships,
          customProperties: twinData.customProperties || [],
          commands: twinData.commands || [],
          performanceMetrics: twinData.performanceMetrics,
          tags: twinData.tags || [],
        },
        features: twinData.features || {},
      };

      const response: AxiosResponse = await api.post('/mongodb/things', twin);
      return response.data;
    } catch (error: any) {
      if (error.isOffline || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw { ...error, isOffline: true };
      }
      console.error('Error creating twin:', error);
      throw new Error('Failed to create digital twin');
    }
  }

  // Update a digital twin
  async updateTwin(thingId: string, twinData: Partial<CreateTwinRequest>): Promise<DigitalTwin> {
    try {
      const response: AxiosResponse = await api.put(`/mongodb/things/${thingId}`, {
        attributes: {
          // Basic Info
          name: twinData.name,
          type: twinData.type,
          status: twinData.status,
          description: twinData.description,
          
          // Extended attributes
          location: twinData.location,
          assetMetadata: twinData.assetMetadata,
          maintenanceInfo: twinData.maintenanceInfo,
          telemetryOverview: twinData.telemetryOverview,
          operationalSettings: twinData.operationalSettings,
          relationships: twinData.relationships,
          customProperties: twinData.customProperties,
          commands: twinData.commands,
          performanceMetrics: twinData.performanceMetrics,
          tags: twinData.tags,
        },
        features: twinData.features || {},
      });
      return response.data;
    } catch (error) {
      console.error('Error updating twin:', error);
      throw new Error('Failed to update digital twin');
    }
  }

  // Delete a digital twin
  async deleteTwin(thingId: string): Promise<void> {
    try {
      await api.delete(`/mongodb/things/${thingId}`);
    } catch (error) {
      console.error('Error deleting twin:', error);
      throw new Error('Failed to delete digital twin');
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const twins = await this.getAllTwins();
      
      const stats: DashboardStats = {
        totalTwins: twins.length,
        activeTwins: twins.filter(t => t.attributes.status === 'active').length,
        inactiveTwins: twins.filter(t => t.attributes.status === 'inactive').length,
        maintenanceTwins: twins.filter(t => t.attributes.status === 'maintenance').length,
        errorTwins: twins.filter(t => t.attributes.status === 'error').length,
      };

      return stats;
    } catch (error: any) {
      if (error.isOffline || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        // Return default stats for offline mode
        console.log('Backend offline - returning default stats');
        return {
          totalTwins: 0,
          activeTwins: 0,
          inactiveTwins: 0,
          maintenanceTwins: 0,
          errorTwins: 0,
        };
      }
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple endpoint that should exist
      await api.get('/mongodb/things', { timeout: 5000 });
      return true;
    } catch (error: any) {
      // Check if it's a connection error (offline)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        return false;
      }
      // If we get any response (even errors), the backend is online
      return error.response ? true : false;
    }
  }
}

export const apiService = new ApiService();