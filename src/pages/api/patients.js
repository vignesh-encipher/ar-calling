export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 Proxying request to external API...');
    
    const response = await fetch('https://143742ebcc60.ngrok-free.app/ar/get/allPatients', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add any required headers like authorization if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log('✅ Proxy successful, API response:', apiResponse);
    
    // Transform the API response to match expected format
    let transformedData = [];
    
    if (apiResponse.status === 'SUCCESS' && apiResponse.response && Array.isArray(apiResponse.response)) {
      transformedData = apiResponse.response.map((patient, index) => ({
        key: patient.id || `patient-${index}`,
        patientName: `${patient.patientFirstName || ''} ${patient.patientLastName || ''}`.trim(),
        npi: patient.npiId || '',
        ptan: patient.ptanId || '',
        tin: patient.tinId || '',
        medicareId: patient.medicareId || '',
        dos: patient.dos || '',
        dob: patient.dob || '',
        status: 'active',
        chatCompleted: false
      }));
    }
    
    console.log('✅ Transformed data:', transformedData);
    
    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(200).json(transformedData);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch patients',
      error: error.message 
    });
  }
} 