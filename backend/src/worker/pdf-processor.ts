import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { TextSplitter } from '@langchain/textsplitters';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import pdfParse from 'pdf-parse';
import { config } from '../config';
import { PDFProcessingJob } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Create Redis connection for BullMQ
const redisConnection = new Redis(config.REDIS_URL);

// Initialize OpenAI embeddings client
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: config.OPENAI_API_KEY,
  modelName: config.OPENAI_EMBEDDING_MODEL,
});

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
  url: config.QDRANT_URL,
  apiKey: config.QDRANT_API_KEY,
});

// Text splitter configuration
const textSplitter: TextSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 300,
});

// Process PDF job accepting either Job or PDFProcessingJob
export async function processPDF(jobData: PDFProcessingJob | Job<PDFProcessingJob>) {
  // Extract the data based on whether it's a Job or just the data
  const data: PDFProcessingJob = 'data' in jobData ? jobData.data : jobData;
  const { documentId, userId, filePath } = data;
  
  console.log(`Processing PDF document ${documentId} (user: ${userId})`);

  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Extract text from PDF
    const { text } = await pdfParse(pdfBuffer);
    
    // Split text into chunks
    const chunks = await textSplitter.splitText(text);
    
    // Generate embeddings for chunks
    const embeddingResults = await embeddings.embedDocuments(chunks);
    
    // Create points for Qdrant with valid UUID ids
    const points = chunks.map((chunk, i) => ({
      id: uuidv4(),
      vector: embeddingResults[i],
      payload: {
        pageContent: chunk,
        documentId,
        userId,
        chunkIndex: i,
      },
    }));
    
    // Upload points to Qdrant
    await qdrantClient.upsert(config.QDRANT_COLLECTION, {
      points,
    });
    
    console.log(`Successfully processed PDF document ${documentId} with ${chunks.length} chunks`);
    
    // Update document status (in a real application, you would update a database)
    return { success: true };
  } catch (error) {
    console.error(`Error processing PDF document ${documentId}:`, error);
    throw error;
  }
}

// Create the worker
const worker = new Worker(
  'pdf-processing',
  async (job) => {
    return processPDF(job);
  },
  { 
    connection: redisConnection,
    concurrency: 5,
  }
);

// Log job progress
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

console.log('PDF processing worker started');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await redisConnection.quit();
  console.log('PDF processing worker shut down gracefully');
  process.exit(0);
}); 