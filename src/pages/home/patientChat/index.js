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
  PhoneOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MOCK_CONFIG } from '../../../utils/config';
import socketService from '../../../utils/network/socketService';
import mockApiService from '../../../utils/network/mockApiService';
import { apiService } from '../../../utils/network';
import styles from './styles.module.css';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatComponent = ({ selectedPatient, onChatComplete, onClose }) => {
  // Use real socket service for real-time communication
  const activeService = socketService;

  const [messages, setMessages] = useState([
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatCompletionStatus, setChatCompletionStatus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, failed
  // const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice/speech toggle - enabled by default
  const [isInitialized, setIsInitialized] = useState(false); // Track if socket is already initialized
  const [handlersRegistered, setHandlersRegistered] = useState(false); // Track if handlers are registered
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); // Track processed message IDs
  // const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  // const [currentWordIndex, setCurrentWordIndex] = useState(0);
  // const [speakingMessageText, setSpeakingMessageText] = useState('');

  // Voice state initialization - COMMENTED OUT
  // useEffect(() => {
  //   // Check if speech synthesis is available
  //   if ('speechSynthesis' in window && window.speechSynthesis) {
  //     // Speech synthesis available
  //   } else {
  //     console.warn('🔊 Speech synthesis not available');
  //   }
  // }, [voiceEnabled]);
  // const [isListening, setIsListening] = useState(false); // Speech recognition state
  // const [speechRecognition, setSpeechRecognition] = useState(null); // Speech recognition instance

  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const processedMessageIdsRef = useRef(new Set()); // Use ref for immediate access



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
    const connectToSocket = async () => {
      if (selectedPatient) {
        // Clear previous chat messages immediately
        setMessages([]);
        setNewMessage(''); // Clear input field
        setLoading(true);
        setIsTyping(false); // Clear typing state
        // setCurrentlySpeakingId(null); // Clear speaking state - COMMENTED OUT
        // setCurrentWordIndex(0); // Reset word index - COMMENTED OUT
        // setSpeakingMessageText(''); // Clear speaking text - COMMENTED OUT
        
        // Reset handlers for new patient
        setHandlersRegistered(false);
        setProcessedMessageIds(new Set()); // Reset processed message IDs for new patient
        processedMessageIdsRef.current.clear(); // Reset ref as well
        setIsInitialized(false); // Reset initialization flag for new patient

        // Disconnect from previous socket if connected to different patient
        const currentConnectionStatus = socketService.getConnectionStatus();
        if (currentConnectionStatus.isConnected && currentConnectionStatus.callSid !== selectedPatient.callId) {
          socketService.disconnect();
          setSocketConnected(false);
          setCallStatus('connecting');
        }

        // Check if patient has chat history data
        if (selectedPatient.chatHistory && selectedPatient.chatHistory.length > 0) {
          loadChatHistoryFromData(selectedPatient.chatHistory);
        } else {
          loadChatHistory(selectedPatient.key);
        }
        checkChatCompletionStatus(selectedPatient.key);
        setupSocketHandlers();

        // Check if socket is already connected from patientList
        const connectionStatus = socketService.getConnectionStatus();
        if (connectionStatus.isConnected && connectionStatus.callSid === selectedPatient.callId) {
          setSocketConnected(true);
          setCallStatus('connected');
        } else {
          setCallStatus('connecting');
        }

        setIsInitialized(true);
        setLoading(false);
      }
    };

    connectToSocket();
  }, [selectedPatient]);

  // Cleanup socket connection when component unmounts
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);



  // Setup WebSocket handlers
  const setupSocketHandlers = () => {
    // Prevent multiple registrations
    if (handlersRegistered) {
      return;
    }

    // Clear existing handlers first to prevent duplicates
    activeService.offMessage('chat');
    activeService.offMessage('typing');
    activeService.offMessage('history');
    activeService.offMessage('system');
    activeService.offMessage('call_status');
    activeService.offMessage('Message received');
    activeService.offMessage('Typing');

    // Register message handlers for different message types
    activeService.onMessage('chat', handleSocketMessage);
    activeService.onMessage('typing', handleTypingMessage);
    activeService.onMessage('history', handleHistoryMessage);
    activeService.onMessage('system', handleSystemMessage);
    activeService.onMessage('call_status', handleCallStatusMessage);

    // Handle WebSocket messages with messageType format (but avoid duplicate processing)
    activeService.onMessage('Message received', (message) => {
      // Only process if it's not already handled by the 'chat' handler
      if (message.messageType === 'Message received') {
        handleSocketMessage(message);
      }
    });
    activeService.onMessage('Typing', handleTypingMessage);

    // Register connection handler
    activeService.onConnection((status) => {
      setSocketConnected(status === 'connected');
      if (status === 'connected') {
        setCallStatus('connected');
        setLoading(false);
      } else if (status === 'disconnected') {
        setCallStatus('failed');
        setLoading(false);
      } else if (status === 'error') {
        setCallStatus('failed');
        setLoading(false);
      }
    });

    setHandlersRegistered(true);
  };

  // Handle socket messages
  const handleSocketMessage = (message) => {
    // Use the unique ID from backend for duplicate detection
    const backendMessageId = message.id;
    const messageText = message.message?.trim() || message.text?.trim();

    // Check if we've already processed this exact message using backend ID
    if (processedMessageIdsRef.current.has(backendMessageId)) {
      return;
    }

    // Also check for existing message in current state as backup
    const existingMessage = messages.find(msg => msg.id === backendMessageId);

    if (existingMessage) {
      return;
    }

    // Immediately mark as processed to prevent race conditions (using ref)
    processedMessageIdsRef.current.add(backendMessageId);
    setProcessedMessageIds(prev => new Set([...prev, backendMessageId]));

    // Use the backend message ID directly
    const messageId = backendMessageId;

    // Handle different message formats from WebSocket
    if (message.messageType === 'Message received') {
      // Only add message if it has content
      if (messageText) {
        try {
          // Determine sender name based on bot type
          let senderName = 'Unknown';
          if (message.bot === 'ivr') {
            senderName = 'IVR SYSTEM';
          } else if (message.bot === 'ar') {
            senderName = 'EH BOT';
          } else {
            senderName = message.name || 'Unknown';
          }

          const chatMessage = {
            id: messageId,
            text: messageText,
            sender: {
              name: senderName
            },
            timestamp: new Date().toISOString()
          };

          // For ALL bot messages (IVR, IVR SYSTEM and "you" from backend), display immediately
          if (chatMessage.sender.name === 'IVR SYSTEM' || chatMessage.sender.name === 'EH BOT') {
            setMessages(prev => [...prev, chatMessage]);
          } else {
            // For non-bot messages, display immediately
            setMessages(prev => [...prev, chatMessage]);
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      }
    } else if (message.type === 'chat') {
      // Handle standard chat format
      if (messageText) {
        const processedMessage = {
          ...message,
          id: messageId,
          text: messageText,
          sender: {
            ...message.sender,
            name: message.sender.name
          }
        };

        // For ALL bot messages, display immediately
        if (processedMessage.sender.name === 'you' || processedMessage.sender.name === 'IVR SYSTEM' || processedMessage.sender.name === 'IVR') {
          setMessages(prev => [...prev, processedMessage]);
        } else {
          setMessages(prev => [...prev, processedMessage]);
        }
      }
    }
  };

  // Handle typing messages
  const handleTypingMessage = (message) => {
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
    if (message.messages && Array.isArray(message.messages)) {
      setMessages(message.messages);
      setLoading(false);
    } else if (message.data && Array.isArray(message.data)) {
      setMessages(message.data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  // Handle system messages
  const handleSystemMessage = (message) => {
    // System message handling
  };

  // Handle call status messages
  const handleCallStatusMessage = (message) => {
    setCallStatus(message.status || 'connected');
  };

  // Load chat history from WebSocket (no dummy data)
  const loadChatHistory = async (patientId) => {
    setLoading(true);
    setMessages([]); // Start with empty messages, wait for WebSocket data
  };

  // Load chat history from API data
  const loadChatHistoryFromData = (chatData) => {
    setLoading(true);
    setMessages([]); // Clear existing messages
    
    const formattedMessages = chatData.map((chatItem, index) => {
      const isBot = chatItem.bot === 'ivr' || chatItem.bot === 'ar';
      const senderName = chatItem.bot === 'ivr' ? 'IVR SYSTEM' : 
                        chatItem.bot === 'ar' ? 'EH BOT' : 'Unknown';
      
      return {
        id: `history-${index}`,
        text: chatItem.message,
        sender: { name: senderName },
        timestamp: new Date().toISOString(), // Use current time for history
        isHistory: true
      };
    });
    

    setMessages(formattedMessages);
    setLoading(false);
    
    // Connect to socket for real-time updates if callId is available
    if (selectedPatient && selectedPatient.callId) {
      try {
        socketService.connect(selectedPatient.callId).then(() => {
          setSocketConnected(true);
          setCallStatus('connected');
        }).catch((error) => {
          console.error('❌ Socket connection failed for chat history:', error);
          // Continue without real-time updates
        });
      } catch (error) {
        console.error('❌ Error connecting to socket for chat history:', error);
      }
    }
    
    // Mark chat as completed since we have history
    if (selectedPatient) {
      onChatComplete(selectedPatient.key, true);
    }
  };

  // Check chat completion status (no dummy data)
  const checkChatCompletionStatus = async (patientId) => {
    setChatCompletionStatus(selectedPatient?.chatCompleted || false);
  };





  // Send message via WebSocket
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;

    // Allow sending if socket is connected (real or mock)
    if (!socketConnected && !MOCK_CONFIG.enableMockSocket) return;

    // Send in the format expected by the WebSocket
    const wsMessageData = {
      messageType: 'Message sent',
      text: newMessage,
      name: 'Patient'
    };

    if (activeService.sendMessage(wsMessageData)) {
      // Also add the message to local state immediately for better UX
      const localMessage = {
        id: Date.now() + Math.random(),
        text: newMessage,
        sender: { name: 'You' },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, localMessage]);
      setNewMessage('');
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
    if (sender.name === 'EH BOT') {
      return <RobotOutlined style={{ fontSize: '18px' }} />;
    } else if (sender.name === 'IVR SYSTEM' || sender.name === 'IVR') {
      return <PhoneOutlined style={{ fontSize: '18px' }} />;
    } else if (sender.name === 'you') {
      // "you" from backend = "EH BOT" in UI
      return <RobotOutlined style={{ fontSize: '18px' }} />;
    } else {
      // Generate initials from name for other senders
      const initials = sender.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return <span style={{ fontSize: '14px', fontWeight: '600' }}>{initials}</span>;
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

    // Backend sends "you" but we treat it as "EH BOT" for positioning
    if (sender.name === 'you') {
      // "you" from backend = "EH BOT" in UI (right side) - Clean white background
      return {
        ...baseStyle,
        background: isError ? '#ff4d4f' : '#ffffff',
        color: isError ? 'white' : '#333333',
        // marginLeft: 'auto',
        borderBottomRightRadius: '4px',
        border: isError ? '1px solid #ff4d4f' : '1px solid #e8e8e8',
        boxShadow: isError ? '0 2px 8px rgba(255, 77, 79, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontWeight: '400',
        letterSpacing: '0.2px'
      };
    } else if (sender.name === 'EH BOT') {
      // EH BOT on the RIGHT side (opposite of IVR SYSTEM) - Clean white background
      return {
        ...baseStyle,
        background: isError ? '#ff4d4f' : '#ffffff',
        color: isError ? 'white' : '#333333',
        marginLeft: 'auto',
        borderBottomRightRadius: '4px',
        border: isError ? '1px solid #ff4d4f' : '1px solid #e8e8e8',
        boxShadow: isError ? '0 2px 8px rgba(255, 77, 79, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontWeight: '400',
        letterSpacing: '0.2px'
      };
    } else if (sender.name === 'IVR SYSTEM' || sender.name === 'IVR') {
      // IVR SYSTEM on the LEFT side (backend sends "IVR", display as "IVR SYSTEM") - Clean white background
      return {
        ...baseStyle,
        background: isError ? '#ff4d4f' : '#ffffff',
        color: isError ? 'white' : '#333333',
        marginRight: 'auto',
        borderBottomLeftRadius: '4px',
        border: isError ? '1px solid #ff4d4f' : '1px solid #e8e8e8',
        boxShadow: isError ? '0 2px 8px rgba(255, 77, 79, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontWeight: '400',
        letterSpacing: '0.2px'
      };
    } else {
      // Other system messages use left side
      return {
        ...baseStyle,
        backgroundColor: isError ? '#ff4d4f' : '#f0f0f0',
        color: isError ? 'white' : '#333',
        marginRight: 'auto',
        borderBottomLeftRadius: '4px'
      };
    }
  };

  // Initialize speech recognition - COMMENTED OUT
  // useEffect(() => {
  //   if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  //     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  //     const recognition = new SpeechRecognition();

  //     recognition.continuous = false;
  //     recognition.interimResults = false;
  //     recognition.lang = 'en-US';

  //     recognition.onstart = () => {
  //       setIsListening(true);
  
  //     };

  //     recognition.onresult = (event) => {
  //       const transcript = event.results[0][0].transcript;

  //       setNewMessage(transcript);
  //       setIsListening(false);

  //       // Auto-send the message after speech recognition
  //       setTimeout(() => {
  //         sendMessage();
  //       }, 500);
  //     };

  //     recognition.onerror = (event) => {
  //       console.error('🎤 Speech recognition error:', event.error);
  //       setIsListening(false);
  //     };

  //     recognition.onend = () => {
  //       setIsListening(false);

  //     };

  //     setSpeechRecognition(recognition);
  //   } else {
  //     console.warn('🎤 Speech recognition not supported');
  //   }
  // }, []);

  // Voice and display queue system - wait for current speech to complete
  // const voiceQueue = useRef([]); // COMMENTED OUT
  // const displayQueue = useRef([]); // COMMENTED OUT
  // const isSpeaking = useRef(false); // COMMENTED OUT
  // const spokenMessages = useRef(new Set()); // COMMENTED OUT

  // Add message to display queue and start speech - COMMENTED OUT
  // const addMessageToDisplayQueue = (chatMessage) => {
  //   // Check if this message is already in the queue to prevent duplicates
  //   const isAlreadyInQueue = voiceQueue.current.some(item => item.messageId === chatMessage.id);
  //   if (isAlreadyInQueue) {
  //     return;
  //   }

  //   // Add to voice queue only if voice is enabled
  //   if (voiceEnabled) {
  //     // Add to display queue (will be shown when speech starts)
  //     displayQueue.current.push(chatMessage);

  //     // Add to voice queue
  //     voiceQueue.current.push({
  //       text: chatMessage.text,
  //       sender: chatMessage.sender.name,
  //       messageId: chatMessage.id
  //     });

  //     // Start processing if not currently speaking
  //     if (!isSpeaking.current) {
  //       processVoiceQueue();
  //     }
  //   } else {
  //     // If voice is disabled, just display the message immediately
  //     setMessages(prev => [...prev, chatMessage]);
  //   }
  // };

  // Process voice queue and display messages - COMMENTED OUT
  // const processVoiceQueue = () => {
  //   if (voiceQueue.current.length === 0 || isSpeaking.current) {
  //     return;
  //   }

  //   // Cancel any existing speech to prevent duplicates
  //   if (window.speechSynthesis) {
  //     window.speechSynthesis.cancel();
  //   }

  //   const { text, sender, messageId } = voiceQueue.current.shift();
  //   isSpeaking.current = true;

  //   // Display the message now
  //   const messageToDisplay = displayQueue.current.shift();
  //   if (messageToDisplay) {
  //     setMessages(prev => [...prev, messageToDisplay]);
      
  //     // Set up word highlighting for this message
  //     setCurrentlySpeakingId(messageToDisplay.id);
  //     setSpeakingMessageText(text);
  //     setCurrentWordIndex(0);
  //   }

  //   if ('speechSynthesis' in window && window.speechSynthesis) {
  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.rate = 1.3; // Slightly faster speech
      
  //     utterance.pitch = 1.0;
  //     utterance.volume = 0.8;

  //     // Use different voices for different senders
  //     const voices = window.speechSynthesis.getVoices();
  //     let selectedVoice = null;

  //     // Use male voice for both IVR and EH BOT ("you")
  //     if (sender === 'EH BOT' || sender === 'you' || sender === 'IVR SYSTEM' || sender === 'IVR') {
  //       // Try to use a male voice for both systems
  //       selectedVoice = voices.find(voice =>
  //         voice.name.includes('Male') ||
  //         voice.name.includes('Alex') ||
  //         voice.name.includes('David') ||
  //         voice.name.includes('Google UK English Male') ||
  //         voice.name.includes('Microsoft David')
  //       );
  //     }

  //     if (selectedVoice) {
  //       utterance.voice = selectedVoice;
  //     }

  //     // Word boundary event for real-time word highlighting
  //     utterance.onboundary = (event) => {
  //       if (event.name === 'word') {
  //         const words = text.split(/\s+/).filter(word => word.length > 0);
  //         const charIndex = event.charIndex;
          
  //         // Improved word index calculation that handles gaps better
  //         let wordIndex = 0;
  //         let charCount = 0;
  //         let wordStart = 0;
          
  //         // Find the word that contains the current character position
  //         for (let i = 0; i < words.length; i++) {
  //           const wordLength = words[i].length;
  //           const wordEnd = wordStart + wordLength;
          
  //           if (charIndex >= wordStart && charIndex < wordEnd) {
  //             wordIndex = i;
  //             break;
  //           }
          
  //           // Move to next word position (account for spaces and punctuation)
  //           wordStart = wordEnd;
          
  //           // Skip spaces and punctuation until we find the next word
  //           while (wordStart < text.length && /\s/.test(text[wordStart])) {
  //             wordStart++;
  //           }
  //         }
          
  //         // Update word index if within bounds
  //         if (wordIndex >= 0 && wordIndex < words.length) {
  //           setCurrentWordIndex(wordIndex);
          
  //           // If boundary events are working, disable manual highlighting
  //           if (utterance.testInterval) {
  //             clearInterval(utterance.testInterval);
  //             utterance.testInterval = null;
  //           }
  //         }
  //       }
  //     };

  //     utterance.onstart = () => {
  //       // Calculate estimated speech duration and word timing
  //       const words = text.split(/\s+/).filter(word => word.length > 0);
  //       const totalWords = words.length;
      
  //       // Estimate speech duration based on text length and speech rate
  //       const estimatedDuration = (text.length / 5) * 1000; // Rough estimate: 5 chars per second
  //       const wordInterval = Math.max(400, estimatedDuration / totalWords); // Minimum 400ms per word
      
  //       // Manual word highlighting with adaptive timing
  //       let testWordIndex = 0;
  //       const testInterval = setInterval(() => {
  //         if (testWordIndex < totalWords) {
  //           setCurrentWordIndex(testWordIndex);
  //           testWordIndex++;
  //         } else {
  //           clearInterval(testInterval);
  //         }
  //       }, wordInterval);
      
  //       // Store interval reference for cleanup
  //       utterance.testInterval = testInterval;
  //     };

  //     utterance.onend = () => {
  //       isSpeaking.current = false;
      
  //       // Clear test interval if it exists
  //       if (utterance.testInterval) {
  //         clearInterval(utterance.testInterval);
  //         utterance.testInterval = null;
  //       }
      
  //       // Clear highlighting state
  //       setCurrentlySpeakingId(null);
  //       setCurrentWordIndex(0);
  //       setSpeakingMessageText('');
      
  //       // Process next message in queue after a short delay
  //       setTimeout(() => {
  //         processVoiceQueue();
  //       }, 300); // Reduced delay for better flow
  //     };

  //     utterance.onerror = (event) => {
  //       console.error('🔊 Speech synthesis error:', event.error);
  //       isSpeaking.current = false;
      
  //       // Clear highlighting state on error
  //       setCurrentlySpeakingId(null);
  //       setCurrentWordIndex(0);
  //       setSpeakingMessageText('');
      
  //       // Process next message in queue after error
  //       setTimeout(() => {
  //         processVoiceQueue();
  //       }, 300);
  //     };

  //     window.speechSynthesis.speak(utterance);
  //   } else {
  //     console.warn('🔊 Speech synthesis not supported');
  //     isSpeaking.current = false;
  //   }
  // };

  // Text-to-speech function with queue - no interruption - COMMENTED OUT
  // const speakText = (text, sender) => {
  //   if (!voiceEnabled) return;

  //   // Create unique message identifier
  //   const messageId = `${sender}-${text}`;

  //   // Don't speak if already spoken
  //   if (spokenMessages.current.has(messageId)) {
  //     return;
  //   }

  //   // Mark as spoken
  //   spokenMessages.current.add(messageId);

  //   // Add to voice queue
  //   voiceQueue.current.push({ text, sender });

  //   // Process queue if not currently speaking
  //   if (!isSpeaking.current) {
  //     processVoiceQueue();
  //   }
  // };

  // Start listening for speech - COMMENTED OUT
  // const startListening = () => {
  //   if (speechRecognition && !isListening) {
  //     speechRecognition.start();
  //   }
  // };

  // Stop listening for speech - COMMENTED OUT
  // const stopListening = () => {
  //   if (speechRecognition && isListening) {
  //     speechRecognition.stop();
  //   }
  // };

  // Toggle voice on/off - COMMENTED OUT
  // const toggleVoice = () => {
  //   setVoiceEnabled(!voiceEnabled);
  //   if (voiceEnabled) {
  //     // Clear queues and reset state when disabling voice
  //     voiceQueue.current = [];
  //     displayQueue.current = [];
  //     isSpeaking.current = false;
  //     spokenMessages.current.clear();
  //     window.speechSynthesis?.cancel();
  //   }
  // };

  // Cleanup on unmount - COMMENTED OUT speechRecognition dependency
  useEffect(() => {
    return () => {
      activeService.disconnect();
      // if (speechRecognition) {
      //   speechRecognition.stop();
      // }
      // Clear queues and reset voice state - COMMENTED OUT
      // voiceQueue.current = [];
      // displayQueue.current = [];
      // isSpeaking.current = false;
      // spokenMessages.current.clear();
      // window.speechSynthesis?.cancel();
      setIsInitialized(false);
      setHandlersRegistered(false);
      
      // Clear highlighting state - COMMENTED OUT
      // setCurrentlySpeakingId(null);
      // setCurrentWordIndex(0);
      // setSpeakingMessageText('');
      setProcessedMessageIds(new Set());
      processedMessageIdsRef.current.clear();
    };
  }, []); // Removed speechRecognition dependency

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
              {messages.length > 0 && messages.every(msg => msg.isHistory) ? 'Chat History' : 'Call with IVR'}
              {messages.length > 0 && messages.every(msg => msg.isHistory) ? (
                <Tag color="blue" style={{ marginLeft: '10px', fontSize: '10px' }}>
                  HISTORY MODE
                </Tag>
              ) : (
                <Tag color="orange" style={{ marginLeft: '10px', fontSize: '10px' }}>
                  MOCK API MODE
                </Tag>
              )}
            </Title>
            <Space>
              {/* End call functionality removed */}
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
      <div className={`${styles.messagesArea} ${messages.length > 0 ? styles.hasMessages : ''}`}>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.callConnecting}>
              <div className={styles.callIcon}>
                <PhoneOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </div>
              <div className={styles.connectingText}>
                <Text strong style={{ fontSize: '18px', color: '#1890ff', marginBottom: '8px' }}>
                  Connecting Call
                </Text>
                <div className={styles.connectingDots}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <PhoneOutlined className={styles.emptyStateIcon} />
            <br />
            <Text>Call connected to IVR. Please wait for the conversation to start.</Text>
          </div>
        ) : (
          <div>
            {messages.map((msg) => {
          
              const isUserMessage = msg.sender.name === 'you' || msg.sender.name === 'EH BOT';
              const messageStyle = getMessageStyle(msg.sender, msg.isError);

              // Display name: "you" from backend shows as "EH BOT" in UI, "IVR" shows as "IVR SYSTEM"
              const displayName = msg.sender.name === 'you' ? 'EH BOT' :
                msg.sender.name === 'IVR' ? 'IVR SYSTEM' : msg.sender.name;

              return (
                <div key={msg.id} className={`${styles.messageContainer} ${!isUserMessage ? styles.botMessage : ''} ${msg.isHistory ? styles.historyMessage : ''}`}>
                  <div className={styles.messageLayout}>

                    <div className={`${styles.messageContent} d-flex`}>
                      <Avatar
                        icon={generateAvatar(msg.sender)}
                        className={isUserMessage ? styles.userAvatar : styles.botAvatar}
                        style={{
                          background: (msg.sender.name === 'IVR SYSTEM' || msg.sender.name === 'IVR') ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                            (msg.sender.name === 'EH BOT' || msg.sender.name === 'you') ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : undefined,
                          color: (msg.sender.name === 'IVR SYSTEM' || msg.sender.name === 'IVR' || msg.sender.name === 'EH BOT' || msg.sender.name === 'you') ? 'white' : undefined,
                          boxShadow: (msg.sender.name === 'IVR SYSTEM' || msg.sender.name === 'IVR') ? '0 4px 12px rgba(24, 144, 255, 0.3)' :
                            (msg.sender.name === 'EH BOT' || msg.sender.name === 'you') ? '0 4px 12px rgba(82, 196, 26, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.15)',
                          border: '3px solid white',
                          transition: 'all 0.3s ease',
                          transform: 'scale(1)',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                      <div
                        className={`${styles.messageBubble} ${msg.isError ? styles.messageBubbleError : ''} ${msg.isHistory ? styles.historyMessageBubble : ''}`}
                        style={{
                          ...messageStyle,
                          opacity: msg.isHistory ? 0.8 : 1,
                          border: msg.isHistory ? '1px dashed #d9d9d9' : messageStyle.border
                        }}
                      >

                        <div style={{ marginBottom: '6px' }}>
                          <Text strong style={{
                            fontSize: '13px',
                            color: (msg.sender.name === 'EH BOT' || msg.sender.name === 'you') ? '#52c41a' :
                              (msg.sender.name === 'IVR SYSTEM' || msg.sender.name === 'IVR') ? '#1890ff' :
                                isUserMessage ? '#52c41a' : '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            fontWeight: '600',
                            backgroundColor: (msg.sender.name === 'EH BOT' || msg.sender.name === 'you') ? 'rgba(82, 196, 26, 0.1)' :
                              (msg.sender.name === 'IVR SYSTEM' || msg.sender.name === 'IVR') ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {displayName}
                          </Text>
                        </div>
                        <div style={{ 
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                      <Text type="secondary" className={styles.messageTimestamp}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </div>
                  </div>
                </div>
              );
            })}

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

      {/* Input Area with Voice Controls */}
      <div className={styles.inputArea}>
        {!socketConnected && !MOCK_CONFIG.enableMockSocket ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#8c8c8c' }}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            Connecting to call...
          </div>
        ) : chatCompletionStatus ? (
          <div className={styles.completionTag}>
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Call completed
            </Tag>
          </div>
        ) : (
          <div className={styles.inputContainer}>
            {/* Text Input */}
            <div className={styles.textInputContainer}>
              <TextArea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                className={styles.textInput}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={styles.sendButton}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChatComponent; 