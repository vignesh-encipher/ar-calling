// API Service for Backend Communication
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const CALL_API_URL = 'https://b861e0bc6e44.ngrok-free.app';

// Create axios instance with interceptors
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

const apiService = {
  // Get patients list
  async getPatients() {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/patients`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get chat history
  async getChatHistory(patientId) {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/chat/history/${patientId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Connect to call API
  async connectCall() {
    try {
      console.log('📞 Connecting to call API...');
      
              const response = await axios.get('https://353f2c7eafcd.ngrok-free.app/call/connect', {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'phone': '1-877-235-8073',
            'ngrok-skip-browser-warning': 'true'
          }
        });
      
      console.log('✅ Call API Response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Call API Error:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  },

  // Mock call response for testing when API fails
  async connectCallMock() {
    console.log('📞 Using mock call response for testing...');
    return {
      success: true,
      data: {
        callSid: 'mock-call-sid-' + Date.now(),
        id: 'mock-call-id-' + Date.now(),
        status: 'connected',
        message: 'Mock call connected successfully'
      }
    };
  },

  // Health check for backend
  async healthCheck() {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/health`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default apiService; 