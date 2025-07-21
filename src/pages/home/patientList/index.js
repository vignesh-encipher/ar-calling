import React, { useState, useEffect } from 'react';
import { Input, Space, Card, Typography, Tag, Button, message, Row, Col } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import ChatComponent from '../patientChat';
import { apiService } from '../../../utils/network';
import styles from './styles.module.css';
import socketService from '../../../utils/network/socketService';

const { Search } = Input;
const { Title, Text } = Typography;

// Dummy patient data

const dummyPatients = [
  {
  key: '1',
  patientName: 'Wood, Robert',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: '7CQ1NF4JC21',
  dos: '5/15/2025',
  dob: '3/1/1946',
  status: 'active',
  chatCompleted: false
  },
  {
  key: '2',
  patientName: 'FINK, DIANE',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: '2JE9WC1MH00',
  dos: '7/15/2025',
  dob: '9/23/1958',
  status: 'pending',
  chatCompleted: true
  },
  {
  key: '3',
  patientName: 'Vincent, Linda',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: '6E46XJ0FM42',
  dos: '7/15/2025',
  dob: '3/10/1951',
  status: 'active',
  chatCompleted: false
  },
  {
  key: '4',
  patientName: 'Emily Davis',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: 'MED004567',
  dos: '2024-01-18',
  dob: '1985-11-08',
  status: 'inactive',
  chatCompleted: false
  },
  {
  key: '5',
  patientName: 'Suvarnasuddhi, Khanan',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: '3HW6QC3QK44',
  dos: '7/15/2025',
  dob: '6/15/1956',
  status: 'active',
  chatCompleted: false
  },
  {
  key: '6',
  patientName: 'Adise, Nancy',
  npi: '1497194153',
  ptan: '454852156',
  tin: '312193',
  medicareId: '3XJ8YG5QJ43',
  dos: '15/5/2025',
  dob: '6/8/1959',
  status: 'pending',
  chatCompleted: false
  }
  ];

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatCompletionStatus, setChatCompletionStatus] = useState({});
  const [callingPatientId, setCallingPatientId] = useState(null);

  // Load patients data from dummy data
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use dummy data instead of API call
        setPatients(dummyPatients);
        
        const initialStatus = {};
        dummyPatients.forEach(patient => {
          if (patient && patient.key) {
            initialStatus[patient.key] = patient.chatCompleted || false;
          }
        });
        setChatCompletionStatus(initialStatus);
        
        console.log('✅ Loaded dummy patients:', dummyPatients.length);
        
      } catch (error) {
        console.error('Error loading patients:', error);
        setPatients([]);
        setChatCompletionStatus({});
        message.error('Failed to load patients');
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
    
    setCallingPatientId(record.key);
    
    try {
      console.log('📞 Starting call process for patient:', record.key);
      
      // Step 1: Try to call the connect API to get callSid
      let callResponse = await apiService.connectCall();
      
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
      
      // Handle different response formats
      let callSid;
      
      if (typeof callResponse.data === 'string') {
        // API returns callSid directly as a string
        callSid = callResponse.data;
        console.log('✅ Found callSid as direct string:', callSid);
      } else if (typeof callResponse.data === 'object' && callResponse.data !== null) {
        // API returns an object, try to find callSid in various fields
        console.log('🔍 Response data keys:', Object.keys(callResponse.data));
        callSid = callResponse.data?.callSid || 
                 callResponse.data?.id || 
                 callResponse.data?.call_id || 
                 callResponse.data?.callId || 
                 callResponse.data?.sid ||
                 callResponse.data?.CallSid;
      }
      
      if (!callSid) {
        console.error('❌ No callSid found in response. Response:', callResponse.data);
        throw new Error(`No callSid received from call API. Response: ${JSON.stringify(callResponse.data)}`);
      }
      
      console.log('✅ Received callSid:', callSid);
      
      // Step 2: Set selected patient to trigger chat
      setSelectedPatient(record);
      
      // Step 3: Connect to WebSocket with callSid
      await socketService.connect(callSid);
      
      message.success(`Call connected with ${record.patientName} (Call ID: ${callSid})`);
      
    } catch (error) {
      console.error('❌ Error starting call:', error);
      message.error(`Failed to start call: ${error.message}`);
      setSelectedPatient(null);
    } finally {
      setCallingPatientId(null);
    }
  };

  // Handle chat completion
  const handleChatComplete = (patientId, isCompleted) => {
    setChatCompletionStatus(prev => ({
      ...prev,
      [patientId]: isCompleted
    }));
    
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
    setChatCompletionStatus({});
    
    setTimeout(() => {
      const loadPatients = async () => {
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use dummy data instead of API call
          setPatients(dummyPatients);
          
          const initialStatus = {};
          dummyPatients.forEach(patient => {
            if (patient && patient.key) {
              initialStatus[patient.key] = patient.chatCompleted || false;
            }
          });
          setChatCompletionStatus(initialStatus);
          message.success('Patients loaded successfully');
          
        } catch (error) {
          console.error('Retry failed:', error);
          setPatients([]);
          message.error('Failed to load patients');
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
      className={styles.patientCard}
      bodyStyle={{ padding: '16px' }}
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
    <div className={styles.patientListContainer}>
      <Row gutter={24}>
        {/* Left Side - Patient List */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className={styles.patientListHeader}>
                <Title level={4} className={styles.patientListTitle}>
                  Patient List
                </Title>
              </div>
            }
            className={styles.patientListCard}
            headStyle={{ padding: 0, border: 'none' }}
            bodyStyle={{ padding: '24px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Patient Cards Container */}
              <div className={styles.patientCardsContainer}>
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
                  (patients || []).filter(patient => patient && patient.key).map(renderPatientCard)
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* Right Side - Chat Component */}
        <Col xs={24} lg={12}>
          <ChatComponent 
            selectedPatient={selectedPatient}
            onChatComplete={handleChatComplete}
            onClose={() => setSelectedPatient(null)}
          />
        </Col>
      </Row>
    </div>
  );
};

export default PatientList; 