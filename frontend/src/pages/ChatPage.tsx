import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useApi } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const { getApiClient } = useApi();

  // Extract document ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get('documentId');
    if (docId) {
      setDocumentId(docId);
    }
  }, [location.search]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    if (!documentId) {
      toast({
        title: 'No document selected',
        description: 'Please upload a PDF first to chat with it.',
        variant: 'destructive',
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder for the AI response
      const placeholderId = Date.now().toString() + '-placeholder';
      const placeholderMessage: Message = {
        id: placeholderId,
        role: 'assistant',
        content: '',
      };
      setMessages(prev => [...prev, placeholderMessage]);

      // Get API client
      const apiClient = await getApiClient();
      
      // Start the streaming response
      const response = await apiClient.sendChatMessage(documentId, userMessage.content);
      
      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data:')) continue;
              
              const data = line.replace('data:', '').trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullContent += parsed.text;
                  
                  // Update the placeholder message with the content received so far
                  setMessages(prev => prev.map(msg => 
                    msg.id === placeholderId
                      ? { ...msg, content: fullContent }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
        } finally {
          setIsLoading(false);
        }
      };

      await processStream();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] p-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {documentId ? (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="max-w-md space-y-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-12 w-12 mx-auto text-blue-600 dark:text-blue-400 mb-4"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chat with your PDF</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Ask questions about your document and get answers based on its content.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] shadow-sm ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <ReactMarkdown className="prose dark:prose-invert max-w-none">
                            {message.content || 'Thinking...'}
                          </ReactMarkdown>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your PDF..."
                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md space-y-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">No document selected</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Please upload a PDF document to start chatting with it.
              </p>
              <Button onClick={() => window.location.href = '/upload'}>Upload a PDF</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage; 