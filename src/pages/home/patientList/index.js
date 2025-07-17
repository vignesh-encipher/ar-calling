import React, { useState, useEffect } from 'react';
import { Input, Space, Card, Typography, Tag, Button, message, Row, Col, Badge, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined, IdcardOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ChatComponent from '../patientChat';
import styles from './styles.module.css';

const { Search } = Input;
const { Title, Text } = Typography;

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatCompletionStatus, setChatCompletionStatus] = useState({});

    // Your provided data with chat completion status
  const samplePatients = [
    {
      key: '1',
      npi: '1972941862',
      ptan: '312190',
      tin: '52156',
      medicareId: 'MC04Q0CL2C017',
      patientName: 'Windsor, Barbara',
      dos: '7/11/2025',
      dob: '8/2/1948',
      status: 'active',
      chatCompleted: false // Chat enabled - can start chatting
    },
    {
      key: '2',
      npi: '1972941862',
      ptan: '312190',
      tin: '52156',
      medicareId: 'MC04Q0CS4C017',
      patientName: 'Gallacher, Angela',
      dos: '7/11/2025',
      dob: '7/4/1954',
      status: 'active',
      chatCompleted: true // Chat completed - disabled
    },
    {
      key: '3',
      npi: '1972941862',
      ptan: '312190',
      tin: '52156',
      medicareId: 'MC04Q0CT1C017',
      patientName: 'Jedrlinic, Elizabeth',
      dos: '7/11/2025',
      dob: '2/19/1947',
      status: 'pending',
      chatCompleted: false // Chat enabled - can start chatting
    },
    {
      key: '4',
      npi: '1972941862',
      ptan: '312190',
      tin: '52156',
      medicareId: 'MC03GEDB7C017',
      patientName: 'LEE, WILLIAM',
      dos: '7/29/2024',
      dob: '6/2/1961',
      status: 'active',
      chatCompleted: true // Chat completed - disabled
    },
    {
      key: '5',
      npi: '1972941862',
      ptan: '312190',
      tin: '52156',
      medicareId: 'MC04GRBP7C017',
      patientName: 'Butler, Francis',
      dos: '5/8/2025',
      dob: '1/18/1948',
      status: 'active',
      chatCompleted: false // Chat enabled - can start chatting
    }
  ];

  // Load patients data
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        setPatients(samplePatients);
        
        // Initialize chat completion status from patient data
        const initialStatus = {};
        samplePatients.forEach(patient => {
          initialStatus[patient.key] = patient.chatCompleted || false;
        });
        setChatCompletionStatus(initialStatus);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      patient.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
      patient.medicareId.toLowerCase().includes(searchText.toLowerCase()) ||
      patient.npi.includes(searchText) ||
      patient.ptan.includes(searchText)
    );
    setFilteredPatients(filtered);
  }, [searchText, patients]);

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

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  // Handle chat click
  const handleChatClick = (record) => {
    if (record.chatCompleted) {
      message.warning(`Chat with ${record.patientName} has already been completed.`);
      return;
    }
    setSelectedPatient(record);
    message.info(`Starting chat with ${record.patientName}`);
  };

  // Handle chat completion
  const handleChatComplete = (patientId, isCompleted) => {
    setChatCompletionStatus(prev => ({
      ...prev,
      [patientId]: isCompleted
    }));
    
    // Update patient status in the list
    setPatients(prev => prev.map(patient => 
      patient.key === patientId 
        ? { ...patient, chatCompleted: isCompleted }
        : patient
    ));
  };

  // Check if patient has completed chat
  const isChatCompleted = (patientId) => {
    const patient = patients.find(p => p.key === patientId);
    return patient ? patient.chatCompleted : false;
  };

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
              {/* Search Bar */}
              <Search
                placeholder="Search by patient name, Medicare ID, NPI, or PTAN..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
              />

              {/* Patient Cards Container */}
              <div className={styles.patientCardsContainer}>
                {filteredPatients.map((patient) => {
                  const isSelected = selectedPatient?.key === patient.key;
                  return (
                    <Card
                      key={patient.key}
                      size="small"
                      className={`${styles.patientCard} ${isSelected ? styles.patientCardSelected : ''}`}
                      hoverable
                      bodyStyle={{ padding: '16px' }}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className={styles.patientInfoLayout}>
                        <div className={styles.patientInfoContent}>
                          <div className={styles.patientNameSection}>
                            <UserOutlined className={`${styles.patientIcon} ${isSelected ? styles.patientIconSelected : ''}`} />
                            <Text strong className={`${styles.patientName} ${isSelected ? styles.patientNameSelected : ''}`}>
                              {patient.patientName}
                            </Text>
                            <Tag 
                              color={patient.chatCompleted ? "#52c41a" : getStatusColor(patient.status)} 
                              className={styles.statusTag}
                              icon={patient.chatCompleted ? <CheckCircleOutlined /> : null}
                            >
                              {patient.chatCompleted ? 'COMPLETED' : patient.status?.toUpperCase()}
                            </Tag>
                          </div>
                          
                          <div className={`${styles.patientDetailsGrid} ${isSelected ? styles.patientDetailsGridSelected : ''}`}>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>NPI:</Text>
                              <br />
                              <Text code className={`${styles.codeElement} ${isSelected ? styles.codeElementSelected : ''}`}>{patient.npi}</Text>
                            </div>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>PTAN:</Text>
                              <br />
                              <Text strong className={`${styles.detailValue} ${isSelected ? styles.detailValueSelected : ''}`}>{patient.ptan}</Text>
                            </div>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>TIN:</Text>
                              <br />
                              <Text className={`${styles.detailValue} ${isSelected ? styles.detailValueSelected : ''}`}>{patient.tin}</Text>
                            </div>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>Medicare ID:</Text>
                              <br />
                              <Text code className={`${styles.codeElement} ${isSelected ? styles.codeElementSelected : ''}`}>{patient.medicareId}</Text>
                            </div>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>DOS:</Text>
                              <br />
                              <Text className={`${styles.detailValue} ${isSelected ? styles.detailValueSelected : ''}`}>{formatDate(patient.dos)}</Text>
                            </div>
                            <div>
                              <Text type="secondary" className={`${styles.detailLabel} ${isSelected ? styles.detailLabelSelected : ''}`}>DOB:</Text>
                              <br />
                              <Text className={`${styles.detailValue} ${isSelected ? styles.detailValueSelected : ''}`}>{formatDate(patient.dob)}</Text>
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.actionButtons}>
                          {patient.chatCompleted && (
                            <Tooltip title="Chat completed">
                              <CheckCircleOutlined className={`${styles.completionIcon} ${isSelected ? styles.completionIconSelected : ''}`} />
                            </Tooltip>
                          )}
                          <Button
                            type={patient.chatCompleted ? "default" : "primary"}
                            icon={<MessageOutlined />}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChatClick(patient);
                            }}
                            disabled={patient.chatCompleted}
                            className={`${styles.chatButton} ${patient.chatCompleted ? styles.chatButtonCompleted : ''} ${isSelected ? styles.chatButtonSelected : ''}`}
                          >
                            {patient.chatCompleted ? 'Completed' : 'Call'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
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