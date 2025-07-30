import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== BACKEND UPLOAD HANDLER START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Parse form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    console.log('Parsed form data:');
    console.log('Fields:', fields);
    console.log('Files:', files);
    
    if (!files.excel || !files.excel[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = files.excel[0];
    console.log('File details:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      path: file.filepath
    });
    
    // Validate file type
    const validExcelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/excel',
      'application/x-excel',
      'application/x-msexcel'
    ];
    
    const isValidExcel = validExcelTypes.includes(file.mimetype) || 
                        file.originalFilename.toLowerCase().endsWith('.xlsx') ||
                        file.originalFilename.toLowerCase().endsWith('.xls');
    
    if (!isValidExcel) {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only Excel files (.xlsx, .xls) are allowed'
      });
    }
    
    // Read the file and create a Blob
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.filepath);
    console.log('File buffer size:', fileBuffer.length, 'bytes');
    
    const fileBlob = new Blob([fileBuffer], { 
      type: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    console.log('Blob size:', fileBlob.size, 'bytes');
    console.log('Blob type:', fileBlob.type);
    
    // Create form data for external API
    const formData = new FormData();
    formData.append('excel', fileBlob, file.originalFilename);
    console.log('FormData created with file:', file.originalFilename);
    
    console.log('=== BACKEND UPLOAD API DEBUG START ===');
    console.log('Uploading to external API...');
    console.log('Target URL: https://ar.encipherhealth.com/ar/upload/excel');
    
    const response = await fetch('https://ar.encipherhealth.com/ar/upload/excel', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Server/1.0)',
      },
    });
    
    console.log('Upload response received:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    console.log('- OK:', response.ok);
    
    if (!response.ok) {
      console.error('External upload API returned error status:', response.status);
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      return res.status(response.status).json({
        error: 'External upload API error',
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
    console.log('External upload API response:', data);
    console.log('=== BACKEND UPLOAD API DEBUG END ===');
    
    // Check if the API returned success but with invalid file message
    if (data.status === 'SUCCESS' && data.message === 'invalid file') {
      console.error('API returned invalid file error');
      return res.status(400).json({
        error: 'Invalid file format',
        message: 'The uploaded file is not a valid Excel file or has invalid content',
        details: data
      });
    }
    
    console.log('Sending response to frontend:', data);
    res.status(200).json(data);
    
  } catch (error) {
    console.error('=== BACKEND UPLOAD ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('=== BACKEND UPLOAD ERROR END ===');
    
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      type: error.constructor.name,
      name: error.name,
      code: error.code
    });
  }
} 