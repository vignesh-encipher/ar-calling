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
  CloseOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import socketService from '../../../services/socketService';
import styles from './styles.module.css';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatComponent = ({ selectedPatient, onChatComplete, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatCompletionStatus, setChatCompletionStatus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, failed
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadChatHistory(selectedPatient.key);
      checkChatCompletionStatus(selectedPatient.key);
      setupSocketHandlers();
    }
  }, [selectedPatient]);

  // Setup WebSocket handlers
  const setupSocketHandlers = () => {
    // Register message handlers for different message types
    socketService.onMessage('chat', handleSocketMessage);
    socketService.onMessage('typing', handleTypingMessage);
    socketService.onMessage('history', handleHistoryMessage);
    socketService.onMessage('system', handleSystemMessage);
    socketService.onMessage('call_status', handleCallStatusMessage);
    
    // Also handle raw WebSocket messages (for messageType format)
    socketService.onMessage('Message received', handleSocketMessage);
    socketService.onMessage('Typing', handleTypingMessage);
    
    // Register connection handler
    socketService.onConnection((status) => {
      setSocketConnected(status === 'connected');
      if (status === 'connected') {
        setCallStatus('connected');
        message.success('Call connected successfully');
        setLoading(false);
      } else if (status === 'disconnected') {
        setCallStatus('failed');
        message.warning('Call disconnected');
        setLoading(false);
      } else if (status === 'error') {
        setCallStatus('failed');
        message.error('Call connection failed');
        setLoading(false);
      }
    });
  };

  // Handle socket messages
  const handleSocketMessage = (message) => {
    console.log('💬 Received chat message:', message);
    
    // Handle different message formats from WebSocket
    if (message.messageType === 'Message received') {
      const chatMessage = {
        id: Date.now() + Math.random(),
        text: message.text,
        sender: {
          name: message.name === 'IVR' ? 'IVR System' : message.name === 'you' || message.name === 'Patient' ? 'You' : message.name || 'System'
        },
        timestamp: new Date().toISOString()
      };
      console.log('📝 Adding message to chat:', chatMessage);
      setMessages(prev => [...prev, chatMessage]);
    } else if (message.type === 'chat') {
      // Handle standard chat format
      setMessages(prev => [...prev, message]);
    } else {
      // Handle other message types
      console.log('📨 Other message type:', message);
    }
  };

  // Handle typing messages
  const handleTypingMessage = (message) => {
    console.log('⌨️ Received typing indicator:', message);
    
    if (message.messageType === 'Typing') {
      // Handle WebSocket typing format - only show for IVR
      if (message.name === 'IVR') {
        setIsTyping(true);
        // Auto-hide typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    } else if (message.type === 'typing') {
      // Handle standard typing format
      if (message.sender.name === 'System' || message.sender.name === 'IVR System' || message.sender.name === 'IVR') {
        setIsTyping(message.isTyping);
      }
    }
  };

  // Handle history messages
  const handleHistoryMessage = (message) => {
    console.log('📚 Received chat history:', message);
    if (message.messages && Array.isArray(message.messages)) {
      setMessages(message.messages);
      setLoading(false);
    } else if (message.data && Array.isArray(message.data)) {
      setMessages(message.data);
      setLoading(false);
    } else {
      console.log('📚 No valid messages in history response');
      setLoading(false);
    }
  };

  // Handle system messages
  const handleSystemMessage = (message) => {
    console.log('System message:', message);
  };

  // Handle call status messages
  const handleCallStatusMessage = (message) => {
    console.log('📞 Call status update:', message);
    setCallStatus(message.status || 'connected');
  };

  // Load chat history from WebSocket (no dummy data)
  const loadChatHistory = async (patientId) => {
    setLoading(true);
    setMessages([]); // Start with empty messages, wait for WebSocket data
    console.log('🔄 Waiting for WebSocket chat history...');
  };

  // Check chat completion status (no dummy data)
  const checkChatCompletionStatus = async (patientId) => {
    setChatCompletionStatus(selectedPatient?.chatCompleted || false);
  };

  // Send message via WebSocket
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient || !socketConnected) return;
    
    // Send in the format expected by the WebSocket
    const wsMessageData = {
      messageType: 'Message sent',
      text: newMessage,
      name: 'Patient'
    };
    
    if (socketService.sendMessage(wsMessageData)) {
      // Also add the message to local state immediately for better UX
      const localMessage = {
        id: Date.now() + Math.random(),
        text: newMessage,
        sender: { name: 'You' },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, localMessage]);
      setNewMessage('');
      message.success('Message sent!');
    } else {
      message.error('Failed to send message');
    }
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

  // Generate avatar based on sender name
  const generateAvatar = (sender) => {
    if (sender.name === 'You' || sender.name === 'Patient' || sender.name === 'User') {
      return <UserOutlined />;
    } else if (sender.name === 'System' || sender.name === 'IVR System' || sender.name === 'Bot') {
      return <RobotOutlined />;
    } else {
      // Generate initials from name for other senders
      const initials = sender.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return initials;
    }
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

    if (sender.name === 'You' || sender.name === 'Patient' || sender.name === 'User') {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Prevent body scrolling when chat is active
  useEffect(() => {
    if (selectedPatient) {
      // Prevent body scrolling when chat is active
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restore body scrolling when chat is closed
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    };
  }, [selectedPatient]);

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
            <PhoneOutlined className={styles.welcomeIcon} />
            <br />
            Select a patient and click Call to start
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
              Call with IVR
            </Title>
            <Button
              type="primary"
              danger
              size="large"
              icon={<CloseOutlined />}
              onClick={onClose}
              className={styles.exitButton}
            >
              End Call
            </Button>
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
      <div className={`${styles.messagesArea} ${messages.length > 0 ? styles.hasMessages : ''}`}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <br />
            <Text type="secondary">Connecting to call...</Text>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <PhoneOutlined className={styles.emptyStateIcon} />
            <br />
            <Text>Call connected. Start your conversation with {selectedPatient.patientName}</Text>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <div key={msg.id} className={styles.messageContainer}>
                <div className={styles.messageLayout}>
                  <Avatar 
                    icon={generateAvatar(msg.sender)}
                    className={msg.sender.name === 'You' || msg.sender.name === 'Patient' || msg.sender.name === 'User' ? styles.userAvatar : styles.botAvatar}
                  />
                  <div className={styles.messageContent}>
                    <div className={`${styles.messageBubble} ${msg.sender.name === 'You' || msg.sender.name === 'Patient' || msg.sender.name === 'User' ? styles.messageBubbleUser : styles.messageBubbleBot} ${msg.isError ? styles.messageBubbleError : ''}`}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ fontSize: '12px', color: msg.sender.name === 'You' || msg.sender.name === 'Patient' || msg.sender.name === 'User' ? 'rgba(255,255,255,0.8)' : '#666' }}>
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
                <Avatar icon={generateAvatar({ name: 'IVR System' })} className={styles.botAvatar} />
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

      {/* No Input Area - Read Only Chat */}
      
      {!socketConnected && (
        <div className={styles.inputArea}>
          <div style={{ textAlign: 'center', padding: '16px', color: '#8c8c8c' }}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            Connecting to call...
          </div>
        </div>
      )}
      
      {chatCompletionStatus && (
        <div className={styles.inputArea}>
          <div className={styles.completionTag}>
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Call completed
            </Tag>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChatComponent; 