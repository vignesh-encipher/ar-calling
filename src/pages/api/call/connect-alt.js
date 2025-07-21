export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const CALL_API_URL = 'https://4cf19c9fcc29.ngrok-free.app';
  const endpoints = [
    '/',
    '/call',
    '/connect',
    '/call/connect',
    '/api/call',
    '/api/connect'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Trying endpoint: ${endpoint}`);
      
      const response = await fetch(`${CALL_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'phone': '1-877-235-8073',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
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
        
        console.log(`✅ Success with endpoint: ${endpoint}`);
        
        return res.status(200).json({
          success: true,
          data: data,
          endpoint: endpoint
        });
      }
    } catch (error) {
      console.log(`❌ Failed with endpoint: ${endpoint}`, error.message);
      continue;
    }
  }

  // If all endpoints fail, return error
  res.status(404).json({
    success: false,
    error: 'No valid endpoint found',
    triedEndpoints: endpoints
  });
} 