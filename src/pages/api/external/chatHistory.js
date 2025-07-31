export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { callId } = req.query;

  if (!callId) {
    return res.status(400).json({ error: 'Call ID is required' });
  }

  try {
    console.log('=== BACKEND CHAT HISTORY API HANDLER START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Call ID:', callId);
    
    console.log('=== BACKEND CHAT HISTORY API DEBUG START ===');
    console.log('Fetching chat history from external API...');
    console.log('Target URL: https://ar.encipherhealth.com/ar/get/chatHistory?callId=' + callId);
    
    console.log('About to make fetch request...');
    const response = await fetch(`https://ar.encipherhealth.com/ar/get/chatHistory?callId=${callId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Server/1.0)',
      },
    });
    console.log('Fetch request completed');
    
    console.log('Response received:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    console.log('- OK:', response.ok);
    
    if (!response.ok) {
      console.error('External API returned error status:', response.status);
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      return res.status(response.status).json({
        error: 'External API error',
        message: `External API returned ${response.status}: ${errorText}`
      });
    }
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response detected');
      const responseText = await response.text();
      console.error('Full response text:', responseText);
      console.error('Response text preview:', responseText.substring(0, 500) + '...');
      
      if (responseText.includes('ngrok') || responseText.includes('ERR_NGROK')) {
        console.log('Ngrok warning page detected');
        return res.status(500).json({
          error: 'Ngrok authentication required',
          message: 'Please authenticate with ngrok tunnel first.'
        });
      }
      console.log('Unknown non-JSON response');
      return res.status(500).json({
        error: 'Invalid response format',
        message: 'External API returned non-JSON response'
      });
    }
    
    const data = await response.json();
    console.log('External chat history API response:', data);
    console.log('=== BACKEND CHAT HISTORY API DEBUG END ===');
    console.log('Sending response to frontend:', data);
    res.status(200).json(data);
    
  } catch (error) {
    console.error('=== BACKEND CHAT HISTORY API ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('=== BACKEND CHAT HISTORY API ERROR END ===');
    
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      type: error.constructor.name,
      name: error.name,
      code: error.code
    });
  }
} 