class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.callSid = null;
  }

  // Connect to WebSocket server with callSid
  connect(callSid) {
    if (this.socket && this.isConnected) {
      console.log('🔌 Already connected to WebSocket');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Use real socket API with call ID
        const wsUrl = `wss://143742ebcc60.ngrok-free.app/ws?callSid=${callSid}`;
        console.log('🔌 Connecting to real WebSocket:', wsUrl);
        
        this.callSid = callSid;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received WebSocket message:', message);
            
            // Handle messages with messageType field
            if (message.messageType) {
              // Route based on messageType
              const handlers = this.messageHandlers.get(message.messageType) || [];
              handlers.forEach(handler => {
                try {
                  handler(message);
                } catch (error) {
                  console.error('❌ Error in messageType handler:', error);
                }
              });
            } else {
              // Handle standard message format
              this.handleMessage(message);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.notifyConnectionHandlers('disconnected');
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(callSid);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.notifyConnectionHandlers('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Attempt to reconnect
  attemptReconnect(callSid) {
    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(callSid).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from WebSocket...');
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
      this.isConnected = false;
      this.callSid = null;
      this.notifyConnectionHandlers('disconnected');
    }
  }

  // Send message
  sendMessage(message) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      const messageData = {
        type: 'chat',
        text: message.text,
        sender: message.sender,
        timestamp: new Date().toISOString(),
        callSid: this.callSid
      };

      console.log('📤 Sending WebSocket message:', messageData);
      this.socket.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      return false;
    }
  }

  // Send typing indicator
  sendTypingIndicator(isTyping, sender) {
    if (!this.socket || !this.isConnected) {
      return false;
    }

    try {
      const typingData = {
        type: 'typing',
        isTyping: isTyping,
        sender: sender,
        callSid: this.callSid
      };

      console.log('📤 Sending typing indicator:', typingData);
      this.socket.send(JSON.stringify(typingData));
      return true;
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error);
      return false;
    }
  }

  // Send read receipt
  sendReadReceipt(messageId, sender) {
    if (!this.socket || !this.isConnected) {
      return false;
    }

    try {
      const readData = {
        type: 'read',
        messageId: messageId,
        sender: sender,
        callSid: this.callSid
      };

      console.log('📤 Sending read receipt:', readData);
      this.socket.send(JSON.stringify(readData));
      return true;
    } catch (error) {
      console.error('❌ Error sending read receipt:', error);
      return false;
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Error in message handler:', error);
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
        console.error('❌ Error in connection handler:', error);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      callSid: this.callSid
    };
  }

  // Test connection
  testConnection() {
    if (!this.socket || !this.isConnected) {
      return false;
    }

    try {
      const testMessage = {
        type: 'ping',
        timestamp: Date.now(),
        callSid: this.callSid
      };
      this.socket.send(JSON.stringify(testMessage));
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService; 