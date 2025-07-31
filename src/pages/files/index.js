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

    // Fetch files from API
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/external/allBatches', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          // Get error response text
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          throw new Error('API returned non-JSON response');
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          message.error('Failed to parse API response');
          return;
        }
        
        if (result.status === 'SUCCESS') {
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
          message.warning('Ngrok tunnel requires authentication. Using local data.');
          // Use local data as fallback
          const localResponse = await fetch('/api/files/list');
          const localResult = await localResponse.json();
          if (localResult.success) {
            setFileData(localResult.data);
          }
        } else {
          message.error(result.message || 'Failed to load files');
        }
      } catch (error) {
        // Fallback to local API if external API fails
        try {
          const localResponse = await fetch('/api/files/list');
          const localResult = await localResponse.json();
          
          if (localResult.success) {
            setFileData(localResult.data);
            message.warning('Using local data (external API unavailable)');
          } else {
            message.error('Failed to load files from both external and local APIs');
          }
        } catch (localError) {
          message.error('Failed to load files - external API may be down');
        }
      } finally {
        setLoading(false);
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
      
      const response = await fetch('/api/external/upload', {
        method: 'POST',
        body: formData,
      });

      let result;
      try {
        const responseText = await response.text();
        
        // Try to parse as JSON, but handle non-JSON responses
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          result = { success: response.ok };
        }
      } catch (error) {
        result = { success: response.ok };
      }

      if (response.ok) {
        // Check for invalid file response
        if (result.status === 'SUCCESS' && result.message === 'invalid file') {
          message.error('Invalid file format. Please upload a valid Excel file.');
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
            }
          }
        } catch (refreshError) {
          // Silent error handling for refresh
        }
      } else {
        const errorMessage = result.message || result.error || `Upload failed (${response.status})`;
        message.error(errorMessage);
      }
    } catch (error) {
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
          <Upload.Dragger 
            {...uploadProps} 
            className={styles.uploadDragger}
            style={{ border: 'none', borderStyle: 'none', borderWidth: 0, borderColor: 'transparent' }}
          >
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