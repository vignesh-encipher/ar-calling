export default async function handler(req, res) {
  console.log('📞 End call API endpoint hit');
  console.log('📞 Method:', req.method);
  
  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get callId from localStorage (passed in headers or query params)
    let callId = null;
    
    // Try to get from headers first
    if (req.headers['x-call-id']) {
      callId = req.headers['x-call-id'];
      console.log('📞 Received callId from headers:', callId);
    }
    
    // Try to get from query params as fallback
    if (!callId && req.query.callId) {
      callId = req.query.callId;
      console.log('📞 Received callId from query:', callId);
    }
    
    console.log('📞 Final callId to use:', callId);
    
    if (!callId) {
      console.log('❌ No callId provided from any source');
      return res.status(400).json({ 
        success: false, 
        error: 'callId is required' 
      });
    }

    const CALL_API_URL = 'https://26543899bee7.ngrok-free.app';
    console.log('📞 Calling external API:', `${CALL_API_URL}/call/end?callId=${callId}`);
    
    const response = await fetch(`${CALL_API_URL}/call/end?callId=${callId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log('📞 External API response status:', response.status);
    console.log('📞 External API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log('❌ External API error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is JSON or plain text
    const contentType = response.headers.get('content-type');
    console.log('📞 Response content type:', contentType);
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('📞 JSON response data:', data);
    } else {
      // Handle plain text response
      const textData = await response.text();
      console.log('📞 Text response data:', textData);
      data = {
        message: textData || 'Call ended successfully',
        callId: callId,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('📞 Sending success response to client');
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Call End API Error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 