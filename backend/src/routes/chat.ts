import express, { Request, Response } from 'express';
import { z } from 'zod';
import { searchSimilarVectors } from '../services/qdrant';
import { streamChatCompletion } from '../services/openai';

const router = express.Router();

// Request body validation schema
const chatRequestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  documentId: z.string().uuid('Invalid document ID'),
});

// Type for the validated request body
type ChatRequest = z.infer<typeof chatRequestSchema>;

// Route for chat completions
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.format()
      });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { question, documentId } = req.body as ChatRequest;

    // Get relevant context from Qdrant
    const searchResults = await searchSimilarVectors(
      question, 
      documentId, 
      userId, 
      5 // Top 10 most relevant chunks
    );

    if (searchResults.length === 0) {
      return res.status(404).json({
        error: 'No relevant content found for this document',
        message: 'Please make sure the document has been processed'
      });
    }



    // Set up response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Handle client disconnect
    let isClientConnected = true;
    req.on('close', () => {
      isClientConnected = false;
    });

    // Stream the response
    try {
      await streamChatCompletion(question, searchResults, (chunk) => {
        if (isClientConnected) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          // Some Express responses have a flush method, try it if available
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      });

      if (isClientConnected) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error) {
      console.error('Error streaming completion:', error);
      if (isClientConnected) {
        res.write(`data: ${JSON.stringify({ error: 'Error generating response' })}\n\n`);
        res.end();
      }
    }
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({ error: `Error generating chat response: ${error.message}` });
    }
  }
});

export const chatRouter = router;