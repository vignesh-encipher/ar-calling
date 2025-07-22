export const portalUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL;
export const protalClientId = process.env.NEXT_PUBLIC_PORTAL_CLIENTID;
export const portalRedirectUrl = process.env.NEXT_PUBLIC_PORTAL_REDIRECT_URI;
export const serverControl = process.env.NEXT_PUBLIC_NODE_ENV;
export const isEncrypted = process.env.NEXT_PUBLIC_IS_ENCRYPT;
export const salt = process.env.NEXT_PUBLIC_SALT;
export const projectBase = process.env.NEXT_PUBLIC_NODE_ENV;
export const portalPdfUrl = process.env.NEXT_PUBLIC_PDF_PORTAL_BASE_URL;
export const pdfControl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL + "manual-coding-db-service/file/getfile/bytes";
export const buildIdGen = process.env.NEXT_PUBLIC_BUILD_ID;

// API Configuration
export const USE_MOCK_SERVICES = false; // Set to false for real services
export const MOCK_DELAY = 1000; // Delay for mock responses in milliseconds
export const FORCE_MOCK_MODE = false; // Set to false for real API calls

// Socket Configuration
export const SOCKET_BASE_URL = 'wss://26543899bee7.ngrok-free.app'; // Real socket URL

// Mock data configuration
export const MOCK_CONFIG = {
  enableMockSocket: false, // Set to false for real socket
  enableMockAPI: false, // Set to false for real API
  mockDelay: MOCK_DELAY,
  autoSendMessages: true,
  messageInterval: 8000, // Send mock messages every 8 seconds
  typingInterval: 15000, // Show typing indicator every 15 seconds
};
