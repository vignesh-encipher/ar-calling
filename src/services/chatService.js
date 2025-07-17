// Mock Chat Service for Backend Team Reference
// This simulates the expected API structure for real backend implementation

class ChatService {
  constructor() {
    this.mockUsers = {
      userA: {
        id: 'user_a_001',
        name: 'Healthcare Provider',
        role: 'provider',
        avatar: '👨‍⚕️'
      },
      userB: {
        id: 'user_b_001', 
        name: 'Patient Support',
        role: 'support',
        avatar: '🤖'
      }
    };
    
    this.conversationFlow = [
      {
        trigger: ['hello', 'hi', 'start', 'begin'],
        response: "Hello! I'm here to help you with your medical information. How can I assist you today?",
        sender: 'userB',
        nextSteps: ['ask_question', 'provide_info']
      },
      {
        trigger: ['medicare', 'insurance', 'coverage'],
        response: "I can help you with Medicare information. What specific details do you need about your coverage?",
        sender: 'userB',
        nextSteps: ['explain_coverage', 'check_eligibility']
      },
      {
        trigger: ['claim', 'billing', 'payment'],
        response: "I can assist with claims and billing questions. Do you have a specific claim number or billing inquiry?",
        sender: 'userB',
        nextSteps: ['check_claim_status', 'explain_billing']
      },
      {
        trigger: ['appointment', 'schedule', 'visit'],
        response: "I can help you schedule appointments. What type of appointment do you need?",
        sender: 'userB',
        nextSteps: ['check_availability', 'confirm_appointment']
      },
      {
        trigger: ['prescription', 'medication', 'refill'],
        response: "I can help with prescription and medication questions. Do you need a refill or have questions about your medication?",
        sender: 'userB',
        nextSteps: ['process_refill', 'explain_medication']
      },
      {
        trigger: ['thank', 'thanks', 'goodbye', 'bye'],
        response: "You're welcome! Is there anything else I can help you with today?",
        sender: 'userB',
        nextSteps: ['end_conversation', 'continue_help']
      }
    ];
  }

  // Mock API: Get chat history for a patient
  async getChatHistory(patientId) {
    // Simulate API delay
    await this.delay(500);
    
    // Different conversation scenarios based on patient ID
    const scenarios = {
      '1': 'medicare_coverage',
      '2': 'appointment_scheduling', 
      '3': 'billing_questions',
      '4': 'prescription_refill',
      '5': 'general_inquiry'
    };
    
    const scenario = scenarios[patientId] || 'general_inquiry';
    
    return {
      success: true,
      data: {
        patientId: patientId,
        messages: [
          {
            id: 'msg_001',
            text: "Hello! I'm here to help you with your medical information. How can I assist you today?",
            sender: this.mockUsers.userB,
            timestamp: new Date(Date.now() - 60000).toISOString(),
            messageType: 'text',
            status: 'delivered'
          }
        ],
        participants: [this.mockUsers.userA, this.mockUsers.userB],
        conversationId: `conv_${patientId}_${Date.now()}`,
        status: 'active',
        scenario: scenario
      }
    };
  }

