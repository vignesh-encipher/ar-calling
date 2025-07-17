import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Avatar, 
  Space, 
  Divider, 
  Tag, 
  message, 
  Spin,
  Tooltip,
  Badge
} from 'antd';
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import chatService from '../../../services/chatService';
import styles from './styles.module.css';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatComponent = ({ selectedPatient, onChatComplete, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatCompletionStatus, setChatCompletionStatus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadChatHistory(selectedPatient.key);
      checkChatCompletionStatus(selectedPatient.key);
    }
  }, [selectedPatient]);

  // Load chat history from backend
  const loadChatHistory = async (patientId) => {
    setLoading(true);
    try {
      const response = await chatService.getChatHistory(patientId);
      
      if (response.success) {
        setChatHistory(response.data.messages);
        setMessages(response.data.messages);
      } else {
        setChatHistory([]);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Check chat completion status from backend
  const checkChatCompletionStatus = async (patientId) => {
    try {
      const response = await chatService.checkChatStatus(patientId);
      
      if (response.success) {
        setChatCompletionStatus(response.data.isCompleted);
      } else {
        setChatCompletionStatus(selectedPatient?.chatCompleted || false);
      }
    } catch (error) {
      console.error('Error checking chat completion status:', error);
      setChatCompletionStatus(selectedPatient?.chatCompleted || false);
    }
  };

  // Simulate conversation flow automatically
  const simulateConversation = async () => {
    if (!selectedPatient) return;

    // Get conversation scenario based on patient ID
    const response = await chatService.getChatHistory(selectedPatient.key);
    const scenario = response.data.scenario || 'medicare_coverage';
    
    // Get conversation flow for this scenario
    const conversationSteps = chatService.generateConversationFlow(scenario);

    for (let i = 0; i < conversationSteps.length; i++) {
      const step = conversationSteps[i];
      
      // Show typing indicator for User B
      if (step.sender.id === chatService.mockUsers.userB.id) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsTyping(false);
      }

      // Add message
      const newMessage = {
        id: Date.now() + i,
        text: step.text,
        sender: step.sender,
        timestamp: new Date().toISOString(),
        patientId: selectedPatient.key
      };

      setMessages(prev => [...prev, newMessage]);

      // Check if conversation is completed
      if (step.isCompleted) {
        setChatCompletionStatus(true);
        onChatComplete && onChatComplete(selectedPatient.key, true);
        message.success('Chat completed successfully!');
        break;
      }

      // Wait before next message
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  };

  // Start conversation when patient is selected
  useEffect(() => {
    if (selectedPatient && messages.length === 1) {
      // Start conversation after initial greeting
      setTimeout(() => {
        simulateConversation();
      }, 2000);
    }
  }, [selectedPatient, messages.length]);

  // Legacy send message function (kept for compatibility)
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;
    // This function is now disabled since we're using automatic conversation
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm');
  };

  // Get message bubble style
  const getMessageStyle = (sender, isError = false) => {
    const baseStyle = {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '12px',
      marginBottom: '8px',
      wordWrap: 'break-word',
      position: 'relative'
    };

    if (sender.id === chatService.mockUsers.userA.id) {
      return {
        ...baseStyle,
        backgroundColor: '#1890ff',
        color: 'white',
        marginLeft: 'auto',
        borderBottomRightRadius: '4px'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: isError ? '#ff4d4f' : '#f0f0f0',
        color: isError ? 'white' : '#333',
        marginRight: 'auto',
        borderBottomLeftRadius: '4px'
      };
    }
  };

  if (!selectedPatient) {
    return (
      <Card 
        title={
          <div className={styles.chatHeader}>
            <Title level={4} className={styles.chatTitle}>
              Chat Area
            </Title>
          </div>
        }
        className={styles.chatContainer}
        headStyle={{ padding: 0, border: 'none' }}
        bodyStyle={{ padding: '24px' }}
      >
        <div className={styles.welcomeState}>
          <div className={styles.welcomeContent}>
            <RobotOutlined className={styles.welcomeIcon} />
            <br />
            Select a patient to start chatting
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderContent}>
            <Title level={4} className={styles.chatTitle}>
              Chat with {selectedPatient.patientName}
            </Title>
            <Space>
              <Badge 
                status={chatCompletionStatus ? "success" : "processing"} 
                text={
                  <Text className={styles.chatStatus}>
                    {chatCompletionStatus ? 'Completed' : 'In Progress'}
                  </Text>
                }
              />
              {chatCompletionStatus && (
                <Tooltip title="Chat completed">
                  <CheckCircleOutlined className={styles.chatCompletionIcon} />
                </Tooltip>
              )}
              <Button
                type="primary"
                danger
                size="large"
                icon={<CloseOutlined />}
                onClick={onClose}
                className={styles.exitButton}
              >
                Exit Chat
              </Button>
            </Space>
          </div>
        </div>
      }
      className={styles.chatContainer}
      headStyle={{ padding: 0, border: 'none' }}
      bodyStyle={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Patient Info Header */}
      <div className={styles.patientInfoHeader}>
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{selectedPatient.patientName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Medicare ID: {selectedPatient.medicareId} | NPI: {selectedPatient.npi}
            </Text>
          </div>
        </Space>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <br />
            <Text type="secondary">Loading chat history...</Text>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <RobotOutlined className={styles.emptyStateIcon} />
            <br />
            <Text>Start a conversation with {selectedPatient.patientName}</Text>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <div key={msg.id} className={styles.messageContainer}>
                <div className={styles.messageLayout}>
                  <Avatar 
                    icon={msg.sender.id === chatService.mockUsers.userA.id ? <UserOutlined /> : <RobotOutlined />}
                    className={msg.sender.id === chatService.mockUsers.userA.id ? styles.userAvatar : styles.botAvatar}
                  />
                  <div className={styles.messageContent}>
                    <div className={`${styles.messageBubble} ${msg.sender.id === chatService.mockUsers.userA.id ? styles.messageBubbleUser : styles.messageBubbleBot} ${msg.isError ? styles.messageBubbleError : ''}`}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ fontSize: '12px', color: msg.sender.id === chatService.mockUsers.userA.id ? 'rgba(255,255,255,0.8)' : '#666' }}>
                          {msg.sender.name}
                        </Text>
                      </div>
                      {msg.text}
                    </div>
                    <Text type="secondary" className={styles.messageTimestamp}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className={styles.typingIndicator}>
                <Avatar icon={<RobotOutlined />} className={styles.botAvatar} />
                <div className={styles.messageBubble + ' ' + styles.messageBubbleBot}>
                  <Space>
                    <ClockCircleOutlined />
                    <Text>Typing...</Text>
                  </Space>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Hidden for automatic conversation */}
      {!chatCompletionStatus && (
        <div className={styles.inputArea}>
          <div style={{ textAlign: 'center', padding: '16px', color: '#8c8c8c' }}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            Conversation in progress...
          </div>
        </div>
      )}
      
      {chatCompletionStatus && (
        <div className={styles.inputArea}>
          <div className={styles.completionTag}>
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Chat completed
            </Tag>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChatComponent; 