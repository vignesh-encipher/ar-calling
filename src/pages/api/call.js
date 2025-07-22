import { API_ENDPOINTS } from '../../utils/config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const CALL_API_URL = API_ENDPOINTS.CALL_CONNECT.replace('/call/connect', '');
    
    const response = await fetch(API_ENDPOINTS.CALL_CONNECT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'phone': '1-877-235-8073',
        'ngrok-skip-browser-warning': 'true'
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
        callSid: textData, // Changed from callId to callSid
        callId: textData,  // Keep callId for backward compatibility
        message: 'Call connected successfully',
        timestamp: new Date().toISOString()
      };
    }
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 