  // Mock API: Send message to backend
  async sendMessage(messageData) {
    // Simulate API delay
    await this.delay(800);
    
    const { text, patientId, senderId } = messageData;
    
    // Generate mock response based on user input
    const mockResponse = this.generateMockResponse(text);
    
    return {
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        text: mockResponse.response,
        sender: this.mockUsers[mockResponse.sender],
        timestamp: new Date().toISOString(),
        messageType: 'text',
        status: 'delivered',
        conversationId: `conv_${patientId}_${Date.now()}`,
        isCompleted: mockResponse.isCompleted
      }
    };
  }

  // Mock API: Check chat completion status
  async checkChatStatus(patientId) {
    await this.delay(300);
    
    return {
      success: true,
      data: {
        patientId: patientId,
        isCompleted: false,
        lastActivity: new Date().toISOString(),
        participants: [this.mockUsers.userA, this.mockUsers.userB]
      }
    };
  }

  // Mock API: Get user information
  async getUserInfo(userId) {
    await this.delay(200);
    
    return {
      success: true,
      data: this.mockUsers[userId] || this.mockUsers.userA
    };
  }

  // Generate conversation flow based on scenario
  generateConversationFlow(scenario) {
    const flows = {
      'medicare_coverage': [
        {
          sender: this.mockUsers.userA,
          text: "Hello, I need help with my Medicare coverage",
          delay: 1000
        },
        {
          sender: this.mockUsers.userB,
          text: "Hello! I'm here to help you with your Medicare information. What specific details do you need about your coverage?",
          delay: 2000
        },
        {
          sender: this.mockUsers.userA,
          text: "I want to know about my benefits and what's covered",
          delay: 1500
        },
        {
          sender: this.mockUsers.userB,
          text: "I can help you with that! Based on your Medicare ID, you have comprehensive coverage. Would you like me to explain your specific benefits?",
          delay: 2500
        },
        {
          sender: this.mockUsers.userA,
          text: "Yes, please tell me about my benefits",
          delay: 1200
        },
        {
          sender: this.mockUsers.userB,
          text: "Great! Your Medicare coverage includes: Hospital stays, Doctor visits, Prescription drugs, and Preventive services. Is there a specific area you'd like to know more about?",
          delay: 3000
        },
        {
          sender: this.mockUsers.userA,
          text: "What about prescription drug coverage?",
          delay: 1400
        },
        {
          sender: this.mockUsers.userB,
          text: "Your prescription drug coverage (Part D) includes most medications. You have a $0 deductible and copays range from $3-$47 depending on the medication tier. Would you like me to check a specific medication?",
          delay: 3500
        },
        {
          sender: this.mockUsers.userA,
          text: "That's very helpful. I think I have all the information I need. Thank you!",
          delay: 1800
        },
        {
          sender: this.mockUsers.userB,
          text: "You're welcome! I'm glad I could help you understand your Medicare benefits. Your conversation has been completed. Is there anything else you need assistance with?",
          delay: 2500,
          isCompleted: true
        }
      ],
      'appointment_scheduling': [
        {
          sender: this.mockUsers.userA,
          text: "Hi, I need to schedule an appointment",
          delay: 1000
        },
        {
          sender: this.mockUsers.userB,
          text: "Hello! I'd be happy to help you schedule an appointment. What type of appointment do you need?",
          delay: 2000
        },
        {
          sender: this.mockUsers.userA,
          text: "I need a follow-up visit with my doctor",
          delay: 1500
        },
        {
          sender: this.mockUsers.userB,
          text: "I can help you with that! Let me check the available slots. What's your preferred day and time?",
          delay: 2500
        },
        {
          sender: this.mockUsers.userA,
          text: "I prefer mornings, any day next week",
          delay: 1200
        },
        {
          sender: this.mockUsers.userB,
          text: "Perfect! I found several morning slots available next week. How about Tuesday at 9:00 AM or Thursday at 10:30 AM?",
          delay: 3000
        },
        {
          sender: this.mockUsers.userA,
          text: "Tuesday at 9:00 AM works for me",
          delay: 1400
        },
        {
          sender: this.mockUsers.userB,
          text: "Excellent! I've scheduled your appointment for Tuesday at 9:00 AM. You'll receive a confirmation email shortly. Is there anything else you need?",
          delay: 3500
        },
        {
          sender: this.mockUsers.userA,
          text: "No, that's perfect. Thank you!",
          delay: 1800
        },
        {
          sender: this.mockUsers.userB,
          text: "You're welcome! Your appointment has been confirmed. Have a great day!",
          delay: 2500,
          isCompleted: true
        }
      ],
      'billing_questions': [
        {
          sender: this.mockUsers.userA,
          text: "I have a question about my medical bill",
          delay: 1000
        },
        {
          sender: this.mockUsers.userB,
          text: "Hello! I can help you with billing questions. Do you have a specific bill you'd like to discuss?",
          delay: 2000
        },
        {
          sender: this.mockUsers.userA,
          text: "Yes, I received a bill for $150 from my last visit",
          delay: 1500
        },
        {
          sender: this.mockUsers.userB,
          text: "I can help you with that! Let me check your account. Can you provide the date of your visit or the claim number?",
          delay: 2500
        },
        {
          sender: this.mockUsers.userA,
          text: "It was on July 11th, 2025",
          delay: 1200
        },
        {
          sender: this.mockUsers.userB,
          text: "Thank you! I found your visit from July 11th. The $150 charge is for your copay. Your insurance covered the remaining $850 of the total bill. Does this help clarify the charges?",
          delay: 3000
        },
        {
          sender: this.mockUsers.userA,
          text: "Yes, that makes sense. Thank you for explaining",
          delay: 1400
        },
        {
          sender: this.mockUsers.userB,
          text: "You're welcome! If you have any other billing questions, feel free to ask. Your conversation has been completed.",
          delay: 2500,
          isCompleted: true
        }
      ]
    };
    
    return flows[scenario] || flows['medicare_coverage'];
  }

  // Generate mock response based on user input
  generateMockResponse(userInput) {
    const input = userInput.toLowerCase();
    
    // Check for conversation completion triggers
    if (input.includes('complete') || input.includes('finish') || input.includes('done')) {
      return {
        response: "Thank you for using our service! Your conversation has been completed. Is there anything else you need assistance with?",
        sender: 'userB',
        isCompleted: true
      };
    }
    
    // Find matching conversation flow
    for (const flow of this.conversationFlow) {
      if (flow.trigger.some(trigger => input.includes(trigger))) {
        return {
          response: flow.response,
          sender: flow.sender,
          isCompleted: false
        };
      }
    }
    
    // Default response
    return {
      response: "I understand you're asking about that. Let me help you find the right information. Could you please provide more details?",
      sender: 'userB',
      isCompleted: false
    };
  }

  // Simulate network delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock Socket-like functionality
  createMockSocket() {
    return {
      on: (event, callback) => {
        console.log(`Mock socket listening for: ${event}`);
        // Simulate real-time events
        if (event === 'message') {
          setTimeout(() => {
            callback({
              type: 'typing',
              sender: this.mockUsers.userB,
              timestamp: new Date().toISOString()
            });
          }, 1000);
        }
      },
      emit: (event, data) => {
        console.log(`Mock socket emitting: ${event}`, data);
      },
      disconnect: () => {
        console.log('Mock socket disconnected');
      }
    };
  }

  // Get mock response for legacy compatibility
  getMockResponse(userInput, patient) {
    const response = this.generateMockResponse(userInput);
    return {
      response: response.response,
      isCompleted: response.isCompleted
    };
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;

// API Documentation for Backend Team
export const API_SPECIFICATION = {
  endpoints: {
    // GET /api/chat/history/:patientId
    getChatHistory: {
      method: 'GET',
      url: '/api/chat/history/:patientId',
      response: {
        success: true,
        data: {
          patientId: 'string',
          messages: [
            {
              id: 'string',
              text: 'string',
              sender: {
                id: 'string',
                name: 'string',
                role: 'string',
                avatar: 'string'
              },
              timestamp: 'ISO string',
              messageType: 'text|image|file',
              status: 'sent|delivered|read'
            }
          ],
          participants: [
            {
              id: 'string',
              name: 'string',
              role: 'string',
              avatar: 'string'
            }
          ],
          conversationId: 'string',
          status: 'active|completed|archived'
        }
      }
    },
    
    // POST /api/chat/send
    sendMessage: {
      method: 'POST',
      url: '/api/chat/send',
      body: {
        text: 'string',
        patientId: 'string',
        senderId: 'string',
        conversationId: 'string'
      },
      response: {
        success: true,
        data: {
          messageId: 'string',
          text: 'string',
          sender: {
            id: 'string',
            name: 'string',
            role: 'string',
            avatar: 'string'
          },
          timestamp: 'ISO string',
          messageType: 'text|image|file',
          status: 'sent|delivered|read',
          conversationId: 'string',
          isCompleted: 'boolean'
        }
      }
    },
    
    // GET /api/chat/status/:patientId
    checkChatStatus: {
      method: 'GET',
      url: '/api/chat/status/:patientId',
      response: {
        success: true,
        data: {
          patientId: 'string',
          isCompleted: 'boolean',
          lastActivity: 'ISO string',
          participants: [
            {
              id: 'string',
              name: 'string',
              role: 'string',
              avatar: 'string'
            }
          ]
        }
      }
    }
  },
  
  websocket: {
    events: {
      // Client to Server
      'join_conversation': {
        data: {
          patientId: 'string',
          userId: 'string'
        }
      },
      'send_message': {
        data: {
          text: 'string',
          patientId: 'string',
          senderId: 'string'
        }
      },
      'typing_start': {
        data: {
          patientId: 'string',
          userId: 'string'
        }
      },
      'typing_stop': {
        data: {
          patientId: 'string',
          userId: 'string'
        }
      },
      
      // Server to Client
      'message_received': {
        data: {
          messageId: 'string',
          text: 'string',
          sender: 'object',
          timestamp: 'ISO string'
        }
      },
      'typing_indicator': {
        data: {
          type: 'start|stop',
          sender: 'object',
          timestamp: 'ISO string'
        }
      },
      'conversation_completed': {
        data: {
          patientId: 'string',
          completedAt: 'ISO string'
        }
      }
    }
  }
}; 