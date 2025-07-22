import { MOCK_CONFIG } from '../config';

class MockApiService {
  constructor() {
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.callSid = null;
    this.mockInterval = null;
    this.typingInterval = null;
    this.isTyping = false;
    this.messageQueue = [];
    this.currentMessageIndex = 0;
  }

  // Simulate connection
  async connect(callSid) {
    if (this.isConnected) {
      console.log('🔌 Mock API: Already connected');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      console.log('🔌 Mock API: Connecting with callSid:', callSid);
      
      this.callSid = callSid;
      
      // Simulate connection delay
      setTimeout(() => {
        this.isConnected = true;
        console.log('✅ Mock API: Connected successfully');
        this.notifyConnectionHandlers('connected');
        
        // Start sending mock messages
        this.startMockMessages();
        
        resolve();
      }, 1000);
    });
  }

  // Start sending mock messages
  startMockMessages() {
    // Initialize message queue with realistic conversation
    this.messageQueue = [
      {
        messageType: 'Message received',
        text: 'Hello! Welcome to our medical assistance system. I\'m your IVR assistant.',
        name: 'IVR SYSTEM',
        timestamp: new Date().toISOString()
      },
      {
        messageType: 'Message received',
        text: 'I can help you with appointment scheduling, medical information, and general inquiries.',
        name: 'IVR SYSTEM',
        timestamp: new Date().toISOString()
      },
      {
        messageType: 'Message received',
        text: 'How can I assist you today?',
        name: 'IVR SYSTEM',
        timestamp: new Date().toISOString()
      },
      {
        messageType: 'Message received',
        text: 'I\'m here to provide you with the best medical assistance possible.',
        name: 'EH BOT',
        timestamp: new Date().toISOString()
      },
      {
        messageType: 'Message received',
        text: 'Please let me know what you need help with today.',
        name: 'EH BOT',
        timestamp: new Date().toISOString()
      }
    ];

    // Send initial messages with delays
    this.sendQueuedMessages();

    // Send periodic responses
    this.mockInterval = setInterval(() => {
      this.sendRandomResponse();
    }, MOCK_CONFIG.messageInterval);

    // Simulate typing indicators
    this.typingInterval = setInterval(() => {
      if (!this.isTyping) {
        // Randomly choose which system is typing
        const typingSystem = Math.random() > 0.5 ? 'IVR SYSTEM' : 'EH BOT';
        this.sendTypingIndicator(true, typingSystem);
        setTimeout(() => {
          this.sendTypingIndicator(false, typingSystem);
        }, 2000);
      }
    }, MOCK_CONFIG.typingInterval);
  }

  // Send queued messages with realistic timing
  sendQueuedMessages() {
    this.messageQueue.forEach((message, index) => {
      setTimeout(() => {
        this.sendMockMessage(message);
      }, (index + 1) * 2000); // 2 seconds between each message
    });
  }

  // Send random responses based on user input
  sendRandomResponse() {
    const responses = [
      // IVR SYSTEM responses
      {
        text: 'I\'m processing your request. Please wait a moment.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'I\'m here to assist you with any questions you may have.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'Let me transfer you to a specialist for further assistance.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'I can help you schedule an appointment. What type of appointment do you need?',
        name: 'IVR SYSTEM'
      },
      {
        text: 'Your call is being routed to the appropriate department.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'Please hold while I connect you to the right service.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'I\'m accessing your patient records now.',
        name: 'IVR SYSTEM'
      },
      {
        text: 'Thank you for calling our medical assistance line.',
        name: 'IVR SYSTEM'
      },
      
      // EH BOT responses
      {
        text: 'I understand your concern. Let me check your medical records.',
        name: 'EH BOT'
      },
      {
        text: 'Based on your medical history, I can see that everything looks good.',
        name: 'EH BOT'
      },
      {
        text: 'Your appointment has been scheduled successfully.',
        name: 'EH BOT'
      },
      {
        text: 'Is there anything else you\'d like to know about your health?',
        name: 'EH BOT'
      },
      {
        text: 'Your information has been updated in our system.',
        name: 'EH BOT'
      },
      {
        text: 'I can provide you with detailed medical information.',
        name: 'EH BOT'
      },
      {
        text: 'Let me analyze your symptoms and provide recommendations.',
        name: 'EH BOT'
      },
      {
        text: 'I\'m here to help you with your medical questions.',
        name: 'EH BOT'
      },
      {
        text: 'Your health is our priority. How can I assist you further?',
        name: 'EH BOT'
      },
      {
        text: 'I have access to your complete medical profile.',
        name: 'EH BOT'
      },
      {
        text: 'Let me check the latest medical guidelines for your condition.',
        name: 'EH BOT'
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    this.sendMockMessage({
      messageType: 'Message received',
      text: randomResponse.text,
      name: randomResponse.name,
      timestamp: new Date().toISOString()
    });
  }

  // Send mock message
  sendMockMessage(message) {
    console.log('📨 Mock API: Sending message:', message);
    
    // Simulate network delay
    setTimeout(() => {
      const handlers = this.messageHandlers.get('Message received') || [];
      handlers.forEach(handler => {
        try {
          handler(message);
          
          // Voice is handled by the chat component, not here
          // This prevents double voice playback
        } catch (error) {
          console.error('❌ Mock API: Error in message handler:', error);
        }
      });
    }, 200 + Math.random() * 500);
  }

  // Send typing indicator
  sendTypingIndicator(isTyping, system = 'IVR SYSTEM') {
    this.isTyping = isTyping;
    console.log(`📨 Mock API: Typing indicator (${system}):`, isTyping ? 'started' : 'stopped');
    
    const typingMessage = {
      messageType: 'typing',
      isTyping: isTyping,
      name: system,
      timestamp: new Date().toISOString()
    };

    const handlers = this.messageHandlers.get('typing') || [];
    handlers.forEach(handler => {
      try {
        handler(typingMessage);
      } catch (error) {
        console.error('❌ Mock API: Error in typing handler:', error);
      }
    });
  }

  // Disconnect
  disconnect() {
    console.log('🔌 Mock API: Disconnecting...');
    
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
    
    this.isConnected = false;
    this.callSid = null;
    this.notifyConnectionHandlers('disconnected');
  }

  // Send message (simulate sending to server)
  sendMessage(message) {
    if (!this.isConnected) {
      console.error('❌ Mock API: Not connected');
      return false;
    }

    console.log('📤 Mock API: Sending message:', message);
    
    // Simulate server acknowledgment
    setTimeout(() => {
      console.log('✅ Mock API: Message sent successfully');
      
      // Simulate contextual response based on user input
      const userText = message.text.toLowerCase();
      let response = '';
      let responder = 'EH BOT';
      
      if (userText.includes('appointment') || userText.includes('schedule')) {
        const responses = [
          'I can help you schedule an appointment. What type of appointment do you need?',
          'Let me assist you with appointment scheduling. What specialty are you looking for?',
          'I\'ll help you book an appointment. What date works best for you?'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'IVR SYSTEM';
      } else if (userText.includes('medical') || userText.includes('health') || userText.includes('symptom')) {
        const responses = [
          'I can provide medical information. What specific health question do you have?',
          'Let me help you with your medical concerns. What symptoms are you experiencing?',
          'I have access to your medical records. What would you like to know?'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'EH BOT';
      } else if (userText.includes('hello') || userText.includes('hi') || userText.includes('good morning') || userText.includes('good afternoon')) {
        const responses = [
          'Hello! How can I assist you today?',
          'Hi there! Welcome to our medical assistance system.',
          'Good day! I\'m here to help you with your medical needs.'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'IVR SYSTEM';
      } else if (userText.includes('thank') || userText.includes('thanks')) {
        const responses = [
          'You\'re welcome! Is there anything else I can help you with?',
          'My pleasure! Feel free to ask if you need anything else.',
          'You\'re very welcome! I\'m here whenever you need assistance.'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'EH BOT';
      } else if (userText.includes('pain') || userText.includes('hurt') || userText.includes('ache')) {
        const responses = [
          'I understand you\'re experiencing pain. Let me help you assess this.',
          'Pain management is important. Can you describe the type of pain you\'re feeling?',
          'I\'ll help you with your pain concerns. How long have you been experiencing this?'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'EH BOT';
      } else if (userText.includes('medication') || userText.includes('medicine') || userText.includes('prescription')) {
        const responses = [
          'I can help you with medication information. What specific medication are you asking about?',
          'Let me check your prescription records. What medication concerns do you have?',
          'I\'ll assist you with your medication questions. What do you need to know?'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = 'EH BOT';
      } else {
        const responses = [
          'I understand. Let me process that information for you.',
          'Thank you for that information. How can I assist you further?',
          'I\'ve noted your request. Is there anything specific you\'d like me to help with?',
          'I understand your needs. Let me provide you with the appropriate assistance.'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        responder = Math.random() > 0.5 ? 'EH BOT' : 'IVR SYSTEM';
      }
      
      // Send response after a delay
      setTimeout(() => {
        this.sendMockMessage({
          messageType: 'Message received',
          text: response,
          name: responder,
          timestamp: new Date().toISOString()
        });
      }, 1000 + Math.random() * 2000);
    }, 300);

    return true;
  }

  // Handle incoming messages
  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Mock API: Error in message handler:', error);
      }
    });
  }

  // Register message handler
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  // Remove message handler
  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Register connection handler
  onConnection(handler) {
    const id = Date.now() + Math.random();
    this.connectionHandlers.set(id, handler);
    return id;
  }

  // Remove connection handler
  offConnection(handlerId) {
    this.connectionHandlers.delete(handlerId);
  }

  // Notify connection handlers
  notifyConnectionHandlers(status, error = null) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status, error);
      } catch (error) {
        console.error('❌ Mock API: Error in connection handler:', error);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      callSid: this.callSid
    };
  }

  // Test connection
  testConnection() {
    if (!this.isConnected) {
      return false;
    }

    console.log('🔍 Mock API: Connection test successful');
    return true;
  }
}

// Export singleton instance
const mockApiService = new MockApiService();
export default mockApiService; 