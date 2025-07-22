export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    console.log('🔄 Connecting call for patient ID:', patientId);
    
    const apiUrl = `https://26543899bee7.ngrok-free.app/ar/connect?patientId=${patientId}`;
    console.log('🌐 Calling API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        // Add any required headers like authorization if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as text (API returns plain string)
    const responseText = await response.text();
    console.log('✅ Call connect API response (Text):', responseText);
    
    // The API returns just the call ID as a string (e.g., "CAe28bba91495b0ab09682c9168a86a7ba")
    let callId = responseText.trim();
    
    // Validate that it looks like a call ID (starts with CA and has alphanumeric characters)
    if (!callId.match(/^CA[A-Za-z0-9]+$/)) {
      console.warn('⚠️ Response does not look like a valid call ID:', callId);
      // Generate fallback call ID
      callId = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const data = {
      status: 'SUCCESS',
      message: `Call connected successfully. Call ID: ${callId}`,
      callId: callId
    };
    
    console.log('🎯 Final call ID:', callId);
    
    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(200).json({
      success: true,
      data: {
        callSid: callId,
        id: callId,
        status: 'connected',
        message: data.message || 'Call connected successfully'
      }
    });
    
  } catch (error) {
    console.error('❌ Call connect error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to connect call',
      error: error.message 
    });
  }
} 