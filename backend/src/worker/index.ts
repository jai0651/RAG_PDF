// import { Queue, Worker, Job } from 'bullmq';
// import { config } from '../config';
// import { Redis } from 'ioredis';
// import { processPDF } from './pdf-processor';
// import { PDFProcessingJob } from '../types';


// // Create Redis connection
// const redisConnection = new Redis(config.REDIS_URL, {
//   maxRetriesPerRequest: null,
// });

// // // Create the PDF processing queue
// // export const pdfQueue = new Queue<PDFProcessingJob>('process-pdf', {
// //   connection: redisConnection,
// // });

// // Initialize worker
// const worker = new Worker<PDFProcessingJob>(
//   'pdf-processing', 
//   async (job: Job<PDFProcessingJob>) => {
//     console.log(`Processing PDF job: ${job.id}, Document ID: ${job.data.documentId}`);
    
//     try {
//       // Process the PDF
//       await processPDF(job.data);
//       console.log(`Completed processing PDF job: ${job.id}`);
//       return { success: true };
//     } catch (error) {
//       console.error(`Error processing PDF job ${job.id}:`, error);
//       throw error;
//     }
//   },
//   {
//     connection: redisConnection,
//     concurrency: 5,
//   }
// );

// // Listen for worker events
// worker.on('completed', (job: Job) => {
//   console.log(`Job ${job.id} completed successfully`);
// });

// worker.on('failed', (job: Job | undefined, error: Error) => {
//   console.error(`Job ${job?.id} failed:`, error);
// });

// // Handle graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('Shutting down worker...');
//   await worker.close();
//   await redisConnection.quit();
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   console.log('Shutting down worker...');
//   await worker.close();
//   await redisConnection.quit();
//   process.exit(0);
// });

// console.log('PDF processing worker started'); 