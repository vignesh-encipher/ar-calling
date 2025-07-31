import React, { useState, useEffect } from 'react';
import { Input, Space, Card, Typography, Tag, Button, message, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const { batchId } = router.query;
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callingPatientId, setCallingPatientId] = useState(null);

  // Check if router is ready and batchId is available
  useEffect(() => {
    // Router ready check - no logging needed
  }, [router.isReady, batchId]);

  // Load patients data from real API
  useEffect(() => {
    const loadPatients = async () => {
      if (!batchId) {
        return;
      }
      
      setLoading(true);
      
      try {
        
        // Call the external patients API with batch ID
        const response = await fetch(`/api/external/patients?batchId=${batchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform the API response to match our patient format
        let transformedPatients = [];
        if (data.status === 'SUCCESS' && data.response) {
          transformedPatients = data.response.map((patient, index) => ({
            key: patient.id || patient.patientId || index.toString(),
            patientName: `${patient.patientLastName || ''}, ${patient.patientFirstName || ''}`.trim() || `Patient ${index + 1}`,
            npi: patient.npiId || patient.npi || 'N/A',
            ptan: patient.ptanId || patient.ptan || 'N/A',
            tin: patient.tinId || patient.tin || 'N/A',
            medicareId: patient.medicareId || patient.medicare_id || 'N/A',
            dos: Array.isArray(patient.dos) ? patient.dos[0] || 'N/A' : patient.dos || patient.dateOfService || 'N/A',
            dob: patient.dob || patient.dateOfBirth || 'N/A',
            status: patient.status || 'active',
            chatCompleted: patient.chatCompleted || false,
            callId: patient.callId || null
          }));
        }

        setPatients(transformedPatients);
        
        message.success(`Loaded ${transformedPatients.length} patients successfully`);
        
      } catch (error) {
        console.error('❌ Error loading patients from API:', error);
        
        // Fallback to dummy data if API fails
        setPatients(dummyPatients);
        
        message.warning('Using dummy data (API unavailable)');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [batchId, router.isReady]);

  // Initialize chat completion status when patients change
  useEffect(() => {
    if (patients.length > 0) {
      patients.forEach(patient => {
        if (patient && patient.key) {
          onChatComplete(patient.key, patient.chatCompleted || false);
        }
      });
    }
  }, [patients]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    // Handle API date format (MMDDYYYY)
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const month = dateString.substring(0, 2);
      const day = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      return `${month}/${day}/${year}`;
    }
    
    // Handle other date formats
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

  // Handle bot click
  const handleChatClick = async (record) => {
    if (record.chatCompleted) {
      message.warning(`Chat with ${record.patientName} has already been completed.`);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (callingPatientId) {
      return;
    }
    
    setCallingPatientId(record.key);
    
    try {
      
      // Check if callId is already available from the patient record
      let callSid = record.callId;
      
      if (!callSid) {
        // Step 1: Try to call the connect API to get callSid
        let callResponse = await apiService.connectCall(record.key);
        
        // If real API fails, use mock data for testing
        if (!callResponse.success) {
          callResponse = await apiService.connectCallMock();
          message.warning('Using mock call data for testing (API unavailable)');
        }
        
        // Extract callSid from response
        if (callResponse.data && typeof callResponse.data === 'object' && callResponse.data.callSid) {
          callSid = callResponse.data.callSid;
        } else if (typeof callResponse.data === 'string') {
          // API returns callSid directly as a string
          callSid = callResponse.data;
        } else if (callResponse.data && typeof callResponse.data === 'object') {
          // Try alternative field names
          callSid = callResponse.data.id || 
                   callResponse.data.call_id || 
                   callResponse.data.callId || 
                   callResponse.data.sid ||
                   callResponse.data.CallSid;
        }
        
        if (!callSid) {
          // Last resort: try to find callSid anywhere in the response
          const responseString = JSON.stringify(callResponse);
          const callSidMatch = responseString.match(/"callSid"\s*:\s*"([^"]+)"/);
          if (callSidMatch) {
            callSid = callSidMatch[1];
          } else {
            throw new Error(`No callSid received from call API. Response: ${JSON.stringify(callResponse.data)}`);
          }
        }
      }
      
      // Step 2: Set selected patient to trigger chat
      onPatientSelect(record);
      
      // Step 3: Connect to real WebSocket with callSid
      try {
        await socketService.connect(callSid);
      } catch (socketError) {
        console.error('❌ Real WebSocket connection failed:', socketError);
        // Don't throw error, continue with mock if needed
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

  // Handle view chat history
  const handleViewChat = async (patient) => {
    if (!patient.callId) {
      message.warning('No call ID available for this patient.');
      return;
    }

    try {
      // Step 1: Disconnect current socket if connected to a different patient
      const currentConnectionStatus = socketService.getConnectionStatus();
      if (currentConnectionStatus.isConnected && currentConnectionStatus.callSid !== patient.callId) {
        socketService.disconnect();
      }
      
      const response = await fetch(`/api/external/chatHistory?callId=${patient.callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'SUCCESS' && data.response) {
        // Step 2: Connect to WebSocket directly with existing callId
        try {
          await socketService.connect(patient.callId);
          
          // Test the connection
          const connectionStatus = socketService.getConnectionStatus();

          
        } catch (socketError) {
          console.error('❌ WebSocket connection failed:', socketError);
          
          
          // Try to get more details about the failure
          const connectionStatus = socketService.getConnectionStatus();
          
        }

        // Step 3: Pass the chat data to the parent component to display in chat
        onPatientSelect({
          ...patient,
          chatHistory: data.response.chat || []
        });
        
        message.success(`Chat history loaded for ${patient.patientName}`);
      } else {
        message.error('Failed to load chat history');
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      message.error(`Failed to load chat history: ${error.message}`);
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
  const handleBackToFiles = () => {
    router.push('/files');
  };

  const handleRetry = () => {
    if (!batchId) {
      message.error('No batch ID available. Please check the URL and try again.');
      return;
    }
    
    setLoading(true);
    setPatients([]);
    
            setTimeout(() => {
          const loadPatients = async () => {
            try {
              // Call the external patients API with batch ID
              const response = await fetch(`/api/external/patients?batchId=${batchId}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();

          // Transform the API response to match our patient format
          let transformedPatients = [];
          if (data.status === 'SUCCESS' && data.response) {
            transformedPatients = data.response.map((patient, index) => ({
              key: patient.id || patient.patientId || index.toString(),
              patientName: `${patient.patientLastName || ''}, ${patient.patientFirstName || ''}`.trim() || `Patient ${index + 1}`,
              npi: patient.npiId || patient.npi || 'N/A',
              ptan: patient.ptanId || patient.ptan || 'N/A',
              tin: patient.tinId || patient.tin || 'N/A',
              medicareId: patient.medicareId || patient.medicare_id || 'N/A',
              dos: Array.isArray(patient.dos) ? patient.dos[0] || 'N/A' : patient.dos || patient.dateOfService || 'N/A',
              dob: patient.dob || patient.dateOfBirth || 'N/A',
              status: patient.status || 'active',
              chatCompleted: patient.chatCompleted || false,
              callId: patient.callId || null
            }));
          }

          setPatients(transformedPatients);
          
          message.success(`Retry successful! Loaded ${transformedPatients.length} patients`);
          
        } catch (error) {
          console.error('❌ Retry failed:', error);
          
          // Fallback to dummy data
          setPatients(dummyPatients);
          
          message.warning('Retry failed, using dummy data');
        } finally {
          setLoading(false);
        }
      };
      
      loadPatients();
    }, 1000);
  };

  const renderPatientCard = (patient) => (
    <div 
      key={patient.key}
      className={`${styles.patientCard} ${selectedPatient?.key === patient.key ? styles.patientCardSelected : ''}`}
    >
      <div className={styles.patientCardBody}>
        <div className={styles.patientInfoLayout}>
          <div className={styles.patientInfoContent}>
            <div className={styles.patientNameSection}>
              <UserOutlined className={`${styles.patientIcon} ${selectedPatient?.key === patient.key ? styles.patientIconSelected : ''}`} />
              <Text strong className={`${styles.patientName} ${selectedPatient?.key === patient.key ? styles.patientNameSelected : ''}`}>
                {patient.patientName}
              </Text>
            </div>
            
            <div className={`${styles.patientDetailsGrid} ${selectedPatient?.key === patient.key ? styles.patientDetailsGridSelected : ''}`}>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>NPI:</Text>
                <br />
                <Tooltip title={patient.npi} placement="top">
                  <Text code className={`${styles.codeElement} ${selectedPatient?.key === patient.key ? styles.codeElementSelected : ''}`}>{patient.npi}</Text>
                </Tooltip>
              </div>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>PTAN:</Text>
                <br />
                <Text strong className={`${styles.detailValue} ${selectedPatient?.key === patient.key ? styles.detailValueSelected : ''}`}>{patient.ptan}</Text>
              </div>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>TIN:</Text>
                <br />
                <Text className={`${styles.detailValue} ${selectedPatient?.key === patient.key ? styles.detailValueSelected : ''}`}>{patient.tin}</Text>
              </div>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>Medicare ID:</Text>
                <br />
                <Tooltip title={patient.medicareId} placement="top">
                  <Text code className={`${styles.codeElement} ${selectedPatient?.key === patient.key ? styles.codeElementSelected : ''}`}>{patient.medicareId}</Text>
                </Tooltip>
              </div>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>DOS:</Text>
                <br />
                <Text className={`${styles.detailValue} ${selectedPatient?.key === patient.key ? styles.detailValueSelected : ''}`}>{formatDate(patient.dos)}</Text>
              </div>
              <div>
                <Text type="secondary" className={`${styles.detailLabel} ${selectedPatient?.key === patient.key ? styles.detailLabelSelected : ''}`}>DOB:</Text>
                <br />
                <Text className={`${styles.detailValue} ${selectedPatient?.key === patient.key ? styles.detailValueSelected : ''}`}>{formatDate(patient.dob)}</Text>
              </div>
            </div>
          </div>
          
          <div className={styles.actionButtons}>
 
            
            {patient.callId && (
              <Button
                type="default"
                icon={<MessageOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewChat(patient);
                }}
                className={styles.viewChatButton}
              >
                View Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBackToFiles}
            style={{ marginRight: '12px' }}
            size="small"
          >
            Back to Files
          </Button>
          
        </div>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Click "Call" to start chatting with a patient
        </Text>
      </div>

      {/* Patient List Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '16px',
        backgroundColor: '#ffffff'
      }}>
        {!router.isReady || loading ? (
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
            <Text type="secondary">
              {!router.isReady ? 'Initializing...' : 'Loading patients...'}
            </Text>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ marginBottom: '16px' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            </div>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              {!batchId ? 'No batch ID found in URL.' : 'No patients available.'}
            </Text>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>
              {!batchId ? 'Please check the URL and try again.' : 'Please check your connection or try again later.'}
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