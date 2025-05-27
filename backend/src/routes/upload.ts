import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config';
import { Document } from '../types';


const router = express.Router();

// Create Redis connection for BullMQ
const redisConnection = new Redis(config.REDIS_URL);

// Create the PDF processing queue
const pdfQueue = new Queue('pdf-processing', {
  connection: redisConnection,
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const userId = req.auth?.userId || 'unknown';
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${uniqueSuffix}${ext}`);
  },
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Route for uploading PDFs
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Create document record
    const documentId = uuidv4();
    const document: Document = {
      id: documentId,
      userId,
      filename: req.file.originalname,
      path: req.file.path,
      createdAt: new Date(),
      status: 'pending',
    };

    // Add job to PDF processing queue
    const job = await pdfQueue.add('process-pdf', {
      documentId,
      userId,
      filePath: req.file.path,
    }, {
      removeOnComplete: true,
      removeOnFail: 10000, // Keep failed jobs for debugging
    });

    console.log(`Enqueued PDF processing job ${job.id} for document ${documentId}`);
    console.log(`PDF processing job ${job.id} created for document ${documentId}`);
    console.log('Document details:', { 
      id: document.id, 
      userId, 
      filename: document.filename, 
      path: document.path 
    });

    // Return response to client
    return res.status(201).json({
      message: 'PDF uploaded successfully and queued for processing',
      document: {
        id: document.id,
        filename: document.filename,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error uploading PDF:', error);
    return res.status(500).json({ error: `Error uploading PDF: ${error.message}` });
  }
});

export const pdfUploadRouter = router; 