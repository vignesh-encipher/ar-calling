import React, { useState, useEffect } from 'react';
import { Input, Space, Card, Typography, Tag, Button, message, Row, Col } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';


import { apiService } from '../../../utils/network';
import styles from './styles.module.css';
import socketService from '../../../utils/network/socketService';

const { Search } = Input;
const { Title, Text } = Typography;

// Dummy patient data - Updated with new patients only

const dummyPatients = [
  {
    key: '1',
    patientName: 'Washington, Harriet',
    npi: '1497194153',
    ptan: '312193',
    tin: '454852156',
    medicareId: '4WT7DF1KU57',
    dos: '5/29/2025',
    dob: '9/1/1941',
    status: 'active',
    chatCompleted: false
  },
  {
    key: '2',
    patientName: 'Ford, David',
    npi: '1962841627',
    ptan: '312193',
    tin: '454852156',
    medicareId: '4ME1KG4VJ20',
    dos: '6/30/2025',
    dob: '5/4/1962',
    status: 'active',
    chatCompleted: false
  }
];

const PatientList = ({ onPatientSelect, selectedPatient, chatCompletionStatus, onChatComplete }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callingPatientId, setCallingPatientId] = useState(null);

  // Load patients data from real API
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      
      try {
        console.log('🔄 Fetching patients from API...');
        
        // Call the proxy API route to avoid CORS issues
        const response = await fetch('/api/patients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 API Response:', data);

        // Data is already transformed by the proxy API route
        const transformedPatients = data || [];

        setPatients(transformedPatients);
        
        // Initialize chat completion status
        const initialStatus = {};
        transformedPatients.forEach(patient => {
          if (patient && patient.key) {
            initialStatus[patient.key] = patient.chatCompleted || false;
            onChatComplete(patient.key, patient.chatCompleted || false);
          }
        });
        
        console.log('✅ Loaded patients from API:', transformedPatients.length);
        message.success(`Loaded ${transformedPatients.length} patients successfully`);
        
      } catch (error) {
        console.error('❌ Error loading patients from API:', error);
        
        // Fallback to dummy data if API fails
        console.log('⚠️ API failed, falling back to dummy data...');
        setPatients(dummyPatients);
        
        const initialStatus = {};
        dummyPatients.forEach(patient => {
          if (patient && patient.key) {
            initialStatus[patient.key] = patient.chatCompleted || false;
            onChatComplete(patient.key, patient.chatCompleted || false);
          }
        });
        
        message.warning('Using dummy data (API unavailable)');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('MM/DD/YYYY');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'pending':
        return '#fa8c16';
      case 'inactive':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  // Handle chat click
  const handleChatClick = async (record) => {
    if (record.chatCompleted) {
      message.warning(`Chat with ${record.patientName} has already been completed.`);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (callingPatientId) {
      console.log('⚠️ Call already in progress, ignoring click');
      return;
    }
    
    setCallingPatientId(record.key);
    
    try {
      console.log('📞 Starting call process for patient:', record.key);
      
      // Step 1: Try to call the connect API to get callSid
      let callResponse = await apiService.connectCall(record.key);
      
      // If real API fails, use mock data for testing
      if (!callResponse.success) {
        console.log('⚠️ Real API failed, using mock data for testing...');
        callResponse = await apiService.connectCallMock();
        message.warning('Using mock call data for testing (API unavailable)');
      }
      
      // Debug: Log the full response to see what we're getting
      console.log('🔍 Full API Response:', callResponse);
      console.log('🔍 Response data:', callResponse.data);
      console.log('🔍 Response data type:', typeof callResponse.data);
      
      // Extract callSid from response
      let callSid = null;
      
      console.log('🔍 Full response structure:', JSON.stringify(callResponse, null, 2));
      console.log('🔍 callResponse.data type:', typeof callResponse.data);
      console.log('🔍 callResponse.data:', callResponse.data);
      
      // Check if data exists and has callSid
      if (callResponse.data && typeof callResponse.data === 'object' && callResponse.data.callSid) {
        callSid = callResponse.data.callSid;
        console.log('✅ Found callSid directly:', callSid);
      } else if (typeof callResponse.data === 'string') {
        // API returns callSid directly as a string
        callSid = callResponse.data;
        console.log('✅ Found callSid as string:', callSid);
      } else if (callResponse.data && typeof callResponse.data === 'object') {
        // Try alternative field names
        console.log('🔍 Available keys in data:', Object.keys(callResponse.data));
        callSid = callResponse.data.id || 
                 callResponse.data.call_id || 
                 callResponse.data.callId || 
                 callResponse.data.sid ||
                 callResponse.data.CallSid;
        console.log('✅ Found callSid from alternative fields:', callSid);
      }
      
      if (!callSid) {
        console.error('❌ No callSid found in response. Full response:', JSON.stringify(callResponse, null, 2));
        
        // Last resort: try to find callSid anywhere in the response
        const responseString = JSON.stringify(callResponse);
        const callSidMatch = responseString.match(/"callSid"\s*:\s*"([^"]+)"/);
        if (callSidMatch) {
          callSid = callSidMatch[1];
          console.log('✅ Found callSid using regex fallback:', callSid);
        } else {
          throw new Error(`No callSid received from call API. Response: ${JSON.stringify(callResponse.data)}`);
        }
      }
      
      console.log('✅ Received callSid:', callSid);
      
      // Step 2: Set selected patient to trigger chat
      onPatientSelect(record);
      
      // Step 3: Connect to real WebSocket with callSid
      console.log('🔌 Attempting real WebSocket connection with callSid:', callSid);
      try {
        await socketService.connect(callSid);
        console.log('✅ Real WebSocket connection successful');
      } catch (socketError) {
        console.error('❌ Real WebSocket connection failed:', socketError);
        // Don't throw error, continue with mock if needed
        console.log('⚠️ Continuing with mock socket...');
      }
      
      message.success(`Call connected with ${record.patientName} (Call ID: ${callSid})`);
      
    } catch (error) {
      console.error('❌ Error starting call:', error);
      message.error(`Failed to start call: ${error.message}`);
      onPatientSelect(null);
    } finally {
      setCallingPatientId(null);
    }
  };

  // Handle chat completion
  const handleChatComplete = (patientId, isCompleted) => {
    onChatComplete(patientId, isCompleted);
    
    setPatients(prev => prev.map(patient => 
      patient.key === patientId 
        ? { ...patient, chatCompleted: isCompleted }
        : patient
    ));
  };

  // Manual retry function
  const handleRetry = () => {
    setLoading(true);
    setPatients([]);
    
    setTimeout(() => {
      const loadPatients = async () => {
        try {
          console.log('🔄 Retrying API call...');
          
          // Call the proxy API route to avoid CORS issues
          const response = await fetch('/api/patients', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('📊 Retry API Response:', data);

          // Data is already transformed by the proxy API route
          const transformedPatients = data || [];

          setPatients(transformedPatients);
          
          // Initialize chat completion status
          transformedPatients.forEach(patient => {
            if (patient && patient.key) {
              onChatComplete(patient.key, patient.chatCompleted || false);
            }
          });
          
          message.success(`Retry successful! Loaded ${transformedPatients.length} patients`);
          
        } catch (error) {
          console.error('❌ Retry failed:', error);
          
          // Fallback to dummy data
          setPatients(dummyPatients);
          
          dummyPatients.forEach(patient => {
            if (patient && patient.key) {
              onChatComplete(patient.key, patient.chatCompleted || false);
            }
          });
          
          message.warning('Retry failed, using dummy data');
        } finally {
          setLoading(false);
        }
      };
      
      loadPatients();
    }, 1000);
  };

  const renderPatientCard = (patient) => (
    <Card
      key={patient.key}
      size="small"
      style={{ 
        marginBottom: '8px',
        border: selectedPatient?.key === patient.key ? '2px solid #1890ff' : '1px solid #e8e8e8',
        borderRadius: '8px',
        boxShadow: selectedPatient?.key === patient.key ? '0 2px 8px rgba(24,144,255,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div className={styles.patientInfoLayout}>
        <div className={styles.patientInfoContent}>
          <div className={styles.patientNameSection}>
            <UserOutlined className={styles.patientIcon} />
            <Text strong className={styles.patientName}>
              {patient.patientName}
            </Text>
          </div>
          
          <div className={styles.patientDetailsGrid}>
            <div>
              <Text type="secondary" className={styles.detailLabel}>NPI:</Text>
              <br />
              <Text code className={styles.codeElement}>{patient.npi}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.detailLabel}>PTAN:</Text>
              <br />
              <Text strong className={styles.detailValue}>{patient.ptan}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.detailLabel}>TIN:</Text>
              <br />
              <Text className={styles.detailValue}>{patient.tin}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.detailLabel}>Medicare ID:</Text>
              <br />
              <Text code className={styles.codeElement}>{patient.medicareId}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.detailLabel}>DOS:</Text>
              <br />
              <Text className={styles.detailValue}>{formatDate(patient.dos)}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.detailLabel}>DOB:</Text>
              <br />
              <Text className={styles.detailValue}>{formatDate(patient.dob)}</Text>
            </div>
          </div>
        </div>
        
        <div className={styles.actionButtons}>
          <Button
            type={patient.chatCompleted ? "default" : "primary"}
            icon={<MessageOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleChatClick(patient);
            }}
            disabled={patient.chatCompleted || callingPatientId === patient.key}
            loading={callingPatientId === patient.key}
            className={patient.chatCompleted ? `${styles.chatButton} ${styles.chatButtonCompleted}` : styles.chatButton}
          >
            {patient.chatCompleted ? 'Completed' : callingPatientId === patient.key ? 'Connecting...' : 'Call'}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#fafafa'
      }}>
        <Title level={4} style={{ margin: 0, color: '#04306f' }}>
          Patient List ({patients.length} patients)
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Click "Call" to start chatting with a patient
        </Text>
      </div>

      {/* Patient List Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="ant-spin ant-spin-lg ant-spin-spinning">
              <span className="ant-spin-dot ant-spin-dot-spin">
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
              </span>
            </div>
            <br />
            <Text type="secondary">Loading patients...</Text>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ marginBottom: '16px' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            </div>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              No patients available.
            </Text>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>
              Please check your connection or try again later.
            </Text>
            <Button 
              type="primary" 
              onClick={handleRetry}
              icon={<SearchOutlined />}
              loading={loading}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(patients || []).filter(patient => patient && patient.key).map(renderPatientCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList; 