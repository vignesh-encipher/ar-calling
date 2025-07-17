# Chat System API Specification

## Overview
This document outlines the API endpoints and data structures required for the patient chat system. The frontend is currently using mock data that simulates these endpoints.

## Base URL
```
https://your-api-domain.com/api
```

## Authentication
All endpoints require authentication. Include the following header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get Chat History
**GET** `/chat/history/:patientId`

Retrieves the chat history for a specific patient.

#### Request
```http
GET /api/chat/history/patient_123
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "patientId": "patient_123",
    "messages": [
      {
        "id": "msg_001",
        "text": "Hello! I'm here to help you with your medical information.",
        "sender": {
          "id": "user_b_001",
          "name": "Patient Support",
          "role": "support",
          "avatar": "🤖"
        },
        "timestamp": "2024-01-15T10:30:00.000Z",
        "messageType": "text",
        "status": "delivered"
      }
    ],
    "participants": [
      {
        "id": "user_a_001",
        "name": "Healthcare Provider",
        "role": "provider",
        "avatar": "👨‍⚕️"
      },
      {
        "id": "user_b_001",
        "name": "Patient Support",
        "role": "support",
        "avatar": "🤖"
      }
    ],
    "conversationId": "conv_patient_123_1705312200000",
    "status": "active"
  }
}
```

### 2. Send Message
**POST** `/chat/send`

Sends a new message in the chat.

#### Request
```http
POST /api/chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Hello, I need help with my Medicare coverage",
  "patientId": "patient_123",
  "senderId": "user_a_001",
  "conversationId": "conv_patient_123_1705312200000"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "messageId": "msg_002",
    "text": "I can help you with Medicare information. What specific details do you need?",
    "sender": {
      "id": "user_b_001",
      "name": "Patient Support",
      "role": "support",
      "avatar": "🤖"
    },
    "timestamp": "2024-01-15T10:31:00.000Z",
    "messageType": "text",
    "status": "delivered",
    "conversationId": "conv_patient_123_1705312200000",
    "isCompleted": false
  }
}
```

### 3. Check Chat Status
**GET** `/chat/status/:patientId`

Checks the completion status of a chat conversation.

#### Request
```http
GET /api/chat/status/patient_123
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "patientId": "patient_123",
    "isCompleted": false,
    "lastActivity": "2024-01-15T10:31:00.000Z",
    "participants": [
      {
        "id": "user_a_001",
        "name": "Healthcare Provider",
        "role": "provider",
        "avatar": "👨‍⚕️"
      },
      {
        "id": "user_b_001",
        "name": "Patient Support",
        "role": "support",
        "avatar": "🤖"
      }
    ]
  }
}
```

### 4. Get User Information
**GET** `/users/:userId`

Retrieves information about a specific user.

#### Request
```http
GET /api/users/user_a_001
Authorization: Bearer <token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "user_a_001",
    "name": "Healthcare Provider",
    "role": "provider",
    "avatar": "👨‍⚕️"
  }
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('https://your-api-domain.com', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client to Server Events

#### Join Conversation
```javascript
socket.emit('join_conversation', {
  patientId: 'patient_123',
  userId: 'user_a_001'
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  text: 'Hello, I need help',
  patientId: 'patient_123',
  senderId: 'user_a_001'
});
```

#### Typing Indicator
```javascript
// Start typing
socket.emit('typing_start', {
  patientId: 'patient_123',
  userId: 'user_a_001'
});

// Stop typing
socket.emit('typing_stop', {
  patientId: 'patient_123',
  userId: 'user_a_001'
});
```

### Server to Client Events

#### Message Received
```javascript
socket.on('message_received', (data) => {
  console.log('New message:', data);
  // data: {
  //   messageId: 'msg_003',
  //   text: 'How can I help you?',
  //   sender: { id: 'user_b_001', name: 'Patient Support', ... },
  //   timestamp: '2024-01-15T10:32:00.000Z'
  // }
});
```

#### Typing Indicator
```javascript
socket.on('typing_indicator', (data) => {
  console.log('Typing indicator:', data);
  // data: {
  //   type: 'start' | 'stop',
  //   sender: { id: 'user_b_001', name: 'Patient Support', ... },
  //   timestamp: '2024-01-15T10:32:00.000Z'
  // }
});
```

#### Conversation Completed
```javascript
socket.on('conversation_completed', (data) => {
  console.log('Conversation completed:', data);
  // data: {
  //   patientId: 'patient_123',
  //   completedAt: '2024-01-15T10:35:00.000Z'
  // }
});
```

## Data Models

### Message Object
```typescript
interface Message {
  id: string;
  text: string;
  sender: User;
  timestamp: string; // ISO 8601 format
  messageType: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  patientId: string;
  conversationId: string;
}
```

### User Object
```typescript
interface User {
  id: string;
  name: string;
  role: 'provider' | 'support' | 'patient';
  avatar: string; // Emoji or URL
}
```

### Conversation Object
```typescript
interface Conversation {
  id: string;
  patientId: string;
  participants: User[];
  status: 'active' | 'completed' | 'archived';
  lastActivity: string; // ISO 8601 format
  isCompleted: boolean;
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if available"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: User doesn't have permission to access this resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `INTERNAL_ERROR`: Server error

## Rate Limiting
- **API Endpoints**: 100 requests per minute per user
- **WebSocket Messages**: 50 messages per minute per user

## Testing
The frontend includes a mock service that simulates these endpoints. You can use this as a reference for testing your backend implementation.

### Mock Service Location
```
src/services/chatService.js
```

### Testing with Mock Data
The mock service includes realistic conversation flows and can be used to test the frontend while the backend is being developed.

## Implementation Notes

1. **Real-time Updates**: Use WebSocket connections for real-time message delivery
2. **Message Persistence**: Store all messages in a database for history retrieval
3. **User Authentication**: Implement JWT-based authentication
4. **Message Status**: Track message delivery and read status
5. **Conversation Management**: Support multiple participants per conversation
6. **Error Handling**: Implement proper error handling and logging
7. **Security**: Validate all inputs and implement proper authorization checks

## Questions?
For any questions about this specification, please refer to the mock implementation in `src/services/chatService.js` or contact the frontend development team. 