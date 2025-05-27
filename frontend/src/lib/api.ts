import { useAuth } from '@clerk/clerk-react';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3001/api';

// API client class
export class ApiClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  // Helper method for making authenticated requests
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response;
  }

  // Upload a PDF file
  async uploadPDF(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.fetchWithAuth('/upload', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  // Fetch documents for the current user
  async getDocuments() {
    const response = await this.fetchWithAuth('/documents');
    return response.json();
  }

  // Create EventSource for streaming chat responses
  createChatStream(documentId: string, question: string) {
    const params = new URLSearchParams({
      documentId,
      question,
    });

    return new EventSource(`${API_BASE_URL}/chat?${params.toString()}`, {
      withCredentials: true,
    });
  }

  // Send a chat message
  async sendChatMessage(documentId: string, question: string) {
    const response = await this.fetchWithAuth('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        question,
      }),
    });

    return response;
  }
}

// Hook for using the API client
export function useApi() {
  const { getToken } = useAuth();

  const getApiClient = async () => {
    const token = await getToken();
    return new ApiClient(token || '');
  };

  return { getApiClient };
} 