import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Upload, message, Card, Row, Col, Tag, Space, Typography, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

const { Title, Text } = Typography;

const FilesPage = () => {
  const [fileData, setFileData] = useState([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('unknown');

    // Fetch files from API
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        console.log('=== FRONTEND API DEBUG START ===');
        console.log('Calling API: /api/external/allBatches');
        console.log('Method: GET');
        console.log('Headers:', {
          'Accept': 'application/json',
        });
        
        const response = await fetch('/api/external/allBatches', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('=== RESPONSE RECEIVED ===');
        console.log('Response object:', response);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('OK:', response.ok);
        console.log('URL:', response.url);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.error('=== API ERROR ===');
          console.error('API response not ok:', response.status, response.statusText);
          console.error('Response URL:', response.url);
          
          // Get error response text
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('=== NON-JSON RESPONSE ===');
          console.error('Response is not JSON:', contentType);
          const responseText = await response.text();
          console.error('Response text:', responseText);
          throw new Error('API returned non-JSON response');
        }

        let result;
        try {
          console.log('=== PARSING JSON ===');
          result = await response.json();
          console.log('=== PARSED RESULT ===');
          console.log('Result:', result);
          console.log('Result type:', typeof result);
          console.log('Result keys:', Object.keys(result));
        } catch (parseError) {
          console.error('=== JSON PARSING ERROR ===');
          console.error('Parse error:', parseError);
          const responseText = await response.text();
          console.error('Response text:', responseText);
          message.error('Failed to parse API response');
          return;
        }
        
        if (result.status === 'SUCCESS') {
          setApiStatus('connected');
          // Transform the API response to match our table format
          const transformedData = result.response.map((item, index) => ({
            key: item.id || index.toString(),
            filename: item.fileName,
            date: new Date(item.uploadedDate).toISOString().split('T')[0],
            numberOfRecords: item.totalRecordsCount || 0,
            status: item.status,
            fileSize: 'N/A', // API doesn't provide file size
            startTime: item.startTime,
            endTime: item.endTime,
            active: item.active,
            successRecordCount: item.successRecordCount || 0,
            failedRecordCount: item.failedRecordCount || 0,
            azureBlobPath: item.azureBlobPath
          }));
          setFileData(transformedData);
        } else if (result.error === 'Ngrok authentication required') {
          console.log('=== NGROK AUTHENTICATION REQUIRED ===');
          setApiStatus('ngrok-warning');
          message.warning('Ngrok tunnel requires authentication. Using local data.');
          // Use local data as fallback
          console.log('Fetching local data as fallback...');
          const localResponse = await fetch('/api/files/list');
          const localResult = await localResponse.json();
          if (localResult.success) {
            setFileData(localResult.data);
            console.log('Local data loaded successfully');
          }
        } else {
          console.log('=== API SUCCESS ===');
          setApiStatus('error');
          message.error(result.message || 'Failed to load files');
        }
        
        console.log('=== FRONTEND API DEBUG END ===');
      } catch (error) {
        console.error('=== FRONTEND ERROR ===');
        console.error('Error fetching files:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        // Fallback to local API if external API fails
        try {
          console.log('=== TRYING LOCAL API FALLBACK ===');
          const localResponse = await fetch('/api/files/list');
          const localResult = await localResponse.json();
          
          if (localResult.success) {
            setApiStatus('fallback');
            setFileData(localResult.data);
            message.warning('Using local data (external API unavailable)');
            console.log('Local fallback successful');
          } else {
            setApiStatus('error');
            message.error('Failed to load files from both external and local APIs');
            console.log('Local fallback failed');
          }
        } catch (localError) {
          console.error('=== LOCAL API ERROR ===');
          console.error('Local API also failed:', localError);
          setApiStatus('error');
          message.error('Failed to load files - external API may be down');
        }
      } finally {
        setLoading(false);
        console.log('=== FRONTEND API DEBUG COMPLETE ===');
      }
    };

    fetchFiles();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'processing';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status || 'Unknown';
    }
  };

  const handleReportDownload = (record) => {
    if (record.status === 'completed') {
      message.success(`Downloading report for ${record.filename}`);
      // Add actual download logic here
    } else {
      message.warning('Report is only available for completed files');
    }
  };

  const handleRowClick = (record) => {
    console.log('Row clicked:', record);
    // Navigate to patient list with batch ID
    window.location.href = `/home?batchId=${record.key}`;
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('excel', fileList[0]);

      console.log('Uploading file:', fileList[0].name, 'Size:', fileList[0].size);
      
      const response = await fetch('/api/external/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);

      let result;
      try {
        const responseText = await response.text();
        console.log('API Response:', responseText);
        
        // Try to parse as JSON, but handle non-JSON responses
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Response is not JSON, treating as success if status is 200');
          result = { success: response.ok };
        }
      } catch (error) {
        console.error('Response parsing error:', error);
        result = { success: response.ok };
      }

      if (response.ok) {
        // Check for invalid file response
        if (result.status === 'SUCCESS' && result.message === 'invalid file') {
          message.error('Invalid file format. Please upload a valid Excel file.');
          console.error('Invalid file error:', result);
          return;
        }
        
        const newFile = {
          key: Date.now().toString(),
          filename: fileList[0].name,
          date: new Date().toISOString().split('T')[0],
          numberOfRecords: result.numberOfRecords || result.records || Math.floor(Math.random() * 2000) + 500,
          status: 'processing',
          fileSize: `${(fileList[0].size / 1024 / 1024).toFixed(1)} MB`,
          successRecordCount: 0,
          failedRecordCount: 0
        };

        setFileList([]);
        setIsUploadModalVisible(false);
        message.success('File uploaded successfully!');
        
        // Refresh the file list to get latest data from API
        console.log('=== REFRESHING FILE LIST AFTER UPLOAD ===');
        try {
          const refreshResponse = await fetch('/api/external/allBatches', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            if (refreshResult.status === 'SUCCESS') {
              const refreshedData = refreshResult.response.map((item, index) => ({
                key: item.id || index.toString(),
                filename: item.fileName,
                date: new Date(item.uploadedDate).toISOString().split('T')[0],
                numberOfRecords: item.totalRecordsCount || 0,
                status: item.status,
                fileSize: 'N/A',
                startTime: item.startTime,
                endTime: item.endTime,
                active: item.active,
                successRecordCount: item.successRecordCount || 0,
                failedRecordCount: item.failedRecordCount || 0,
                azureBlobPath: item.azureBlobPath
              }));
              setFileData(refreshedData);
              console.log('File list refreshed successfully');
            } else {
              console.error('Failed to refresh file list:', refreshResult);
            }
          } else {
            console.error('Failed to refresh file list:', refreshResponse.status);
          }
        } catch (refreshError) {
          console.error('Error refreshing file list:', refreshError);
        }
      } else {
        const errorMessage = result.message || result.error || `Upload failed (${response.status})`;
        message.error(errorMessage);
        console.error('Upload failed:', response.status, result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel' ||
                      file.name.toLowerCase().endsWith('.xlsx') ||
                      file.name.toLowerCase().endsWith('.xls');
      
      if (!isExcel) {
        message.error('You can only upload Excel files (.xlsx, .xls)!');
        return false;
      }
      


      setFileList([file]);
      return false;
    },
    fileList,
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <div className={styles.fileNameCell}>
          <FileTextOutlined className={styles.fileIcon} />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Upload Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Total Records',
      dataIndex: 'numberOfRecords',
      key: 'numberOfRecords',
      render: (text) => text.toLocaleString(),
    },
    {
      title: 'Success Records',
      dataIndex: 'successRecordCount',
      key: 'successRecordCount',
      render: (text) => text.toLocaleString(),
    },
    {
      title: 'Failed Records',
      dataIndex: 'failedRecordCount',
      key: 'failedRecordCount',
      render: (text) => text.toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            disabled={record.status !== 'completed'}
            onClick={() => handleReportDownload(record)}
            className={styles.reportButton}
          >
            Report
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.filesContainer}>
      <Card className={styles.mainCard}>
        <Row justify="space-between" align="middle" className={styles.headerRow}>
          <Col>
            <Title level={2} className={styles.pageTitle}>
              File Management
            </Title>
                          <Text type="secondary">
                Upload and manage your data files
              </Text>

            </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsUploadModalVisible(true)}
              className={styles.uploadButton}
            >
              Upload File
            </Button>
          </Col>
        </Row>

        <Divider />

        <div className={styles.tableContainer}>
          <Table
            columns={columns}
            dataSource={fileData}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} files`,
            }}
            className={styles.dataTable}
            rowClassName={styles.tableRow}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
            locale={{
              emptyText: (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📁</div>
                  <div className={styles.emptyTitle}>No files uploaded yet</div>
                  <div className={styles.emptyDescription}>
                    Upload your first file to get started
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </Card>

      <Modal
        title="Upload File"
        open={isUploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setFileList([]);
        }}
        confirmLoading={uploading}
        okText="Upload"
        cancelText="Cancel"
        width={500}
        className={styles.uploadModal}
      >
        <div className={styles.uploadContent}>
          <Upload.Dragger {...uploadProps} className={styles.uploadDragger}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for Excel files (.xlsx, .xls) only
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default FilesPage; 