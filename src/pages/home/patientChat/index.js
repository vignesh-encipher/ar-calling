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
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice/speech toggle - enabled by default
  const [isInitialized, setIsInitialized] = useState(false); // Track if socket is already initialized
  const [handlersRegistered, setHandlersRegistered] = useState(false); // Track if handlers are registered
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); // Track processed message IDs
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [speakingMessageText, setSpeakingMessageText] = useState('');

  // Debug voice state and check speech synthesis
  useEffect(() => {
    console.log('🔊 Voice enabled state:', voiceEnabled);

    // Check if speech synthesis is available
    if ('speechSynthesis' in window && window.speechSynthesis) {
      console.log('🔊 Speech synthesis is available');
      const voices = window.speechSynthesis.getVoices();
      console.log('🔊 Available voices:', voices.length);
      voices.forEach(voice => {
        console.log(`🔊 Voice: ${voice.name} (${voice.lang})`);
      });
    } else {
      console.warn('🔊 Speech synthesis not available');
    }
  }, [voiceEnabled]);
  const [isListening, setIsListening] = useState(false); // Speech recognition state
  const [speechRecognition, setSpeechRecognition] = useState(null); // Speech recognition instance

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
      if (selectedPatient && !isInitialized) {
        // Reset handlers for new patient
        setHandlersRegistered(false);
        setProcessedMessageIds(new Set()); // Reset processed message IDs for new patient
        processedMessageIdsRef.current.clear(); // Reset ref as well

        loadChatHistory(selectedPatient.key);
        checkChatCompletionStatus(selectedPatient.key);
        setupSocketHandlers();

        // Check if socket is already connected from patientList
        const connectionStatus = socketService.getConnectionStatus();
        if (connectionStatus === 'connected') {
          console.log('📞 Patient selected, socket already connected');
          setSocketConnected(true);
          setCallStatus('connected');
        } else {
          console.log('📞 Patient selected, waiting for socket connection...');
          setCallStatus('connecting');
        }

        setIsInitialized(true);
        setLoading(false);
      }
    };

    connectToSocket();
  }, [selectedPatient, isInitialized]);



  // Setup WebSocket handlers
  const setupSocketHandlers = () => {
    // Prevent multiple registrations
    if (handlersRegistered) {
      console.log('⚠️ Handlers already registered, skipping...');
      return;
    }

    console.log('🔌 Setting up WebSocket handlers...');
    console.log('🔍 Current handlersRegistered state:', handlersRegistered);

    // Clear existing handlers first to prevent duplicates
    activeService.offMessage('chat');
    activeService.offMessage('typing');
    activeService.offMessage('history');
    activeService.offMessage('system');
    activeService.offMessage('call_status');
    activeService.offMessage('Message received');
    activeService.offMessage('Typing');

    console.log('🧹 Cleared existing handlers');

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

        // Call connected successfully
        console.log('📞 Call connected successfully');
      } else if (status === 'disconnected') {
        setCallStatus('failed');
        setLoading(false);
      } else if (status === 'error') {
        setCallStatus('failed');
        setLoading(false);
      }
    });

    setHandlersRegistered(true);
    console.log('✅ WebSocket handlers registered successfully');
  };

  // Handle socket messages
  const handleSocketMessage = (message) => {
    console.log('💬 Received chat message:', message);
    console.log('🔍 Current processedMessageIds size:', processedMessageIds.size);
    console.log('🔍 Current messages count:', messages.length);

    // Use the unique ID from backend for duplicate detection
    const backendMessageId = message.id;
    const senderName = message.name || message.sender?.name;
    const messageText = message.text?.trim();

    console.log('🔍 Backend message ID:', backendMessageId);
    console.log('🔍 Sender name:', senderName);
    console.log('🔍 Message text:', messageText);

    // Check if we've already processed this exact message using backend ID
    if (processedMessageIdsRef.current.has(backendMessageId)) {
      console.log('⚠️ Duplicate message detected (already processed), skipping:', messageText);
      console.log('⚠️ Backend message ID:', backendMessageId);
      console.log('⚠️ Processed message IDs count:', processedMessageIdsRef.current.size);
      return;
    }

    // Also check for existing message in current state as backup
    const existingMessage = messages.find(msg => msg.id === backendMessageId);

    if (existingMessage) {
      console.log('⚠️ Duplicate message detected (in state), skipping:', messageText);
      console.log('⚠️ Existing message ID:', existingMessage.id);
      console.log('⚠️ Backend message ID:', backendMessageId);
      console.log('⚠️ Total messages in state:', messages.length);
      return;
    }

    // Immediately mark as processed to prevent race conditions (using ref)
    processedMessageIdsRef.current.add(backendMessageId);
    setProcessedMessageIds(prev => new Set([...prev, backendMessageId]));
    console.log('✅ Marked message as processed:', backendMessageId);
    console.log('✅ New processedMessageIds size:', processedMessageIdsRef.current.size);

    // Use the backend message ID directly
    const messageId = backendMessageId;

    // Handle different message formats from WebSocket
    if (message.messageType === 'Message received') {
      // Only add message if it has content
      if (message.text && message.text.trim()) {
        try {
          const chatMessage = {
            id: messageId,
            text: message.text.trim(),
            sender: {
              name: message.name // Backend sends "you" but we'll display as "EH BOT" in UI
            },
            timestamp: new Date().toISOString()
          };
          console.log('📝 Processing message:', chatMessage);
          console.log('🔍 Message sender:', chatMessage.sender.name);

          // For ALL bot messages (IVR, IVR SYSTEM and "you" from backend), add to display queue and speak
          if (chatMessage.sender.name === 'you' || chatMessage.sender.name === 'IVR SYSTEM' || chatMessage.sender.name === 'IVR') {
            console.log('🔊 Adding bot message to voice queue:', chatMessage.sender.name);
            addMessageToDisplayQueue(chatMessage);
          } else {
            // For non-bot messages, display immediately
            setMessages(prev => [...prev, chatMessage]);
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      } else {
        console.log('⚠️ Skipping empty message from:', message.name);
      }
    } else if (message.type === 'chat') {
      // Handle standard chat format
      if (message.text && message.text.trim()) {
        const processedMessage = {
          ...message,
          id: messageId,
          text: message.text.trim(),
          sender: {
            ...message.sender,
            name: message.sender.name
          }
        };

        // For ALL bot messages, add to voice queue
        if (processedMessage.sender.name === 'you' || processedMessage.sender.name === 'IVR SYSTEM' || processedMessage.sender.name === 'IVR') {
          console.log('🔊 Adding bot message to voice queue:', processedMessage.sender.name);
          addMessageToDisplayQueue(processedMessage);
        } else {
          setMessages(prev => [...prev, processedMessage]);
        }
      } else {
        console.log('⚠️ Skipping empty chat message from:', message.sender?.name);
      }
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
    } else {
      console.log('Failed to send message');
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Speech recognized:', transcript);
        setNewMessage(transcript);
        setIsListening(false);

        // Auto-send the message after speech recognition
        setTimeout(() => {
          sendMessage();
        }, 500);
      };

      recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🎤 Speech recognition ended');
      };

      setSpeechRecognition(recognition);
    } else {
      console.warn('🎤 Speech recognition not supported');
    }
  }, []);

  // Voice and display queue system - wait for current speech to complete
  const voiceQueue = useRef([]);
  const displayQueue = useRef([]);
  const isSpeaking = useRef(false);
  const spokenMessages = useRef(new Set());

  // Add message to display queue and start speech
  const addMessageToDisplayQueue = (chatMessage) => {
    console.log(`🔊 Adding message to voice queue: ${chatMessage.sender.name} - "${chatMessage.text}"`);
    console.log(`🔊 Voice enabled: ${voiceEnabled}`);
    console.log(`🔊 Current speaking state: ${isSpeaking.current}`);
    console.log(`🔊 Current voice queue length: ${voiceQueue.current.length}`);

    // Check if this message is already in the queue to prevent duplicates
    const isAlreadyInQueue = voiceQueue.current.some(item => item.messageId === chatMessage.id);
    if (isAlreadyInQueue) {
      console.log(`⚠️ Message already in queue, skipping: ${chatMessage.id}`);
      return;
    }

    // Add to voice queue only if voice is enabled
    if (voiceEnabled) {
      // Add to display queue (will be shown when speech starts)
      displayQueue.current.push(chatMessage);

      // Add to voice queue
      voiceQueue.current.push({
        text: chatMessage.text,
        sender: chatMessage.sender.name,
        messageId: chatMessage.id
      });

      console.log(`🔊 Voice queue length: ${voiceQueue.current.length}`);
      console.log(`🔊 Display queue length: ${displayQueue.current.length}`);

      // Start processing if not currently speaking
      if (!isSpeaking.current) {
        console.log('🔊 Starting voice queue processing...');
        processVoiceQueue();
      } else {
        console.log('🔊 Voice queue processing already in progress...');
      }
    } else {
      // If voice is disabled, just display the message immediately
      console.log('🔊 Voice disabled, displaying message immediately');
      setMessages(prev => [...prev, chatMessage]);
    }
  };

  // Process voice queue and display messages
  const processVoiceQueue = () => {
    if (voiceQueue.current.length === 0 || isSpeaking.current) {
      return;
    }

    // Cancel any existing speech to prevent duplicates
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const { text, sender, messageId } = voiceQueue.current.shift();
    isSpeaking.current = true;

    // Display the message now
    const messageToDisplay = displayQueue.current.shift();
    if (messageToDisplay) {
      setMessages(prev => [...prev, messageToDisplay]);
      console.log(`📝 Displayed message: ${sender}`);
      
      // Set up word highlighting for this message
      setCurrentlySpeakingId(messageToDisplay.id);
      setSpeakingMessageText(text);
      setCurrentWordIndex(0);
    }

    if ('speechSynthesis' in window && window.speechSynthesis) {
      console.log('🔊 Speech synthesis available, creating utterance...');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.3; // Slightly faster speech
      
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Use different voices for different senders
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      // Use male voice for both IVR and EH BOT ("you")
      if (sender === 'EH BOT' || sender === 'you' || sender === 'IVR SYSTEM' || sender === 'IVR') {
        // Try to use a male voice for both systems
        selectedVoice = voices.find(voice =>
          voice.name.includes('Male') ||
          voice.name.includes('Alex') ||
          voice.name.includes('David') ||
          voice.name.includes('Google UK English Male') ||
          voice.name.includes('Microsoft David')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Word boundary event for real-time word highlighting
      utterance.onboundary = (event) => {
        console.log('🔊 Boundary event triggered:', event.name, 'charIndex:', event.charIndex);
        
        if (event.name === 'word') {
          const words = text.split(/\s+/).filter(word => word.length > 0);
          const charIndex = event.charIndex;
          
          console.log('🔊 Words array:', words);
          console.log('🔊 Current charIndex:', charIndex);
          
          // Improved word index calculation that handles gaps better
          let wordIndex = 0;
          let charCount = 0;
          let wordStart = 0;
          
          // Find the word that contains the current character position
          for (let i = 0; i < words.length; i++) {
            const wordLength = words[i].length;
            const wordEnd = wordStart + wordLength;
            
            console.log(`🔊 Word ${i}: "${words[i]}" (chars ${wordStart}-${wordEnd})`);
            
            if (charIndex >= wordStart && charIndex < wordEnd) {
              wordIndex = i;
              break;
            }
            
            // Move to next word position (account for spaces and punctuation)
            wordStart = wordEnd;
            
            // Skip spaces and punctuation until we find the next word
            while (wordStart < text.length && /\s/.test(text[wordStart])) {
              wordStart++;
            }
          }
          
          // Update word index if within bounds
          if (wordIndex >= 0 && wordIndex < words.length) {
            setCurrentWordIndex(wordIndex);
            console.log(`🔊 Speaking word ${wordIndex + 1}/${words.length}: "${words[wordIndex]}"`);
            console.log(`🔊 Current word index state: ${wordIndex}`);
            
            // If boundary events are working, disable manual highlighting
            if (utterance.testInterval) {
              clearInterval(utterance.testInterval);
              utterance.testInterval = null;
              console.log(`🔊 Disabled manual highlighting - boundary events working`);
            }
          } else {
            console.log(`🔊 Word index out of bounds: ${wordIndex}, words length: ${words.length}`);
          }
        }
      };

      utterance.onstart = () => {
        console.log(`🔊 Speaking (${sender}):`, text);
        
        // Calculate estimated speech duration and word timing
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const totalWords = words.length;
        
        // Estimate speech duration based on text length and speech rate
        const estimatedDuration = (text.length / 5) * 1000; // Rough estimate: 5 chars per second
        const wordInterval = Math.max(400, estimatedDuration / totalWords); // Minimum 400ms per word
        
        console.log(`🔊 Speech analysis: ${totalWords} words, estimated duration: ${estimatedDuration}ms, interval: ${wordInterval}ms`);
        
        // Manual word highlighting with adaptive timing
        let testWordIndex = 0;
        const testInterval = setInterval(() => {
          if (testWordIndex < totalWords) {
            setCurrentWordIndex(testWordIndex);
            console.log(`🔊 Manual: Highlighting word ${testWordIndex + 1}/${totalWords}: "${words[testWordIndex]}"`);
            testWordIndex++;
          } else {
            clearInterval(testInterval);
          }
        }, wordInterval);
        
        // Store interval reference for cleanup
        utterance.testInterval = testInterval;
      };

      utterance.onend = () => {
        console.log(`🔊 Finished speaking (${sender})`);
        isSpeaking.current = false;
        
        // Clear test interval if it exists
        if (utterance.testInterval) {
          clearInterval(utterance.testInterval);
          utterance.testInterval = null;
        }
        
        // Clear highlighting state
        setCurrentlySpeakingId(null);
        setCurrentWordIndex(0);
        setSpeakingMessageText('');
        
        // Process next message in queue after a short delay
        setTimeout(() => {
          console.log(`🔊 Processing next message in queue...`);
          processVoiceQueue();
        }, 300); // Reduced delay for better flow
      };

      utterance.onerror = (event) => {
        console.error('🔊 Speech synthesis error:', event.error);
        isSpeaking.current = false;
        
        // Clear highlighting state on error
        setCurrentlySpeakingId(null);
        setCurrentWordIndex(0);
        setSpeakingMessageText('');
        
        // Process next message in queue after error
        setTimeout(() => {
          console.log(`🔊 Processing next message after error...`);
          processVoiceQueue();
        }, 300);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('🔊 Speech synthesis not supported');
      isSpeaking.current = false;
    }
  };

  // Text-to-speech function with queue - no interruption
  const speakText = (text, sender) => {
    if (!voiceEnabled) return;

    // Create unique message identifier
    const messageId = `${sender}-${text}`;

    // Don't speak if already spoken
    if (spokenMessages.current.has(messageId)) {
      console.log(`🔊 Skipping duplicate message: ${messageId}`);
      return;
    }

    // Mark as spoken
    spokenMessages.current.add(messageId);

    // Add to voice queue
    voiceQueue.current.push({ text, sender });
    console.log(`🔊 Added to voice queue (${sender}):`, text);

    // Process queue if not currently speaking
    if (!isSpeaking.current) {
      processVoiceQueue();
    }
  };

  // Start listening for speech
  const startListening = () => {
    if (speechRecognition && !isListening) {
      speechRecognition.start();
    }
  };

  // Stop listening for speech
  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  // Toggle voice on/off
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      // Clear queues and reset state when disabling voice
      voiceQueue.current = [];
      displayQueue.current = [];
      isSpeaking.current = false;
      spokenMessages.current.clear();
      window.speechSynthesis?.cancel();
    } else {
      // Test both voices when enabling
      console.log('🔊 Testing both voice systems...');
      if ('speechSynthesis' in window && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Available voices:', voices.map(v => v.name));

        // Test male voice for both IVR SYSTEM and EH BOT
        const maleVoice = voices.find(voice =>
          voice.name.includes('Male') ||
          voice.name.includes('Alex') ||
          voice.name.includes('David') ||
          voice.name.includes('Google UK English Male') ||
          voice.name.includes('Microsoft David')
        );

        // Test male voice for both systems
        if (maleVoice) {
          const test1 = new SpeechSynthesisUtterance('IVR SYSTEM male voice test');
          test1.voice = maleVoice;
          test1.onend = () => {
            console.log('🔊 IVR SYSTEM voice test completed');
            // Test EH BOT voice after IVR
            const test2 = new SpeechSynthesisUtterance('EH BOT male voice test');
            test2.voice = maleVoice;
            test2.onend = () => console.log('🔊 EH BOT voice test completed');
            window.speechSynthesis.speak(test2);
          };
          window.speechSynthesis.speak(test1);
        } else {
          console.log('🔊 No suitable male voice found');
        }
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeService.disconnect();
      if (speechRecognition) {
        speechRecognition.stop();
      }
      // Clear queues and reset voice state
      voiceQueue.current = [];
      displayQueue.current = [];
      isSpeaking.current = false;
      spokenMessages.current.clear();
      window.speechSynthesis?.cancel();
      setIsInitialized(false);
      setHandlersRegistered(false);
      
      // Clear highlighting state
      setCurrentlySpeakingId(null);
      setCurrentWordIndex(0);
      setSpeakingMessageText('');
      setProcessedMessageIds(new Set());
      processedMessageIdsRef.current.clear();
    };
  }, [speechRecognition]);

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
              <Tag color="orange" style={{ marginLeft: '10px', fontSize: '10px' }}>
                MOCK API MODE
              </Tag>
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
              console.log('🎨 Rendering message:', messages);
              const isUserMessage = msg.sender.name === 'you' || msg.sender.name === 'EH BOT';
              const messageStyle = getMessageStyle(msg.sender, msg.isError);

              // Display name: "you" from backend shows as "EH BOT" in UI, "IVR" shows as "IVR SYSTEM"
              const displayName = msg.sender.name === 'you' ? 'EH BOT' :
                msg.sender.name === 'IVR' ? 'IVR SYSTEM' : msg.sender.name;

              return (
                <div key={msg.id} className={`${styles.messageContainer} ${!isUserMessage ? styles.botMessage : ''}`}>
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
                        className={`${styles.messageBubble} ${msg.isError ? styles.messageBubbleError : ''}`}
                        style={messageStyle}
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
                          {currentlySpeakingId === msg.id ? (
                            // Word-by-word highlighting for currently speaking message
                            msg.text.split(/\s+/).filter(word => word.length > 0).map((word, index) => (
                              <span
                                key={index}
                                style={{
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  wordBreak: 'keep-all',
                                  fontWeight: index === currentWordIndex ? 'bold' : 'normal',
                                  marginRight: '4px'
                                }}
                              >
                                {word}
                              </span>
                            ))
                          ) : (
                            // Normal text display for non-speaking messages
                            msg.text
                          )}
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