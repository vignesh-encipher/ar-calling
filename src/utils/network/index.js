import { checkStatus } from "./helper";
import { portalUrl, tokenKey } from "../config";
import { getStorage } from "../storages";

const CALL_API_URL = `https://44380e6a9792.ngrok-free.app`; // Updated to match current ngrok URL

export async function requestPortal(url, options) {
  const token = await getStorage(tokenKey);
  const actualUrl = `${portalUrl}${url}`;
  const actualOptions = {
    ...options,
    headers: {
      Authorization: `${"Bearer" + " " + token}`,
      "Content-Type": "application/json",
    },
  };
  return fetch(actualUrl, actualOptions).then(checkStatus);
}

export async function requestExternal(url, options, path) {
  const actualUrl = `${portalUrl}${url}`;
  const actualOptions = {
    ...options,
    body: JSON.stringify(body),
    headers: {
      Authorization: `${"Bearer" + " " + token}`,
      "Content-Type": "application/json",
    },
  };
  return fetch(actualUrl, actualOptions).then(checkStatus);
}

// API Service functions using fetch instead of axios
export const apiService = {
  // Connect to call API
  async connectCall() {
    try {
      console.log('📞 Connecting to call API...');
      
      // Use local API route to avoid CORS issues
      const response = await fetch('/api/call', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is JSON or plain text
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle plain text response
        const textData = await response.text();
        data = {
          callId: textData,
          message: 'Call connected successfully',
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('✅ Call API Response:', data);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('❌ Call API Error:', error);
      
      // If the API fails, try the mock response
      console.log('🔄 Trying mock response...');
      return this.connectCallMock();
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

  // End call API
  async endCall(callId) {
    try {
      console.log('📞 Ending call with ID:', callId);
      
      // Use local API route to avoid CORS issues
      const response = await fetch(`/api/call/end?callId=${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Call-ID': callId
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Call End Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Call End Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
