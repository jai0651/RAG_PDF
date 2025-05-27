export interface PDFDocument {
  id: string;
  userId: string;
  filename: string;
  path: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface Document {
    id: string;
    userId: string;
    filename: string;
    path: string;
    createdAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }

export interface PDFProcessingJob {
  documentId: string;
  userId: string;
  filePath: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  documentId?: string;
  createdAt: Date;
}

export interface ChatRequest {
  question: string;
  documentId: string;
  userId: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  pageContent: string;
  metadata: {
    documentId: string;
    page?: number;
    [key: string]: any;
  };
} 