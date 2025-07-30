export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock data - in a real application, this would come from a database
    const mockFiles = [
      {
        key: '1',
        filename: 'patient_data_2024_01.xlsx',
        date: '2024-01-15',
        numberOfRecords: 1250,
        status: 'completed',
        fileSize: '2.5 MB'
      },
      {
        key: '2',
        filename: 'medical_records_2024_02.xlsx',
        date: '2024-02-20',
        numberOfRecords: 890,
        status: 'processing',
        fileSize: '1.8 MB'
      },
      {
        key: '3',
        filename: 'billing_data_2024_03.xlsx',
        date: '2024-03-10',
        numberOfRecords: 2100,
        status: 'completed',
        fileSize: '4.2 MB'
      },
      {
        key: '4',
        filename: 'insurance_claims_2024_04.xlsx',
        date: '2024-04-05',
        numberOfRecords: 1560,
        status: 'failed',
        fileSize: '3.1 MB'
      },
      {
        key: '5',
        filename: 'patient_analytics_2024_05.xlsx',
        date: '2024-05-12',
        numberOfRecords: 3200,
        status: 'completed',
        fileSize: '6.7 MB'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({
      success: true,
      data: mockFiles,
      total: mockFiles.length
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve files',
      error: error.message 
    });
  }
} 